-- SMS-01 scheduling only. Apply after 02 and 03 with separate authorization.
-- No trigger, cron, message, provider call or existing-account changes.
BEGIN;

CREATE TABLE IF NOT EXISTS public.routine_advisory_jobs (
  user_id UUID NOT NULL REFERENCES public.users(id),
  advisory_date DATE NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  preferred_language TEXT NOT NULL CHECK (preferred_language IN ('en','tl','ceb','hil')),
  habitat_preference TEXT NOT NULL CHECK (habitat_preference IN ('pelagic','demersal','both')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, advisory_date),
  CHECK ((scheduled_for AT TIME ZONE 'Asia/Manila')::date = advisory_date)
);

CREATE INDEX IF NOT EXISTS routine_advisory_jobs_due
  ON public.routine_advisory_jobs (scheduled_for) WHERE status = 'pending';

ALTER TABLE public.routine_advisory_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.routine_advisory_jobs FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.routine_advisory_jobs TO service_role;
DROP POLICY IF EXISTS routine_jobs_backend_only ON public.routine_advisory_jobs;
CREATE POLICY routine_jobs_backend_only ON public.routine_advisory_jobs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.routine_advisory_jobs IS
  'One unsent routine request per profile/Manila date. No delivery claim. Future dispatch must recheck consent, preferences, safety, data and geographic eligibility. Critical alerts are independent.';
COMMIT;
