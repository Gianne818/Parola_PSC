-- GEO-01/02 foundation. Prepared only: review/test separately before applying.
-- No datasets, access grants, production activation or account changes are seeded.
BEGIN;

CREATE TABLE public.geographic_dataset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_key TEXT NOT NULL CHECK (length(trim(dataset_key)) BETWEEN 1 AND 120),
  version TEXT NOT NULL CHECK (length(trim(version)) BETWEEN 1 AND 120),
  kind TEXT NOT NULL CHECK (kind IN ('access_area', 'restriction_catalog')),
  authority TEXT NOT NULL CHECK (length(trim(authority)) BETWEEN 1 AND 200),
  source_uri TEXT NOT NULL CHECK (length(trim(source_uri)) BETWEEN 1 AND 2000),
  content_sha256 TEXT NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
  policy_version TEXT NOT NULL CHECK (length(trim(policy_version)) BETWEEN 1 AND 120),
  coverage_geom geometry(MultiPolygon, 4326) NOT NULL,
  coverage_complete BOOLEAN NOT NULL DEFAULT false,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','withdrawn')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL CHECK (valid_until > valid_from),
  UNIQUE (dataset_key, version),
  CHECK (ST_IsValid(coverage_geom) AND NOT ST_IsEmpty(coverage_geom)),
  CHECK (review_status <> 'approved' OR (reviewed_by IS NOT NULL AND length(trim(reviewed_by)) > 0 AND reviewed_at IS NOT NULL))
);

CREATE TABLE public.geographic_exclusion_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES public.geographic_dataset_versions(id) ON DELETE RESTRICT,
  zone_key TEXT NOT NULL CHECK (length(trim(zone_key)) BETWEEN 1 AND 120),
  geom geometry(MultiPolygon, 4326) NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_until TIMESTAMPTZ,
  UNIQUE (dataset_id, zone_key),
  CHECK (effective_until IS NULL OR effective_until > effective_from),
  CHECK (ST_IsValid(geom) AND NOT ST_IsEmpty(geom))
);

CREATE TABLE public.geographic_access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  area_dataset_id UUID NOT NULL REFERENCES public.geographic_dataset_versions(id) ON DELETE RESTRICT,
  restriction_dataset_id UUID NOT NULL REFERENCES public.geographic_dataset_versions(id) ON DELETE RESTRICT,
  verified_by TEXT NOT NULL CHECK (length(trim(verified_by)) BETWEEN 1 AND 200),
  verified_at TIMESTAMPTZ NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL CHECK (valid_until > valid_from),
  revoked_at TIMESTAMPTZ,
  CHECK (revoked_at IS NULL OR revoked_at >= verified_at)
);

CREATE INDEX geographic_coverage_idx ON public.geographic_dataset_versions USING GIST (coverage_geom);
CREATE INDEX geographic_exclusions_idx ON public.geographic_exclusion_zones USING GIST (geom);
CREATE INDEX geographic_grants_owner_idx ON public.geographic_access_grants (user_id, valid_until);

-- Freeze reviewed source/geometry. Revisions require a new version, not an overwrite.
CREATE FUNCTION public.parola_freeze_geographic_dataset() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.review_status <> 'pending' AND
    ((to_jsonb(NEW) - 'review_status') IS DISTINCT FROM (to_jsonb(OLD) - 'review_status')
     OR NEW.review_status <> 'withdrawn') THEN
    RAISE EXCEPTION 'Reviewed geographic versions are immutable; withdraw or create a new version';
  END IF;
  IF NEW.review_status = 'approved' AND EXISTS (
    SELECT 1 FROM public.geographic_exclusion_zones z WHERE z.dataset_id = NEW.id
      AND NOT ST_Covers(NEW.coverage_geom, z.geom)
  ) THEN RAISE EXCEPTION 'Exclusion outside declared coverage'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER freeze_geographic_dataset BEFORE UPDATE ON public.geographic_dataset_versions
  FOR EACH ROW EXECUTE FUNCTION public.parola_freeze_geographic_dataset();

CREATE FUNCTION public.parola_freeze_geographic_zone() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent public.geographic_dataset_versions%ROWTYPE;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    SELECT * INTO parent FROM public.geographic_dataset_versions WHERE id = OLD.dataset_id FOR UPDATE;
    IF parent.review_status <> 'pending' THEN RAISE EXCEPTION 'Reviewed geographic zones are immutable'; END IF;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    SELECT * INTO parent FROM public.geographic_dataset_versions WHERE id = NEW.dataset_id FOR UPDATE;
    IF parent.review_status <> 'pending' OR parent.kind <> 'restriction_catalog'
      OR NOT ST_Covers(parent.coverage_geom, NEW.geom) THEN
      RAISE EXCEPTION 'Zone requires pending restriction coverage containing its geometry';
    END IF;
    RETURN NEW;
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER freeze_geographic_zone BEFORE INSERT OR UPDATE OR DELETE ON public.geographic_exclusion_zones
  FOR EACH ROW EXECUTE FUNCTION public.parola_freeze_geographic_zone();

-- One reusable backend decision for query/SMS/export callers. No legal/GT classification
-- is inferred here: reviewed server grants must already encode the approved scope.
CREATE FUNCTION public.parola_geographic_eligibility(
  profile_id UUID, target_lat DOUBLE PRECISION, target_lon DOUBLE PRECISION, at_time TIMESTAMPTZ
) RETURNS TABLE(status TEXT, reason TEXT) LANGUAGE sql STABLE SECURITY INVOKER AS $$
  WITH point AS (
    SELECT ST_SetSRID(ST_MakePoint(target_lon, target_lat),4326) AS geom
  ), grants AS (
    SELECT g.*, a.coverage_geom AS area_geom, r.coverage_geom AS restriction_geom,
      r.coverage_complete AS restrictions_complete,
      (a.kind = 'access_area' AND a.review_status = 'approved' AND a.reviewed_at <= at_time
       AND a.valid_from <= at_time AND a.valid_until > at_time) AS area_current,
      (r.kind = 'restriction_catalog' AND r.review_status = 'approved' AND r.reviewed_at <= at_time
       AND r.valid_from <= at_time AND r.valid_until > at_time
       AND r.policy_version = a.policy_version) AS restrictions_current
    FROM public.geographic_access_grants g
    JOIN public.users u ON u.id = g.user_id AND u.is_active IS TRUE
    JOIN public.geographic_dataset_versions a ON a.id = g.area_dataset_id
    JOIN public.geographic_dataset_versions r ON r.id = g.restriction_dataset_id
    WHERE g.user_id = profile_id AND g.verified_at <= at_time
      AND g.valid_from <= at_time AND g.valid_until > at_time
      AND (g.revoked_at IS NULL OR g.revoked_at > at_time)
  ), decision AS (
    SELECT CASE
      WHEN at_time IS NULL OR target_lat IS NULL OR target_lon IS NULL
        OR NOT (target_lat BETWEEN -90 AND 90 AND target_lon BETWEEN -180 AND 180)
        OR (target_lat = 0 AND target_lon = 0) THEN 'invalid_coordinates'
      WHEN EXISTS (
        SELECT 1 FROM grants g JOIN public.geographic_exclusion_zones z ON z.dataset_id = g.restriction_dataset_id
        CROSS JOIN point WHERE g.restrictions_current AND z.effective_from <= at_time
          AND (z.effective_until IS NULL OR z.effective_until > at_time) AND ST_Covers(z.geom, point.geom)
      ) THEN 'restricted_area'
      WHEN EXISTS (
        SELECT 1 FROM grants g CROSS JOIN point WHERE g.area_current AND g.restrictions_current AND g.restrictions_complete IS TRUE
          AND ST_Contains(g.area_geom, point.geom) AND ST_Contains(g.restriction_geom, point.geom)
      ) THEN 'allowed'
      WHEN NOT EXISTS (SELECT 1 FROM grants) THEN 'access_unverified'
      WHEN EXISTS (
        SELECT 1 FROM grants g CROSS JOIN point WHERE g.area_current AND ST_Covers(g.area_geom,point.geom)
          AND NOT ST_Contains(g.area_geom,point.geom)
      ) THEN 'boundary_policy_unresolved'
      WHEN EXISTS (SELECT 1 FROM grants WHERE area_current)
        AND NOT EXISTS (SELECT 1 FROM grants g CROSS JOIN point WHERE g.area_current AND ST_Covers(g.area_geom,point.geom))
        THEN 'outside_permitted_area'
      ELSE 'geographic_data_unavailable' END AS reason
  ) SELECT CASE WHEN reason = 'allowed' THEN 'allowed'
      WHEN reason IN ('restricted_area','outside_permitted_area') THEN 'denied' ELSE 'unavailable' END, reason
    FROM decision;
$$;

ALTER TABLE public.geographic_dataset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geographic_exclusion_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geographic_access_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.geographic_dataset_versions, public.geographic_exclusion_zones,
  public.geographic_access_grants FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.geographic_dataset_versions, public.geographic_exclusion_zones,
  public.geographic_access_grants TO service_role;
CREATE POLICY geographic_datasets_backend ON public.geographic_dataset_versions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY geographic_zones_backend ON public.geographic_exclusion_zones FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY geographic_grants_backend ON public.geographic_access_grants FOR ALL TO service_role USING (true) WITH CHECK (true);
REVOKE ALL ON FUNCTION public.parola_geographic_eligibility(UUID,DOUBLE PRECISION,DOUBLE PRECISION,TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.parola_geographic_eligibility(UUID,DOUBLE PRECISION,DOUBLE PRECISION,TIMESTAMPTZ) TO service_role;
REVOKE ALL ON FUNCTION public.parola_freeze_geographic_dataset(), public.parola_freeze_geographic_zone()
  FROM PUBLIC, anon, authenticated;
-- Clients must use authenticated server filtering rather than the legacy table/RPC.
-- Coordinate this access change with consumers before applying; no prediction is deleted.
REVOKE SELECT ON public.daily_grid_predictions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.daily_grid_predictions TO service_role;
DO $$
DECLARE legacy_rpc regprocedure;
BEGIN
  FOR legacy_rpc IN SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_nearest_fishing_hotspot' AND p.prokind = 'f'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', legacy_rpc);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', legacy_rpc);
  END LOOP;
END $$;
COMMIT;
