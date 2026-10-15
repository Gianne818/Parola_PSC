# Supabase phone OTP through iPROG

REG-02-SON. Supabase generates/verifies the code; the `send-sms` Edge Function
delivers the signed Auth event through the existing iPROG account. This is separate
from advisory dispatch and the legacy incoming feedback webhook. The function
does not change registration, consent, or confirmed-phone records.

## Deploy from the Supabase dashboard

1. Open your project > **Edge Functions** > **Deploy a new function** > **Via Editor**.
2. Name the function **send-sms**. Replace the generated `index.ts` with the complete
   contents of [`supabase/functions/send-sms/index.ts`](../supabase/functions/send-sms/index.ts).
   It is a single file using built-in Node compatibility modules; no npm install is needed.
3. Deploy it. In the function settings, turn **Verify JWT** off. The function
   authenticates requests using Supabase Auth's Standard Webhooks signature.
   Local CLI deployments use the equivalent `verify_jwt = false` in `supabase/config.toml`.
4. Under **Edge Functions > Secrets**, set `IPROG_API_KEY` to your existing key,
   `IPROG_MOCK_MODE` to `false`, and optionally `IPROG_SENDER_NAME` to your approved
   sender name. Leave the sender empty if masking is unavailable. The endpoint
   defaults to `https://sms.iprogtech.com/api/v1/sms_messages`; other endpoints are rejected.
5. Copy the deployed function URL. For the usual hosted project it is
   `https://<project-ref>.supabase.co/functions/v1/send-sms`.

## Connect the Auth hook

1. Keep the Phone provider enabled. Under **Authentication > Hooks**, create a
   **Send SMS** HTTP hook with the deployed function URL.
2. Generate the hook signing secret. Store the **entire** `v1,whsec_...` value as
   `SEND_SMS_HOOK_SECRET` in **Edge Functions > Secrets**, then save/enable the hook.
   The function fails closed until this secret is configured. This secret is
   separate from the API key, service-role key and existing `SMS_WEBHOOK_SECRET`.
3. Configure a six-digit SMS OTP to match Parola's current verification route.
   Do not enter iPROG credentials in the Twilio settings: the enabled Send SMS hook
   replaces the built-in sender.
4. Configure Auth rate limits and CAPTCHA before making the phone sign-in public.
   The hook URL itself is for Supabase Auth, not browser requests.

## CLI alternative

From the repository root, with Node/npm and a Supabase deployment login:

```powershell
npx.cmd supabase login
npx.cmd supabase functions deploy send-sms --project-ref YOUR_PROJECT_REF --no-verify-jwt
```

Copy `supabase/.env.sms-hook.example` to `supabase/.env.sms-hook.local`, fill only
those secrets, then upload them (after creating the signing secret):

```powershell
npx.cmd supabase secrets set --project-ref YOUR_PROJECT_REF --env-file supabase/.env.sms-hook.local
```

The normal app Supabase anon/service-role keys cannot deploy an Edge Function.
Never commit the filled secrets file or publish it as a build artifact.

## Verify the integration

The user deployed the dashboard function at
`https://aafqdvhfycqbsvmvaxmz.supabase.co/functions/v1/smooth-action`
and reports configuring the Auth hook to that exact URL, adding all three required
secrets and disabling Verify JWT. The deployed URL slug differs from the display
name `send-sms`; always copy the actual deployed URL. On October 15, 2026, the
user supplied successful terminal output from the test script: real SMS receipt,
confirmed phone verification and session issuance passed. Session tokens were not
printed or saved. The user reports one SMS on the successful repeat test; the
cause of earlier multiple messages remains unconfirmed. This smoke test does not
prove profile/consent persistence, portal integration or production readiness.

To test Auth and iPROG before connecting the portal UI, run from the repository root:

```powershell
node scripts/test-supabase-otp.mjs
```

This uses the public Supabase URL/anon key already in `.env` or `.env.local` and
prompts locally for your own phone number and the received OTP. It requests one
real SMS, verifies the code with Supabase and reports success without printing or
saving tokens. It may create an Auth user, but does not create a Parola profile or
record advisory consent. With CAPTCHA enabled, use the browser flow instead.
It does not require a running Next.js server or enable the app phone-auth flag.

The local handler tests cover actual HMAC verification, expired/future/forged
signatures, phone/code validation, mock/config rejection, provider rejection,
sender-name fallback and the 3.5-second shared provider timeout. They do not send SMS.
The signature format follows [Supabase HTTP Auth hooks](https://supabase.com/docs/guides/auth/auth-hooks)
and [Standard Webhooks](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md).

After the hook is deployed and connected, set `PAROLA_PHONE_AUTH_ENABLED=true` in
the **app backend** environment and restart it. Leave it disabled before then.
With your own Philippine mobile number, call:

```text
POST /api/auth/otp/request
{"phone_number":"+639XXXXXXXXX"}

POST /api/auth/otp/verify
{"phone_number":"+639XXXXXXXXX","code":"the six-digit code received"}
```

Supply `captcha_token` on request when CAPTCHA is enabled. Verify that the real
code creates a session and an incorrect code fails. Requesting a real OTP consumes
iPROG credits. Provider acceptance means submitted, not handset delivery.
The registration migration and Tier's UI integration remain separate prerequisites
for saving a complete profile and using this flow through the portal.

## Operational limits

If an earlier deployment returns `hook_payload_invalid_content_type`, replace its
empty success response with `Response.json({}, { status: 200, headers: { 'Cache-Control': 'no-store' } })`
and redeploy the same function. Supabase's HTTP hook response needs JSON content
type and a JSON object even when there are no output fields. The handler's
regression test asserts this response contract. An SMS may already have been
submitted before Auth rejected the old hook response; verify using a fresh request
after deploying the fix.

Only signed Philippine-phone events with six-digit OTPs are accepted. Provider
response bodies, phone numbers, API keys and OTPs are never logged or echoed.
The hook has no durable deduplication store; a signed Auth retry may submit the
same OTP more than once. No retry follows an ambiguous network/timeout response;
one fallback without sender masking is permitted after an explicit rejection,
within the same 3.5-second budget. Never use a scheduled advisory workflow to send OTPs.

References: [custom SMS hook](https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook),
[webhook function security](https://supabase.com/docs/guides/functions/auth),
[deployment](https://supabase.com/docs/guides/functions/deploy),
[function secrets](https://supabase.com/docs/guides/functions/secrets).
