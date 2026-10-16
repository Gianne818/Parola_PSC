-- UI-01-SON. Server-maintained implementation/evidence, never a preview flag.
BEGIN;
CREATE TABLE IF NOT EXISTS public.service_capabilities (
  capability_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('planned','implemented','verified','unavailable')),
  summary TEXT NOT NULL,
  evidence_reference TEXT,
  verified_at TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  CONSTRAINT capability_verification_evidence CHECK (status <> 'verified' OR (
    evidence_reference IS NOT NULL AND length(trim(evidence_reference)) > 0
    AND verified_at IS NOT NULL AND valid_until IS NOT NULL AND valid_until > verified_at))
);
ALTER TABLE public.service_capabilities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.service_capabilities FROM PUBLIC, anon, authenticated;

-- These are implementation facts, not claims that this deployment is verified.
INSERT INTO public.service_capabilities(capability_id,status,summary) VALUES
  ('phone_registration','implemented','Owner-only Supabase phone registration and explicit consent; production acceptance is separate.'),
  ('advisory_preferences','implemented','Saved weekdays, Manila time, language and habitat; saving is separate from delivery.'),
  ('regional_language','implemented','Language preferences and stable error codes; reviewed translations are not certified.'),
  ('species_environment','implemented','Exact catalog aliases and explicit unavailable depth/HSI; habitat scores are not species presence.'),
  ('routine_sms','planned','Durable selected-day dispatch is not yet accepted.'),
  ('critical_alerts','planned','Independent critical routing and delivery tracking are not yet accepted.'),
  ('trip_reports','planned','Structured voluntary reports and review are not yet accepted.'),
  ('assisted_registration','unavailable','Assisted registration is disabled.'),
  ('geopacks','planned','Validated exports and device compatibility are not yet accepted.'),
  ('satellite','planned','Satellite transport is deferred; no operational channel is certified.')
ON CONFLICT (capability_id) DO NOTHING;
COMMIT;
