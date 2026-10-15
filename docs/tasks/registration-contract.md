# REG-02-SON registration API handoff

Status: Son selected Supabase SMS OTP, explicit messaging consent and helpers disabled.
A user-run live SMS/verification test passed on October 15, 2026. Backend tests and
real database migration/consent/owner-isolation checks passed. Actual app HTTP/session
integration and Tier's UI acceptance remain pending.
This describes the implemented backend; Tier continues to own the UI.

## Session and request order

1. Request an OTP, then verify it using the routes below.
2. Establish the actual Supabase session with the returned access/refresh tokens
   (`supabase.auth.setSession`). Do not log tokens or codes.
3. Include `Authorization: Bearer <access_token>` on registration, profile and consent
   requests. Admin keys, demo codes, local flags and user metadata do not establish ownership.
4. Read current consent text/version, collect an explicit boolean choice, then register.
   Declining messaging consent does not prevent account creation.

All these JSON responses use `Cache-Control: no-store`. The app phone-auth flag
must be enabled after Auth/hook configuration; profile writes additionally need
migration 02 and the server PostgreSQL connection. Helpers are disabled.

## OTP

`POST /api/auth/otp/request` accepts only:

```json
{"phone_number":"+639171234567"}
```

Optional `captcha_token` must come from the browser challenge when CAPTCHA is
configured. Philippine local/international formats normalize to `+639XXXXXXXXX`.
Success is HTTP 202 with `{"status":"code_requested"}`. This means accepted,
not confirmed handset delivery. An Auth identity may be created.

`POST /api/auth/otp/verify` accepts only:

```json
{"phone_number":"+639171234567","code":"012345"}
```

Codes are six-digit strings; preserve leading zeros. HTTP 200 returns
`status: "phone_verified"`, `user: {id, phone_number}` and
`session: {access_token, refresh_token, expires_at, expires_in, token_type}`.
The session and confirmed Auth phone must match the requested phone. Invalid,
expired or reused codes do not grant a session. SMS arrival order is not proof
of request order. Never generate a new OTP as an automatic delivery retry.

## Consent

`GET /api/users/consent` requires the verified owner's bearer token. HTTP 200 returns
`consent_version`, `consent_text`, and `consent`: saved `messaging_consent`,
`messaging_consent_version`, `messaging_consent_at`, or null before profile creation.
Render the returned text and submit its current version.

Current version: `messaging-v1`. Exact text:

> I agree to receive Parola fishing advisories and safety alerts by SMS at my verified phone number. I can withdraw this messaging consent in the portal. Sponsor messages are not included.

`PUT /api/users/consent` accepts only:

```json
{"messaging_consent":false,"consent_version":"messaging-v1"}
```

Use true to grant, false to withdraw. HTTP 200 returns the saved
`messaging_consent`, `messaging_consent_version`, `messaging_consent_at` and
`messaging_eligible`. Actor, version and server timestamp are audited. Withdrawal
preserves the account and blocks subsequent eligibility checks; an already
submitted SMS cannot be recalled.

## Profile registration and edits

`POST /api/users/register` requires the verified owner's bearer token and accepts:

```json
{
  "phone_number":"+639171234567",
  "full_name":"Test Fisher",
  "home_port_name":"Mercedes Fish Port",
  "latitude":14.1,
  "longitude":122.9,
  "preferred_advisory_time":"05:00",
  "messaging_consent":false,
  "consent_version":"messaging-v1"
}
```

Names are nonblank strings of at most 100 characters. Coordinates must be finite
JSON numbers in the normal latitude/longitude ranges; zero is valid. Time accepts
`HH:MM` or `HH:MM:SS`. Omitting time preserves the existing backend registration
default `05:00:00`; the approved REG-01 policy starts accounts with no selected weekdays. Coordinates
here define storage shape, not validated marine suitability.

HTTP 201 returns `status: "registered"`, `contact_verified: true`, `id`,
`phone_number`, `full_name`, `home_port_name`, `created_at`, `messaging_consent`,
`messaging_consent_version`, `messaging_consent_at` and `messaging_eligible`.
IDs, verification/provenance and timestamps are server-owned. Account creation,
consent, dispatch scheduling and SMS delivery remain separate states.

REG-01 extends registration/profile responses with persisted weekday, time,
language and habitat preferences; see [advisory-preferences-contract.md](advisory-preferences-contract.md).
After migration 03, `GET /api/users/profile` reads the verified owner's profile.
`PUT /api/users/profile` requires the same bearer token and `phone_number`, plus
at least one editable field. Names, port, coordinate pair and preferences may be
updated independently; omitted values are preserved. Responses include numeric
coordinates and the saved preferences. This route cannot change phone ownership
or consent. Authenticated Supabase reads remain governed by owner RLS.

Passwords, roles, actor IDs, helper/target IDs and verification timestamps are
unsupported fields and rejected. New OTP registration does not enroll a password.
Legacy FastAPI registration/profile writes return HTTP 410; its legacy password
login response is not a Supabase session.

## Errors and persistence

| HTTP | Meaning / client behavior |
| --- | --- |
| 400 | Invalid fields, unknown/helper fields or rejected verification. |
| 401 | Missing/rejected Supabase owner session. |
| 403 | Unverified/mismatched owner or changed authoritative phone. |
| 404 | No linked verified profile for an edit/consent update. |
| 409 | Duplicate account or stale consent version; inspect the specific error. |
| 429 | Rate limited; respect `Retry-After`. |
| 503 | Auth/provider/database unavailable or migration missing; do not show saved success. |

Errors contain `{error: "message"}`. Collisions never overwrite or automatically
link legacy accounts. Legacy profiles remain unverified/nonconsenting pending
review. There is no FastAPI/local-storage fallback after persistence failure.
Offline UI may store a clearly unsaved draft, without manufacturing verification.

## Apply and verify without SMS

From the repository root:

```powershell
node scripts/apply-registration-migration.mjs
```

The runner reads `.env.local`/`.env`, applies migration 02 after existing schema 01,
checks account preservation, normalization, privileges/RLS, isolated owner reads,
consent grant/withdrawal/audit and eligibility, then commits only on success.
Temporary fixtures are rolled back. `--dry-run` rolls back the migration too;
`--verify-only` checks an already applied migration. No OTP/iPROG requests are made
and no SMS credits are used. TLS certificate verification is required;
`SUPABASE_DB_CA` is supported. The normal installed `pg` dependency is used, with
this workspace's existing offline check cache as an optional fallback.

For `SELF_SIGNED_CERT_IN_CHAIN`, open Supabase Database settings > SSL
Configuration and download the root certificate. Set `SUPABASE_DB_CA_FILE` in
`.env.local` to the downloaded file's full path (forward slashes work on Windows),
then retry the same command. The runner also accepts a connection-string
`sslrootcert` file path or existing inline `SUPABASE_DB_CA` PEM. A supplied file
takes precedence over inline PEM and must contain a valid CA certificate.
Certificate and hostname verification remain enabled; no SMS is requested.

If migration application reports `P0001`, check duplicate normalized legacy contacts:

```powershell
node scripts/apply-registration-migration.mjs --check-duplicates
```

This uses a read-only database transaction and prints only group/profile counts.
Affected rows are saved in `.registration-duplicates.local`, ignored by Git, for
local review. A duplicate report deliberately exits with failure status while
leaving all database rows unchanged. The default apply mode also preflights this
check before DDL. No automatic merging/deletion or legacy verification is performed.

The user explicitly authorized removing the two profiles from the reported pair
on October 15, 2026. That scope is stored in the Git-ignored
`.registration-duplicate-removal.local` plan. For this approved pair only:

```powershell
node scripts/apply-registration-migration.mjs --remove-reported-duplicates
```

The command locks and rechecks the exact two snapshots, refuses linked/verified
profiles, custom DELETE triggers, complex foreign keys or any referenced history,
then durably backs up full rows to a private `.registration-duplicate-backup-*.local`
file before deleting. Auth identities are never deleted. Cleanup and migration
verification share one transaction; a later failure rolls the deletion back too.
Other profiles are not targeted. No OTP or SMS call is made. The agent's execution
attempt failed at EACCES before connecting. The user's subsequent command output
confirms the approved removal, migration commit and database checks succeeded on
October 15, 2026. The private backup contains two full rows and the latest duplicate
report is empty. Local backend OTP is enabled in ignored `.env.local`; restart the
backend to load it. Future installations should run the ordinary apply command,
not this one-time cleanup flag.

The agent's application attempt failed at connection with EACCES before DB writes.
Run the command in the user's terminal. Alternatively, apply the existing migration
SQL in Supabase SQL Editor, then run the command with `--verify-only`. Do not rerun
schema 01 over migration 02: schema 01 contains the earlier profile write policy.

`REG-02-SON | Tier | components/auth/AuthPage.tsx, context/AppContext.tsx, utils/auth-fetch.ts | consume this contract; replace demo/local success with Supabase session, explicit consent and persistence/error states | UI acceptance/end-to-end registration | ready for Tier integration; OTP and database checks passed; actual app integration pending`

REG-02 remains partial until actual app integration and owned UI integration pass. This
handoff does not implement dispatch scheduling, helper delegation or sponsor consent.
