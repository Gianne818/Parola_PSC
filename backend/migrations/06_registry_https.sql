-- Server-only HTTPS account storage. Requires migrations 02 and 03, not 05.
-- Additive: no table replacement, deletion, identity backfill, OTP or SMS.
BEGIN;

-- Resolve PostGIS's actual installation schema rather than assume public or
-- extensions. All function/table references remain qualified with search_path=''.
DO $install$
DECLARE
  spatial_schema text;
  definition text;
BEGIN
  SELECT n.nspname INTO spatial_schema FROM pg_catalog.pg_extension e
    JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'postgis';
  IF spatial_schema IS NULL THEN RAISE EXCEPTION 'PostGIS must already be installed'; END IF;
  definition := $definition$
CREATE OR REPLACE FUNCTION public.parola_registry_v1(p_operation text, p_values jsonb)
RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $body$
DECLARE
  expected_count integer;
BEGIN
  -- PostgREST verifies the server credential; ordinary browser JWTs cannot
  -- select actors or demo operations. This function never accepts SQL text.
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Backend service role required';
  END IF;
  expected_count := CASE p_operation
    WHEN 'health' THEN 0 WHEN 'register_demo' THEN 10 WHEN 'register_live' THEN 13
    WHEN 'login_demo' THEN 1 WHEN 'profile_demo' THEN 2 WHEN 'profile_live' THEN 2
    WHEN 'update_demo' THEN 10 WHEN 'update_live' THEN 10
    WHEN 'consent_read' THEN 2 WHEN 'consent_write' THEN 4 WHEN 'sms_eligibility' THEN 3 END;
  IF expected_count IS NULL OR jsonb_typeof(p_values) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Unsupported registry operation or arguments';
  END IF;
  IF jsonb_array_length(p_values) <> expected_count THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Incorrect registry argument count';
  END IF;

  IF p_operation = 'health' THEN
    RETURN NEXT jsonb_build_object('protocol_version', 1, 'transport', 'https');

  ELSIF p_operation = 'register_demo' THEN
    RETURN QUERY WITH saved AS (
      INSERT INTO public.users (phone_number, full_name, home_port_name, home_port_geom, password_hash,
        preferred_advisory_time, advisory_days, preferred_language, habitat_preference,
        auth_user_id, phone_verified_at, messaging_consent)
      VALUES (p_values->>0, p_values->>1, p_values->>2,
        __POSTGIS__.st_setsrid(__POSTGIS__.st_makepoint((p_values->>3)::double precision, (p_values->>4)::double precision),4326),
        p_values->>5, (p_values->>6)::time,
        ARRAY(SELECT jsonb_array_elements_text(p_values->7)::smallint), p_values->>8, p_values->>9,
        NULL, NULL, FALSE)
      RETURNING id, phone_number, full_name, home_port_name, created_at,
        __POSTGIS__.st_y(home_port_geom) AS latitude, __POSTGIS__.st_x(home_port_geom) AS longitude,
        advisory_days, preferred_advisory_time::text, preferred_language, habitat_preference
    ) SELECT to_jsonb(saved) FROM saved;

  ELSIF p_operation = 'register_live' THEN
    RETURN QUERY WITH saved AS (
      INSERT INTO public.users (id, auth_user_id, phone_number, full_name, home_port_name, home_port_geom,
        preferred_advisory_time, phone_verified_at, messaging_consent, messaging_consent_version,
        messaging_consent_at, messaging_consent_actor_id, advisory_days, preferred_language, habitat_preference, password_hash)
      SELECT a.id, a.id, p_values->>1, p_values->>2, p_values->>3,
        __POSTGIS__.st_setsrid(__POSTGIS__.st_makepoint((p_values->>4)::double precision, (p_values->>5)::double precision),4326),
        (p_values->>6)::time, NOW(), (p_values->>7)::boolean, p_values->>8, NOW(), a.id,
        ARRAY(SELECT jsonb_array_elements_text(p_values->9)::smallint), p_values->>10, p_values->>11, p_values->>12
      FROM auth.users a WHERE a.id = (p_values->>0)::uuid AND a.phone_confirmed_at IS NOT NULL
        AND public.parola_phone_e164(a.phone) = p_values->>1
      ON CONFLICT (phone_e164) DO UPDATE SET
        auth_user_id = EXCLUDED.auth_user_id, phone_verified_at = EXCLUDED.phone_verified_at,
        messaging_consent = EXCLUDED.messaging_consent, messaging_consent_version = EXCLUDED.messaging_consent_version,
        messaging_consent_at = EXCLUDED.messaging_consent_at, messaging_consent_actor_id = EXCLUDED.messaging_consent_actor_id,
        password_hash = COALESCE(EXCLUDED.password_hash, public.users.password_hash), updated_at = NOW()
      WHERE public.users.auth_user_id IS NULL AND public.users.phone_verified_at IS NULL
        AND public.users.messaging_consent IS FALSE AND public.users.password_hash IS NOT NULL
      RETURNING id, phone_number, full_name, home_port_name, created_at,
        messaging_consent, messaging_consent_version, messaging_consent_at,
        advisory_days, preferred_advisory_time::text, preferred_language, habitat_preference,
        (is_active IS TRUE AND messaging_consent) AS messaging_eligible
    ) SELECT to_jsonb(saved) FROM saved;

  ELSIF p_operation = 'login_demo' THEN
    -- Only the backend receives the hash; the API checks it and removes it.
    RETURN QUERY SELECT to_jsonb(r) FROM (
      SELECT id, phone_number, full_name, home_port_name, password_hash,
        __POSTGIS__.st_y(home_port_geom) AS latitude, __POSTGIS__.st_x(home_port_geom) AS longitude,
        advisory_days, preferred_advisory_time::text, preferred_language, habitat_preference
      FROM public.users WHERE phone_e164 = p_values->>0
        AND auth_user_id IS NULL AND phone_verified_at IS NULL AND messaging_consent IS FALSE
    ) r;

  ELSIF p_operation IN ('profile_demo','profile_live','update_demo','update_live') THEN
    -- Demo authority is a verified server cookie; live authority is the real
    -- Auth owner. Repeat ownership checks at the actual read/write boundary.
    IF p_operation IN ('update_demo','update_live') THEN
      RETURN QUERY WITH saved AS (
        UPDATE public.users u SET
          full_name = COALESCE(p_values->>2, u.full_name), home_port_name = COALESCE(p_values->>3, u.home_port_name),
          home_port_geom = CASE WHEN p_values->>4 IS NULL THEN u.home_port_geom ELSE
            __POSTGIS__.st_setsrid(__POSTGIS__.st_makepoint((p_values->>4)::double precision, (p_values->>5)::double precision),4326) END,
          preferred_advisory_time = COALESCE((p_values->>6)::time, u.preferred_advisory_time),
          advisory_days = CASE WHEN p_values->7 = 'null'::jsonb THEN u.advisory_days ELSE
            ARRAY(SELECT jsonb_array_elements_text(p_values->7)::smallint) END,
          preferred_language = COALESCE(p_values->>8, u.preferred_language),
          habitat_preference = COALESCE(p_values->>9, u.habitat_preference), updated_at = NOW()
        WHERE u.phone_e164 = p_values->>1 AND (
          (p_operation = 'update_demo' AND u.id = (p_values->>0)::uuid
            AND u.auth_user_id IS NULL AND u.phone_verified_at IS NULL AND u.messaging_consent IS FALSE)
          OR (p_operation = 'update_live' AND u.auth_user_id = (p_values->>0)::uuid AND EXISTS (
            SELECT 1 FROM auth.users a WHERE a.id = u.auth_user_id AND a.phone_confirmed_at IS NOT NULL
              AND public.parola_phone_e164(a.phone) = p_values->>1)))
        RETURNING u.id, u.phone_number, u.full_name, u.home_port_name,
          __POSTGIS__.st_y(u.home_port_geom) AS latitude, __POSTGIS__.st_x(u.home_port_geom) AS longitude,
          u.advisory_days, u.preferred_advisory_time::text, u.preferred_language, u.habitat_preference,
          u.is_active, u.messaging_consent, u.messaging_consent_version, u.messaging_consent_at
      ) SELECT to_jsonb(saved) FROM saved;
    ELSE
      RETURN QUERY SELECT to_jsonb(r) FROM (
        SELECT u.id, u.phone_number, u.full_name, u.home_port_name,
          __POSTGIS__.st_y(u.home_port_geom) AS latitude, __POSTGIS__.st_x(u.home_port_geom) AS longitude,
          u.advisory_days, u.preferred_advisory_time::text, u.preferred_language, u.habitat_preference,
          u.is_active, u.messaging_consent, u.messaging_consent_version, u.messaging_consent_at
        FROM public.users u WHERE u.phone_e164 = p_values->>1 AND (
          (p_operation = 'profile_demo' AND u.id = (p_values->>0)::uuid
            AND u.auth_user_id IS NULL AND u.phone_verified_at IS NULL AND u.messaging_consent IS FALSE)
          OR (p_operation = 'profile_live' AND u.auth_user_id = (p_values->>0)::uuid AND EXISTS (
            SELECT 1 FROM auth.users a WHERE a.id = u.auth_user_id AND a.phone_confirmed_at IS NOT NULL
              AND public.parola_phone_e164(a.phone) = p_values->>1)))
      ) r;
    END IF;

  ELSIF p_operation = 'consent_read' THEN
    RETURN QUERY SELECT to_jsonb(r) FROM (
      SELECT messaging_consent, messaging_consent_version, messaging_consent_at
      FROM public.users WHERE auth_user_id = (p_values->>0)::uuid AND phone_e164 = p_values->>1
    ) r;

  ELSIF p_operation = 'consent_write' THEN
    RETURN QUERY WITH saved AS (
      UPDATE public.users u SET messaging_consent = (p_values->>2)::boolean,
        messaging_consent_version = p_values->>3,
        messaging_consent_at = CASE WHEN u.messaging_consent IS DISTINCT FROM (p_values->>2)::boolean
          OR u.messaging_consent_version IS DISTINCT FROM p_values->>3 THEN NOW() ELSE u.messaging_consent_at END,
        messaging_consent_actor_id = (p_values->>0)::uuid,
        updated_at = CASE WHEN u.messaging_consent IS DISTINCT FROM (p_values->>2)::boolean
          OR u.messaging_consent_version IS DISTINCT FROM p_values->>3 THEN NOW() ELSE u.updated_at END
      FROM auth.users a WHERE u.auth_user_id = (p_values->>0)::uuid AND a.id = u.auth_user_id
        AND u.phone_e164 = p_values->>1 AND u.phone_verified_at IS NOT NULL AND a.phone_confirmed_at IS NOT NULL
        AND public.parola_phone_e164(a.phone) = p_values->>1
      RETURNING u.messaging_consent, u.messaging_consent_version, u.messaging_consent_at,
        (u.is_active IS TRUE AND u.messaging_consent) AS messaging_eligible
    ) SELECT to_jsonb(saved) FROM saved;

  ELSIF p_operation = 'sms_eligibility' THEN
    RETURN NEXT jsonb_build_object('eligible', public.parola_sms_recipient_eligible(
      p_values->>0, p_values->>1, (p_values->>2)::uuid));
  END IF;
  RETURN;
END;
$body$;
$definition$;
  EXECUTE replace(definition, '__POSTGIS__', quote_ident(spatial_schema));
END;
$install$;

REVOKE ALL ON FUNCTION public.parola_registry_v1(text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.parola_registry_v1(text,jsonb) TO service_role;
COMMENT ON FUNCTION public.parola_registry_v1(text,jsonb) IS
  'Backend-only named registry operations over HTTPS. Never grant to browsers. Demo operations do not verify phones or consent.';
NOTIFY pgrst, 'reload schema';
COMMIT;
