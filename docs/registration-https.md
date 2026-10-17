# Account storage over HTTPS

Son / SON-01 (REG-01, REG-02), October 17, 2026.

## Why this exists

The user's Node and independent Python probes connected by TCP but received no
PostgreSQL SSL reply on either pooler address, on ports 5432 and 6543. Supabase
HTTPS returned HTTP 401 without credentials. The dashboard showed all IPs allowed.
These observations narrow the failure to the PostgreSQL connection path; they
do not prove the mobile carrier is responsible or that authenticated HTTPS
database operations work. Local security and remote pooler causes remain possible.

This optional transport sends account operations from the Next.js backend to a
restricted Supabase database function over HTTPS. It uses the same `public.users`
rows, IDs, password hashes, preferences, ownership and consent rules. There is no
new account table or browser database credential. The default remains `postgres`
until the operator applies migration 06 and explicitly selects `https`.

## Prepare and enable

Migration 06 was applied to Parola through the authorized Supabase MCP connection
on October 17, 2026. Database health and the internal role guard passed; anonymous
and authenticated roles cannot execute the function, while service_role can.
The empty search path is installed and the existing account count stayed at two.
No account fixture, Auth, OTP or SMS operation was requested. The user-provided
backend credential is now stored in ignored `.env`, and the local transport
is explicitly `https` with authentication mode `demo`. The agent's HTTPS probe
was denied with `EACCES`. Subsequently, the user ran the health helper from their
ordinary terminal and supplied PASS: backend credentials and the installed
registry HTTPS health operation were accepted. The user subsequently reported
browser demo registration working. Separate login/reload/preferences round-trips
remain unverified.

At the user's request, `.env.local` was consolidated into `.env`, with its values
winning both overlapping keys. All 29 effective Next.js settings stayed identical,
including HTTPS transport and demo mode. The original files are retained in a
Git-ignored local backup; only `.env` is now active. Keep it out of Git.

The user explicitly selected `DB_SSL_INSECURE=true` for the app's PostgreSQL
helper and teammate example configuration. This bypasses loading a local CA file
in development and production. Setting it to false still enables the optional
CA-file/inline-CA support. HTTPS registry transport and demo auth remain selected;
the migration runner retains its existing verified-TLS behavior.

1. Review [06_registry_https.sql](../backend/migrations/06_registry_https.sql).
   It requires the existing registration migrations 02 and 03 and PostGIS;
   ingestion migration 05 is unrelated. In a separately authorized database
   change, run the complete migration in the project's Supabase SQL Editor.
   It creates/replaces one function, restricts execution to `service_role`, and
   reloads the Data API schema cache. It does not replace tables or change users.
2. Keep the project URL and server credential in the backend's ignored env file.
   `NEXT_PUBLIC_SUPABASE_URL` is the project HTTPS URL.
   `SUPABASE_SERVICE_ROLE_KEY` holds a backend secret key (`sb_secret_...`) or
   legacy service-role key. An anon/publishable key cannot execute this function.
   Never put the server credential in a `NEXT_PUBLIC_` variable, browser code,
   Git, screenshots or chat. Each teammate needs authorized backend configuration.
3. Run this explicit health check from the repository with Node 24 or later:

   ```powershell
   node scripts/check-registration-https.mjs
   ```

   It checks the installed function and backend authorization only. It does not
   access accounts, send SMS or establish that registration SQL passes.
4. The local backend's ignored env file is now configured as follows. On another
   backend, configure these only after installing the function and backend key:

   ```dotenv
   PAROLA_REGISTRY_TRANSPORT="https"
   PAROLA_AUTH_MODE="demo"
   ```

   Keep the existing private demo-session secret. Confirm health from the user's
   terminal, then restart the existing Next.js server once. To return to the old
   transport, select `postgres` and restart;
   this neither rolls back accounts nor repairs a blocked PostgreSQL connection.
5. With separately authorized account fixtures, verify demo signup, password
   login, logout/reload and preference edits against this same database. A failed
   or interrupted save stays an error. If a write times out, it may have committed:
   try signing in before resubmitting registration. Never automatically switch
   transports or retry an ambiguous write.

The normal frontend screens and `/api/users/*` requests stay unchanged. Tier
does not need a second auth interface or direct database access. A teammate's
local server must have the same backend setup; mobile networking still needs
working DNS and HTTPS access. This is not an offline account store.

## Authentication and scope

- Live signup returns an owner-checked canonical profile after the account write,
  using the existing `profile_live` operation. This includes saved coordinates
  even with the original installed registration RPC. No migration is needed for
  this compatibility fix. A failed readback returns `profile_readback_unavailable`
  and tells the user to sign in before registering again; the saved write is not
  retried. Demo password login includes schedule metadata immediately.
- Demo accepts the existing 1–6 digit code and does not call OTP/Auth providers.
  Saved accounts remain unverified, without a Supabase Auth identity or messaging
  consent. Only the signed server cookie authorizes the account's demo profile.
- Live registration, profile and consent use real Supabase ownership and confirmed
  phone checks. Switching transports grants no verification or dispatch authority.
  Live password login retains its existing FastAPI dependency; this change does
  not certify that journey or migrate it to a new authentication protocol.
- HTTPS covers demo registration/login, live registration, canonical profile
  read/update, consent read/update and recipient eligibility. Other application
  queries, legacy routes, migrations and model ingestion still use their existing
  connections. Their mobile-network behavior is not fixed by this change.
- The database function accepts named operations, not SQL strings. Browser roles
  cannot execute it. Its security-definer search path is empty; table/Auth references
  and PostGIS functions are schema-qualified. Backend routes still authenticate
  callers and validate fields before selecting an operation.
- The hosted SMS hook has separate configuration. To block direct-provider sends
  outside the app, its operator must independently enable the hook's fail-closed
  mock setting. See [demo/live limits](registration-demo-mode.md#hosted-hook-and-verification-limits).

## Validation and remaining acceptance

The account-compatibility follow-up passed 396 network-denied tests, full
TypeScript and 30 isolated TIER-01 browser checks. The latter cover real profile/
settings components with mocked account responses, including saves, reload,
habitats, pause/weekday limits and honest failures. They do not exercise the
database or the complete registration-to-password-login journey. The browser
used existing cached dependencies and temporary launch flags; app configuration
and frontend source were unchanged.

Mocked route tests prohibit PostgreSQL access while exercising HTTPS signup,
password login, reload, preferences, ownership/consent guards, live-mode routing,
duplicate/missing-migration errors and ambiguous failures. Transport tests cover
credential handling, response validation and private upstream errors. Existing
PostgreSQL-path tests remain in the regression suite.

The mocked checks do not execute PL/pgSQL. Subsequent authorized MCP verification
confirmed migration installation, execution grants, search path and the health
operation with controlled service-role claims, plus rejection of non-service
claims. The user's subsequent terminal check established authenticated HTTPS
health access using the configured backend key. Neither check exercised account
writes. Browser demo signup is user-reported working; login, reload, preference
persistence and full live registration acceptance remain separate checks.

Security advisor categories/counts were unchanged before and after installation,
with no finding for the new registry function. Existing findings include
[disabled RLS on other public tables](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
and a [mutable search path on the legacy hotspot function](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable).
Those unrelated objects were not modified by this migration.

Local results: 367 tests passed across 30 files with network requests denied;
full TypeScript, script syntax, Python compilation and whitespace checks passed.
The health helper ran with a mocked HTTPS response under Node 24. Independent
spec and standards reviews found no remaining blocker after correcting the
helper's native TypeScript import compatibility. Implementation tests used no
live requests; the user's separately supplied health PASS is recorded above.

References: [Supabase database functions](https://supabase.com/docs/guides/database/functions),
[backend API keys](https://supabase.com/docs/guides/getting-started/api-keys), and
[PostgreSQL versus HTTPS network restrictions](https://supabase.com/docs/guides/platform/network-restrictions).
