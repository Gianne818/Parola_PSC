# SMS demo mode

Son selected simulated SMS to conserve credits; live provider/Auth logic is retained.
Branch `codex/son/sms-demo`. No migration is required.

## Current app configuration

```dotenv
PAROLA_SMS_MODE="demo"
IPROG_MOCK_MODE="true"
```

These values are set in ignored `.env.local`. Restart Next.js to load them; use
the same settings in any deployment used for demos. Missing/unknown SMS mode also
selects demo. The runtime admin toggle cannot bypass it (409 `sms_demo_locked`).

Advisory sends return `MOCK_DRY_RUN`, `simulated: true`, `delivered: false` and
`creditsUsed: 0` without calling iPROG. No provider balance is fabricated.

## Independent frontend demo and API preview

Tier owns the isolated frontend demo in PR #5. It does not depend on the API
preview or need real Supabase Auth/iPROG calls. PR #6 removes only its own outdated
`AuthPage.tsx` comparison change; it does not import or overwrite Tier's frontend.
Tier controls frontend demo inputs, local state and presentation.

Separately, Son's `POST /api/auth/otp/request` preview returns HTTP 202 with
`demo_code_requested` and example code `482910`. In demo mode,
`POST /api/auth/otp/verify` accepts any six-digit string, such as `000000`, and
returns HTTP 200 with `demo_code_checked`, `contact_verified: false` and
`session: null`. These API responses call neither Supabase Auth nor iPROG.
Live mode still requires the real OTP.

Neither demo may create real authentication, claim phone verification, authorize
real registration or enroll live SMS recipients. Browser demo state is not an
Auth session or evidence of phone ownership. If Tier later chooses to consume
the API preview, it must preserve these distinct response shapes and preview
labels rather than treat success as verified login. Existing genuine sessions
retain normal owner checks. The real OTP test script exits without requesting
an SMS while demo/mock mode is enabled.

## Hosted hook is configured separately

The hosted Supabase Send SMS hook has its own environment. App `.env.local`,
`PAROLA_SMS_MODE`, runtime toggles and Tier's browser demo cannot prevent a direct
Supabase Auth request from reaching that hook.

Before allowing direct Auth traffic during a demo, the project operator must set
**Supabase > Edge Functions > Secrets > IPROG_MOCK_MODE** to the value `true`
(without quotation marks). This must apply to the actual deployed hook endpoint,
currently `/functions/v1/smooth-action`. The existing hook fails closed with HTTP
503 before any iPROG request unless its own `IPROG_MOCK_MODE` is exactly `false`;
it does not simulate successful delivery or verification. Direct Auth OTP flows
will therefore be unavailable while it is paused.

This is an operator handoff only: this PR does not change or verify remote
settings, deploy functions or send a live test. Keep provider credentials and
signed-hook validation intact. Review hosted configuration separately before
demonstrating; local mocked checks cannot prove that deployed hook is paused.

## Restore live operation

```dotenv
PAROLA_SMS_MODE="live"
IPROG_MOCK_MODE="false"
PAROLA_PHONE_AUTH_ENABLED="true"
```

Restore the hosted hook's IPROG_MOCK_MODE to `false` if it was paused, then restart/
redeploy the app. Original iPROG dispatch, real OTP/session issuance and owner/
consent checks remain intact. Mode changes do not create readiness evidence.
