# Registration demo/live mode

User-selected follow-up to merge #4, October 16, 2026. The existing registration
screen and public.users table are shared by both modes. No new tables or schema
migration. This replaces the earlier proposed separate demo table/browser-only signup.

October 17 follow-up: an optional [backend HTTPS account transport](registration-https.md)
is prepared for networks where PostgreSQL negotiation stalls. Its separate
function migration does not change these authentication rules or account tables;
the function is now installed after explicit authorization. The local backend key
and HTTPS/demo flags are configured in ignored `.env`. The agent's HTTPS
probe was denied with `EACCES`; the user's subsequent terminal health check passed,
confirming the backend key and HTTPS health operation. The user subsequently
reported browser demo signup working; other account round-trips remain unverified.

## Demo (current local configuration)

```dotenv
PAROLA_AUTH_MODE="demo"
PAROLA_DEMO_SESSION_SECRET="" # Set privately to a random value of at least 32 characters.
```

A dedicated random secret and demo flag are configured in ignored .env;
credentials are retained and secrets are never client-exposed. Restart Next.js.
Missing mode defaults to demo; an unknown mode fails rather than enabling live.
Configure the same server variables explicitly in any separately approved demo deployment.

Continue accepts any 1?6 digit code, including 1, 1234 and 999999. There are no
OTP request/verification calls. The standalone OTP test script also exits in demo/mock mode. Registration still makes one API/database write:
POST /api/users/register saves a normal account in public.users. A failed write
or duplicate is shown as an error, with no fake local registration or retry.
Passwords use the existing salted PBKDF2-SHA256 format for login compatibility.

These accounts have auth_user_id and phone_verified_at null and messaging_consent
false. They are application accounts, not Supabase Authentication identities;
phone ownership and live SMS eligibility are not invented. There is no separate
demo table, copied database, provider call or account deletion when modes switch.

Demo registration/login returns auth_mode=demo, contact_verified=false,
messaging_eligible=false and session=null, plus a signed HttpOnly SameSite=Lax
cookie valid for 24 hours (Secure in production). Only that account's unverified
profile can be read/edited with it while the server is in demo mode. The cookie
cannot grant live ownership, consent or dispatch permission. Logout expires it;
passwords are not added to the browser's old offline account store.

## Live

```dotenv
PAROLA_AUTH_MODE="live"
PAROLA_PHONE_AUTH_ENABLED="true"
```

Live registration requests a real SMS OTP, verifies it through the existing Auth
endpoints, collects the explicit optional messaging-consent choice and registers
with the genuine owner's bearer token. It establishes the real Supabase session
and password login. OTP delivery is an explicit action; no automatic resend.
If CAPTCHA is enabled, the browser challenge integration must supply its token;
this change does not bypass CAPTCHA or claim that integration is configured.

A real confirmed phone may link a prior unverified password account with the
same normalized phone. Its existing profile ID, port and preferences are kept;
a verified account is never overwritten by demo signup. Demo cookies stop
working in live mode. An unverified demo account must complete the real OTP flow
before obtaining verified-phone operations or live SMS eligibility.

## Hosted hook and verification limits

The app switch does not change the hosted Supabase hook. A direct Supabase Auth
request outside this app can still reach it. To pause those provider sends, the
project operator separately sets the deployed Edge Function IPROG_MOCK_MODE=true;
the existing hook then fails closed. No remote setting was changed or checked.

Validation uses mocked Auth, database and provider calls with a network-denying
runner. No production database operation, live OTP/SMS test, migration, install,
deployment, merge, commit or push is part of this change. The browser/backend
checks cannot establish deployed database or hosted-hook behavior.

## Local verification

The network-denied application/frontend suite passed 334 tests in 28 files.
After review fixes, all 107 affected OTP/registration/client tests passed,
including four language-copy checks. Full TypeScript, script syntax and whitespace checks passed.
Spec and standards reviews found and fixed premature reload redirects and
misleading live-mode SMS text. SQL linking was inspected, not executed remotely.
ESLint could not start because installed lodash.merge is truncated; no install
or dependency repair was performed.
