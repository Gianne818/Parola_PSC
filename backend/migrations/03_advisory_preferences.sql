-- REG-01-SON. Apply after 02_verified_registration.sql. No SMS is sent.
-- Existing advisory times and consent are preserved. No weekdays are inferred.
BEGIN;

CREATE OR REPLACE FUNCTION public.parola_valid_advisory_days(days SMALLINT[])
RETURNS BOOLEAN LANGUAGE sql IMMUTABLE STRICT SET search_path = '' AS $$
  SELECT cardinality(days) <= 5
    AND (cardinality(days) = 0 OR (array_ndims(days) = 1 AND array_lower(days, 1) = 1))
    AND NOT EXISTS (SELECT 1 FROM unnest(days) AS day WHERE day IS NULL OR day < 1 OR day > 7)
    AND cardinality(days) = (SELECT count(DISTINCT day) FROM unnest(days) AS day);
$$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS advisory_days SMALLINT[] NOT NULL DEFAULT '{}'::SMALLINT[],
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS habitat_preference TEXT NOT NULL DEFAULT 'both';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.users'::regclass AND conname='users_advisory_days_valid') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_advisory_days_valid CHECK (public.parola_valid_advisory_days(advisory_days));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.users'::regclass AND conname='users_preferred_language_valid') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_preferred_language_valid CHECK (preferred_language IN ('en','tl','ceb','hil'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.users'::regclass AND conname='users_habitat_preference_valid') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_habitat_preference_valid CHECK (habitat_preference IN ('pelagic','demersal','both'));
  END IF;
END $$;

COMMENT ON COLUMN public.users.advisory_days IS 'ISO weekdays 1=Monday..7=Sunday; empty pauses routine advisories, not critical alerts. Asia/Manila time.';
COMMENT ON COLUMN public.users.preferred_language IS 'Requested advisory language. This preference does not certify translation coverage.';
COMMENT ON COLUMN public.users.habitat_preference IS 'Habitat preference only; does not establish target availability or marine entitlement.';

COMMIT;
