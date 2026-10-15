-- REG-02-SON. Apply after 01_schema.sql in Supabase, before the new routes.
-- Transactional and non-destructive: no legacy identity/consent is inferred.
BEGIN;

CREATE OR REPLACE FUNCTION public.parola_phone_e164(value TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE STRICT SET search_path = '' AS $$
  SELECT CASE
    WHEN length(value) <= 32 AND regexp_replace(value, '[\s()-]', '', 'g') ~ '^(09[0-9]{9}|9[0-9]{9}|\+?639[0-9]{9})$'
    THEN '+63' || right(regexp_replace(value, '[^0-9]', '', 'g'), 10)
    ELSE NULL END;
$$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS phone_e164 TEXT GENERATED ALWAYS AS (public.parola_phone_e164(phone_number)) STORED,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS messaging_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS messaging_consent_version TEXT,
  ADD COLUMN IF NOT EXISTS messaging_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS messaging_consent_actor_id UUID REFERENCES auth.users(id);

-- Fail for reviewed reconciliation instead of deleting duplicate legacy accounts.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.users WHERE phone_e164 IS NOT NULL GROUP BY phone_e164 HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Duplicate normalized phones require reviewed reconciliation before REG-02 migration';
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_e164 ON public.users(phone_e164);

CREATE TABLE IF NOT EXISTS public.registration_consent_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  messaging_consent BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.parola_record_consent()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF ROW(NEW.messaging_consent, NEW.messaging_consent_version, NEW.messaging_consent_at, NEW.messaging_consent_actor_id)
      IS NOT DISTINCT FROM ROW(OLD.messaging_consent, OLD.messaging_consent_version, OLD.messaging_consent_at, OLD.messaging_consent_actor_id)
    THEN RETURN NEW; END IF;
  END IF;
  -- Legacy inserts cannot imply consent, and do not manufacture audit evidence.
  IF NEW.auth_user_id IS NULL AND NOT NEW.messaging_consent THEN RETURN NEW; END IF;
  IF NEW.auth_user_id IS NULL OR NEW.messaging_consent_actor_id IS DISTINCT FROM NEW.auth_user_id
    OR NEW.phone_verified_at IS NULL OR NEW.messaging_consent_at IS NULL
    OR NEW.messaging_consent_version IS NULL OR NOT EXISTS (
      SELECT 1 FROM auth.users a WHERE a.id = NEW.auth_user_id
        AND a.phone_confirmed_at IS NOT NULL
        AND public.parola_phone_e164(a.phone) = NEW.phone_e164
    ) THEN RAISE EXCEPTION 'Confirmed owner and explicit consent provenance required'; END IF;
  INSERT INTO public.registration_consent_events(user_id, actor_id, messaging_consent, consent_version)
    VALUES (NEW.id, NEW.messaging_consent_actor_id, NEW.messaging_consent, NEW.messaging_consent_version);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS registration_consent_audit ON public.users;
CREATE TRIGGER registration_consent_audit AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.parola_record_consent();

-- Self-service reads only. Profile/consent writes must use owner-checked APIs;
-- an authenticated client must not write verification/consent columns directly.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users FOR SELECT TO authenticated USING (auth.uid() = auth_user_id);
DROP POLICY IF EXISTS users_update_own ON public.users;
REVOKE INSERT, UPDATE, DELETE ON public.users FROM anon, authenticated;
GRANT SELECT ON public.users TO authenticated;

ALTER TABLE public.registration_consent_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.registration_consent_events FROM anon, authenticated;
GRANT SELECT ON public.registration_consent_events TO authenticated;
DROP POLICY IF EXISTS consent_events_select_own ON public.registration_consent_events;
CREATE POLICY consent_events_select_own ON public.registration_consent_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = user_id AND u.auth_user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.parola_sms_recipient_eligible(phone TEXT, consent_version TEXT, owner_id UUID DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u JOIN auth.users a ON a.id = u.auth_user_id
    WHERE u.phone_e164 = public.parola_phone_e164(phone)
      AND a.phone_confirmed_at IS NOT NULL AND public.parola_phone_e164(a.phone) = u.phone_e164
      AND u.phone_verified_at IS NOT NULL AND u.is_active IS TRUE
      AND u.messaging_consent IS TRUE AND u.messaging_consent_version = consent_version
      AND u.messaging_consent_at IS NOT NULL AND u.messaging_consent_actor_id = u.auth_user_id
      AND (owner_id IS NULL OR u.auth_user_id = owner_id)
  );
$$;
REVOKE ALL ON FUNCTION public.parola_sms_recipient_eligible(TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.parola_sms_recipient_eligible(TEXT, TEXT, UUID) TO service_role;
REVOKE ALL ON FUNCTION public.parola_record_consent() FROM PUBLIC, anon, authenticated;

COMMIT;
