# REG-01-SON advisory preferences

Son selected REG-01 and approved the D01 rules in chat on October 15, 2026.
Backend implementation is on `codex/son/reg-01`. Son's backend acceptance is
complete: user-provided dry-run and apply output confirm migration 03 and its
database checks passed, preserving existing profiles and rolling back fixtures.
Tier's UI integration and full application acceptance remain pending.
[Registration/auth contract](registration-contract.md).

## Stored fields

| Field | Values | New-account default |
| --- | --- | --- |
| `advisory_days` | 0–5 distinct integer ISO weekdays, 1 Monday through 7 Sunday | `[]` (routine paused) |
| `preferred_advisory_time` | Manila local `HH:MM` or `HH:MM:SS`, 00:00:00 through 23:59:59 | `05:00:00` |
| `preferred_language` | `en`, `tl`, `ceb`, `hil` | `en` |
| `habitat_preference` | `pelagic`, `demersal`, `both` | `both` |

Invalid, duplicate or sixth-day input is rejected, never truncated. Days are
returned sorted by the API. Null is invalid; omission preserves an existing
preference during updates. Whole-minute times are returned with seconds.
Language/habitat preferences do not establish reviewed translation coverage,
target availability, ranking rules or marine entitlement.

## Owner API

Use the verified Supabase bearer session from REG-02. No helper/admin key or
client-supplied user ID establishes ownership.

- `POST /api/users/register` accepts these four optional fields alongside its
  existing required profile/consent fields and returns the persisted preferences.
- `GET /api/users/profile` reads the authenticated owner's saved profile and
  preferences from PostgreSQL. Query-string phone/user IDs do not choose an owner.
- `PUT /api/users/profile` accepts the owner's `phone_number` plus at least one
  editable profile/preference field. Send only the fields being changed.
  Coordinates must be supplied together when either is changed. Omitted name,
  port, coordinates and preferences retain their saved values. Consent uses its
  separate REG-02 endpoint.

Example preference-only update:

```json
{
  "phone_number":"+639171234567",
  "advisory_days":[1,3,5],
  "preferred_advisory_time":"05:00",
  "preferred_language":"ceb",
  "habitat_preference":"pelagic"
}
```

Read/update/register responses include `advisory_timezone: "Asia/Manila"`,
`routine_paused` (true exactly when no days are selected), and `next_routine_at`
(the next strictly future selected occurrence as a UTC ISO timestamp, or null
when paused). This is a schedule candidate, not eligibility or promised delivery;
verified contact, consent, operational safety and SMS-01 dispatch checks still
apply. Edits have no cutoff and affect future unsent advisories. No historical
occurrence is replayed. Critical alert eligibility remains independent of days.

The API returns 400 for invalid fields, 401/403 for missing/mismatched ownership,
404 for no matching verified profile, and a redacted 503 when the database or
migration is unavailable. Responses use `Cache-Control: no-store`.

## Migration and verification

Apply `backend/migrations/03_advisory_preferences.sql` after migration 02 before
deploying the updated routes. It adds the three missing columns with database
constraints, preserves advisory times/identity/consent and starts existing users
with no weekdays. It does not send SMS or infer consent. Reapplying it preserves
saved preferences. FastAPI models and response contracts expose the persisted
fields; its legacy registration/profile writers remain disabled with HTTP 410.

From the repository root, with the existing database/CA settings:

```powershell
node scripts/apply-registration-migration.mjs --preferences --dry-run
node scripts/apply-registration-migration.mjs --preferences
```

The first command rolls everything back. The second commits only after checks
pass. `--preferences --verify-only` verifies an already applied migration without
committing changes. These operations never call Auth OTP or an SMS provider.
Verification fixtures are rolled back and checks cover defaults, five-day
save/reload, port-only preservation, database rejection of invalid days/language/
habitat, pause persistence, independent consent eligibility and owner isolation.
The preference mode cannot be combined with duplicate cleanup.

The agent's initial database connection failed with EACCES. Son subsequently
ran both dry-run and apply successfully on October 15, 2026; migration 03 is now
applied and verified. No OTP/SMS was requested. Tier handoff: wire the editor/
readback to this contract, remove hardcoded time resets from profile saves, and
explain that routine pauses do not pause critical warnings.
