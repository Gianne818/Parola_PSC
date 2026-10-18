-- Tracking only; apply after 07 with separate database authorization.
-- Installs no sender, callback endpoint, trigger or timer.
BEGIN;
ALTER TABLE public.routine_advisory_jobs DROP CONSTRAINT routine_advisory_jobs_status_check;
ALTER TABLE public.routine_advisory_jobs ADD CONSTRAINT routine_advisory_jobs_status_check
  CHECK (status IN ('pending','cancelled','claimed','submitted','delivered','delivery_failed','rejected','unknown'));

CREATE TABLE public.routine_delivery_attempts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  advisory_date DATE NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('claimed','submitted','delivered','delivery_failed','rejected','unknown')),
  provider_message_id TEXT UNIQUE CHECK (length(provider_message_id) BETWEEN 1 AND 200),
  started_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (user_id, advisory_date) REFERENCES public.routine_advisory_jobs(user_id, advisory_date),
  UNIQUE (user_id, advisory_date),
  CHECK (state NOT IN ('submitted','delivered','delivery_failed') OR provider_message_id IS NOT NULL)
);

CREATE TABLE public.routine_delivery_receipts (
  event_id TEXT PRIMARY KEY CHECK (length(event_id) BETWEEN 1 AND 200),
  attempt_id UUID NOT NULL REFERENCES public.routine_delivery_attempts(id),
  state TEXT NOT NULL CHECK (state IN ('delivered','delivery_failed')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

ALTER TABLE public.routine_delivery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_delivery_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.routine_delivery_attempts, public.routine_delivery_receipts FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.routine_delivery_attempts TO service_role;
GRANT SELECT, INSERT ON public.routine_delivery_receipts TO service_role;
CREATE POLICY routine_attempts_backend_only ON public.routine_delivery_attempts
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY routine_receipts_backend_only ON public.routine_delivery_receipts
  FOR ALL TO service_role USING (true) WITH CHECK (true);
COMMENT ON TABLE public.routine_delivery_attempts IS
  'Tracking only. One attempt per routine profile/day; unknown outcomes never authorize automatic resend. No real SMS sender is installed.';
COMMIT;
