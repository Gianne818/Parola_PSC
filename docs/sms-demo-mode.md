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

OTP previews return `demo_code_requested` and example code `482910`. Any
six-digit number (for example `000000`, `123456` or `999999`) passes in demo
mode, including the existing preview screen. It returns `demo_code_checked`,
`contact_verified: false`, `session: null`. Live mode still requires the real OTP.
Neither calls Supabase Auth. Demo codes cannot authorize real registration,
establish phone ownership or enroll live recipients. Tier must preserve preview
labels and handle this distinct response shape. Existing genuine sessions retain
normal owner checks. The real OTP test script exits without requesting an SMS
while demo/mock mode is enabled.

## Hosted hook is configured separately

Local settings do not change the deployed Supabase Send SMS hook. To stop billing
from direct Supabase Auth requests too, set **Edge Functions > Secrets >
IPROG_MOCK_MODE** to `true` in Supabase. The existing hook rejects sending in that
mode instead of falsely claiming delivery. The agent has not changed/verified
that remote secret. No Edge Function code or provider credentials need deleting.

## Restore live operation

```dotenv
PAROLA_SMS_MODE="live"
IPROG_MOCK_MODE="false"
PAROLA_PHONE_AUTH_ENABLED="true"
```

Restore the hosted hook's IPROG_MOCK_MODE to `false` if it was paused, then restart/
redeploy the app. Original iPROG dispatch, real OTP/session issuance and owner/
consent checks remain intact. Mode changes do not create readiness evidence.
