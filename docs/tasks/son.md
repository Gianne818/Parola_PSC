# Son's six work packages

**Current selection, October 17, 2026: Batch 2, OPS-01 ingestion reliability
(SON-04 portion).** Branch `codex/son/ingestion-reliability`. API and CSV now share
an upload ledger/identity, canonical retry handling, locked complete-batch writes,
count verification, publication and safe failure/status responses. Both habitats
are retained. The additive migration 05 is prepared, not applied; no legacy rows
or advisory links are deleted or relabeled. Contract, integration limits and exact
Toby/Tier handoffs: [prediction-ingestion-contract.md](prediction-ingestion-contract.md).
Full OPS-01 remains partial: actual PostgreSQL concurrency/schema/privilege checks,
scientific source-cell/run lineage, producer integration and coherent query run
selection still need their separate acceptance evidence. Tier's frontend and
Toby's producer files remain unchanged. No live DB, SMS, external service,
installation, deployment or push is included.
Validation: all 44 Python backend tests pass with mocked sessions/in-process
requests; Python compilation and whitespace checks pass. Separate spec and
standards reviews found no remaining blocker after adding safe run IDs/failure
phases to API errors. These checks do not prove deployed database behavior.

**Current selection, October 17, 2026: Batch 1, independent MAP-01/OPS-01 slice.**
Branch `codex/son/api-foundations`. Prediction ingestion now requires finite
numeric latitude/longitude in range and explicit ISO calendar dates. API and
CSV defaults share the Manila calendar day. CSV uses the standard-library reader
(no pandas installation), validates all rows before opening a database session,
and reports redacted failures with nonzero CLI exit and rollback/cleanup attempts.
No successful local fallback or automatic retry is inferred after write failure.

Tests cover in-process API validation/default dates and both habitats, CSV
prevalidation, commit/execute failures, CLI exit status and valid zero coordinates.
All 27 Python tests, Python compilation and whitespace checks passed.
Spec and standards reviews found no blocker. No live DB/network/SMS call, dependency
installation, schema change, commit or push was performed. MAP-01 and OPS-01 stay
partial: ocean-mask enforcement, agreed source-cell/run identities, duplicate
prevention and atomic run publication remain pending with their existing handoffs.
The existing CSV pelagic/global-rank mapping and fixed cell envelope are retained;
this slice does not validate their scientific suitability or alter Toby's models.


**User-selected follow-up, October 16, 2026: registration demo/live mode.**
Same screen and existing users table; any numeric demo code skips OTP, while
live mode retains real verification. Scope includes the explicitly requested
frontend account integration; Tier's other work and the cancelled fixplan
reorganization remain excluded. See [operating instructions](../registration-demo-mode.md).
No new table/migration, remote settings, production DB operation or SMS test.
Validation: 334 broad network-denied tests, then 107 affected tests after review
fixes; full TypeScript, script syntax and whitespace checks passed. Independent spec/standards reviews found no remaining blocker. Reload
initialization and accurate localized live/demo notices were corrected. ESLint
is blocked at startup by a truncated installed lodash.merge dependency; no install.


Owner: **Son only**. Updated October 15, 2026. [Hub](../../fixplan.md) | [Shared rules, files and gates](shared.md) | [Full reference](../reference/fixplan-detail.md)

Son asked to retain the plain task list for future requests: [saved 27-task list](son-backlog.md).

**Current selection: UI-02-SON, MAP-03-SON and UI-01-SON**, explicitly selected
by Son together. Work is on `codex/son/presentation-contracts`; Tier retains UI
ownership. Scope: bounded/stable registration and language status contracts,
honest species/environment responses, and persisted capability evidence for
client consumption. No SMS requests or scientific threshold changes are authorized.

**Previous selection: REG-01-SON.** On October 15, 2026, Son selected preference
persistence and approved D01: 0–5 distinct weekdays; zero pauses routine messages;
05:00 Asia/Manila default; changes affect future unsent advisories without an edit
cutoff; existing accounts receive no selected days until they choose. Critical
alerts remain independent. Tier retains UI ownership. Work is on
`codex/son/reg-01`; no live SMS requests are authorized by this task.

## Before coding

- Confirm identity from this chat; otherwise ask "Who are you working as: Tier, Son, or Toby?" and wait. Never infer it from a branch, username or last session.
- Work on one explicitly selected `-SON` assignment. For a general "continue", propose your next ready assignment and wait for selection. A specific matching assignment in the user's request already establishes the task.
- Only edit owned files listed below and their assigned tests; read other areas for context. Request the owning member's change when a shared dependency is missing. Never finish their portion yourself.
- C01-C08 are interface gates and D01-D10 are unresolved decisions in the shared rules. Pending prerequisites block dependent integration/live behavior; isolated evaluation/tests may proceed only where an assignment explicitly allows it.
- Check off only Son assignments whose acceptance evidence is recorded. Parent statuses remain partial until every required member portion and integration check is complete. Deferred/superseded items need explicit separate prioritization.

## Allowed files

| File group | Allowed scope |
| --- | --- |
| API | `app/api/**` and its tests; `parola-api-service/**` except Toby's HSI file/test listed in shared rules. |
| DB / AUTH / GEO | `backend/migrations/**`, `lib/**` except Tier's listed helpers/tests; `data/**`, `utils/spatial.ts`, `utils/hotspotCalculator.ts`; matching backend tests. |
| DISPATCH | `backend/sms-dispatch/**`, `backend/safety-dispatch/**`, `services/iprogSmsService.ts`, `services/smsServiceInstance.ts`, `templates/**`; SMS/backend test suites. |
| SHARED / DOC | Dependency manifests/lockfiles, shared config/types, other integration paths and shared documents as enumerated in shared rules; your checklist. Never edit Tier/Toby implementation just to integrate it. |

**First candidate:** REG-02-SON, beginning with C03/D02 contact/consent/assistance contract and tests. Live verification waits for an agreed real verification process; no provider capability is presumed.

## Assignments

- [x] <a id="reg-01-son"></a>**REG-01-SON | P1 | Complete (backend)** - [Persist selected-day preferences.](../reference/fixplan-detail.md#reg-01)
  - **Files:** API, DB. **Work:** Persist validated preferences consistently across Next.js/FastAPI/types; preserve them on unrelated edits.
  - **Needs:** C03; D01. **Done when:** Distinct-day limits, time/language/habitat persistence and migration behavior pass API tests.

- [x] <a id="reg-02-son"></a>**REG-02-SON | P0 | Complete (approved self-service backend)** - [Verify contacts, consent and assisted authority.](../reference/fixplan-detail.md#reg-02)
  - **Files:** API, DB, AUTH. **Work:** Implement verified contact/consent eligibility and scoped assisted changes with actor provenance.
  - **Needs:** C03; D02. **Done when:** Demo verification cannot enroll live recipients; unauthorized cross-user edits fail and assisted edits are attributable.
  - **Approved scope:** Supabase SMS OTP and explicit owner consent; assisted operations are disabled and rejected, as Son selected in this chat. No assisted workflow is claimed implemented. Backend signoff uses passing API/hook tests, the live OTP/session result and live database owner/consent/audit checks. Tier's UI and full application/release acceptance remain pending for parent REG-02.

- [ ] <a id="sms-01-son"></a>**SMS-01-SON | P1 | Partial** - [Schedule routine advisories durably.](../reference/fixplan-detail.md#sms-01)
  - **Files:** API, DB, DISPATCH. **Work:** Implement Manila-time selected-day jobs, durable recipient/day identity, valid target selection and last-minute safety gating.
  - **Needs:** C01-C04, C06; D01/D03/D04. **Done when:** One routine outcome per selected day; retries do not duplicate; hazards contain no fishing coordinates; unavailable data stays unavailable.

- [ ] <a id="sms-02-son"></a>**SMS-02-SON | P0 | Partial** - [Route critical events independently and track delivery.](../reference/fixplan-detail.md#sms-02)
  - **Files:** API, DB, DISPATCH. **Work:** Separate critical events from routine scheduling; persist attempts/deduplication/retries, authenticated callbacks and terminal escalation.
  - **Needs:** C02-C04; D03/D07. **Done when:** Restart/duplicate callbacks are safe; changed hazards still alert; routine days/subscription/budget assumptions never cap warnings.

- [ ] <a id="sms-03-son"></a>**SMS-03-SON | P1 | Partial** - [Govern segments, sponsorship and costs.](../reference/fixplan-detail.md#sms-03)
  - **Files:** API, DB, DISPATCH. **Work:** Enforce approved/consented routine-only sponsor credits without extra segments; track real encoding and separate cost streams.
  - **Needs:** C03, C04; D07. **Done when:** Unicode/multipart tests pass; drop sponsor before guidance; no safety/enterprise ads or budget suppression.

- [ ] <a id="safe-01-son"></a>**SAFE-01-SON | P0 | Partial** - [Validate weather providers and backup.](../reference/fixplan-detail.md#safe-01)
  - **Files:** API, DB, DISPATCH. **Work:** Serve and persist validated weather/source/quality contracts; integrate Toby adapters with controlled failover.
  - **Needs:** C02; Toby SAFE-01; D03/D08. **Done when:** Only compatible current backups qualify; missing essential data withholds guidance while independent warnings survive.

- [ ] <a id="safe-02-son"></a>**SAFE-02-SON | P0 | Partial** - [Localize warnings and decouple them from inference.](../reference/fixplan-detail.md#safe-02)
  - **Files:** API, DB, DISPATCH. **Work:** Implement independent local critical evaluation and affected-recipient routing separate from inference cadence.
  - **Needs:** C02, C03, C06; D03; Toby spatial weather support. **Done when:** Applicable regions receive events during model failure; missing holds never become clearance.

- [ ] <a id="safe-03-son"></a>**SAFE-03-SON | P0 | Partial** - [Share deterministic rules and preserve UNKNOWN.](../reference/fixplan-detail.md#safe-03)
  - **Files:** API, DB, DISPATCH. **Work:** Own the shared deterministic decision/storage contract, schema migration and query/SMS/export enforcement; allow warning-only records.
  - **Needs:** C02; D03; Toby validation recommendations. **Done when:** Known hazards survive other outages; UNKNOWN persists; direct endpoints cannot bypass suppression; deployed CHECK mismatch verified first.

- [ ] <a id="data-01-son"></a>**DATA-01-SON | P0 | Planned** - [Apply a validated ocean mask.](../reference/fixplan-detail.md#data-01)
  - **Files:** API, DB. **Work:** Own indexed versioned land storage/loader, ocean predicate and ingest/query enforcement; quarantine/cleanup design preserves advisory links.
  - **Needs:** C01; Toby validated mask; D08. **Done when:** All ingest/query paths reject validated land; no destructive historical cleanup without its reviewed plan.

- [ ] <a id="data-02-son"></a>**DATA-02-SON | P0 | Planned** - [Stop production simulation and record provenance.](../reference/fixplan-detail.md#data-02)
  - **Files:** API, DB. **Work:** Persist source/model/run versions, quality/coverage/publication state and serve eligible runs only; investigate deployed provenance read-only.
  - **Needs:** C01; Toby run outputs; D08. **Done when:** Atomic publication and legacy-unknown provenance are explicit; no invented backfill or fresh-looking old rows.

- [ ] <a id="data-03-son"></a>**DATA-03-SON | P0 | Planned** - [Use real environmental features and calibrated scores.](../reference/fixplan-detail.md#data-03)
  - **Files:** API, DB. **Work:** Persist and expose real feature units/semantics and supported species adjustment; reject invalid inference batches.
  - **Needs:** C01; Toby feature/scoring definitions. **Done when:** No random feature or forced-score assumptions are introduced by storage/API mapping.

- [ ] <a id="data-04-son"></a>**DATA-04-SON | P1 | Planned** - [Integrate real historical VIIRS DBSCAN.](../reference/fixplan-detail.md#data-04)
  - **Files:** API, DB. **Work:** Persist/serve versioned historical cluster support and provenance without inventing catch labels.
  - **Needs:** C01; Toby cluster outputs. **Done when:** Exposed IDs trace to detection clusters and their source/version.

- [ ] <a id="map-01-son"></a>**MAP-01-SON | P0 | Partial** - [Normalize coordinates and remove legacy bypasses.](../reference/fixplan-detail.md#map-01)
  - **Files:** API, DB. **Work:** Return numeric lat/lng from PostGIS and guard every operational query/RPC rather than expose raw geometry parsing bypasses.
  - **Needs:** C01; DATA-01-Son. **Done when:** Valid targets share coordinate order across UI/SMS; shore-based home ports are not rejected as hotspots.

- [ ] <a id="map-02-son"></a>**MAP-02-SON | P1 | Partial** - [Unify run validity, ranking and bounded payloads.](../reference/fixplan-detail.md#map-02)
  - **Files:** API, DB. **Work:** Apply scope/valid run/habitat/threshold before ranking and paging; standardize score units and coherent run selection.
  - **Needs:** C01, C06; D04; Toby threshold/ranking review. **Done when:** No duplicates/region starvation; nearest mode is nearest among eligible rows and no stale regional substitution.

- [x] <a id="map-03-son"></a>**MAP-03-SON | P1 | Complete (current backend contracts)** - [Correct species and environment presentation.](../reference/fixplan-detail.md#map-03)
  - **Files:** API, DB. **Work:** Verify deployed species fields/aliases and remove unrelated-first-row fallback; expose real depth/environment support.
  - **Needs:** C01, C02; Toby HSI definitions. **Done when:** Unknown species never inherits another profile or falsely claims adjustment.

- [ ] <a id="ops-01-son"></a>**OPS-01-SON | P1 | Partial** - [Harden dates, ingestion and run visibility.](../reference/fixplan-detail.md#ops-01)
  - **Files:** API, DB. **Work:** Harden API/CSV dates, ingestion transactions, run uniqueness, error visibility and source-cell persistence; protect linked advisories.
  - **Needs:** C01; D01/D08; Toby source-cell definition. **Done when:** Manila boundary, partial batch/retry and silent DB failure tests pass; no blind destructive replace.

- [ ] <a id="report-01-son"></a>**REPORT-01-SON | P1 | Planned** - [Add structured voluntary trip reports.](../reference/fixplan-detail.md#report-01)
  - **Files:** API, DB, AUTH. **Work:** Add structured authenticated report persistence/units/ownership/advisory linkage, reviewable corrections and duplicate-safe submissions.
  - **Needs:** C03, C05; D09. **Done when:** Negative/invalid inputs fail; zero catch accepted; old ratings are not invented weight records.

- [ ] <a id="report-02-son"></a>**REPORT-02-SON | P1 | Planned** - [Review assisted reports before learning.](../reference/fixplan-detail.md#report-02)
  - **Files:** API, DB, AUTH. **Work:** Enforce assisting actor scope and review/audit lifecycle; export only permitted eligible reviewed records.
  - **Needs:** C03, C05, C08; D02/D09. **Done when:** Revoked helper and cross-owner requests fail; flagged/duplicate/unreviewed rows excluded.

- [ ] <a id="eval-01-son"></a>**EVAL-01-SON | P1 | Planned** - [Measure outcomes without overstating them.](../reference/fixplan-detail.md#eval-01)
  - **Files:** API, DB. **Work:** Expose consented pilot/evaluation aggregates with provenance and distinct operational delivery/adoption outcomes.
  - **Needs:** C05, C08; D09; Toby evaluation outputs. **Done when:** Only reviewed accessible evidence is reported; target counts/revenue never become observed records.

- [ ] <a id="geo-01-son"></a>**GEO-01-SON | P0 | Planned** - [Enforce proposed permitted areas server-side.](../reference/fixplan-detail.md#geo-01)
  - **Files:** API, DB, GEO. **Work:** Own authoritative boundary ingestion/versioning and Standard/small/medium/large eligibility in query/SMS/export before limits.
  - **Needs:** C03, C06, C07; D05/D08. **Done when:** Direct requests cannot bypass municipal/commercial/radius/FMA/EEZ checks; unsupported coverage is explicit.

- [ ] <a id="geo-02-son"></a>**GEO-02-SON | P1 | Planned** - [Stage authoritative conservation exclusions.](../reference/fixplan-detail.md#geo-02)
  - **Files:** API, DB, GEO. **Work:** Obtain versioned MPA/no-take/closure sources; enforce validated active restrictions with expiry/stale/conflict handling.
  - **Needs:** C06; D05/D08. **Done when:** Enabled exclusions apply to all channels; initial reminders do not waive pilot eligibility.

- [ ] <a id="geo-03-son"></a>**GEO-03-SON | P1 | Planned** - [Distribute recommendations across suitable grounds.](../reference/fixplan-detail.md#geo-03)
  - **Files:** API, DB, GEO. **Work:** Implement atomic recommendation counting and eligible next-best selection compatible with ranking and zone locks.
  - **Needs:** C01, C06, C07; D04/D06; Toby review. **Done when:** Concurrent/retried requests respect approved counting; no lower-quality or unsafe alternative is invented.

- [ ] <a id="ent-01-son"></a>**ENT-01-SON | P2 | Planned** - [Verify vessels and persist entitlements/zone locks.](../reference/fixplan-detail.md#ent-01)
  - **Files:** API, DB, AUTH. **Work:** Persist verified credentials/operators/trials/subscriptions and atomic vessel zone locks; separate custom fleets and audit events.
  - **Needs:** C03, C06, C07; D05/D06/D07. **Done when:** Forged client tier/GT fails; concurrent unlock/re-download/expiry obey contract and never affect free critical alerts.

- [ ] <a id="ent-02-son"></a>**ENT-02-SON | P2 | Partial** - [Generate real verified Geo-Packs.](../reference/fixplan-detail.md#ent-02)
  - **Files:** API, DB, GEO. **Work:** Generate/protect/schema-validate real format downloads with entitlements, safety/spatial checks and provenance.
  - **Needs:** C01, C02, C06, C07; D06/D08; Toby forecast support. **Done when:** Correct coordinate order/time; no land/restricted/suppressed samples; device claims require actual import tests.

- [ ] <a id="road-01-son"></a>**ROAD-01-SON | P2 | Deferred** - [Validate satellite, fleet and institutional capabilities.](../reference/fixplan-detail.md#road-01)
  - **Files:** API, DB, DISPATCH. **Work:** Later own satellite transport/custom fleet/API access and suitably anonymized institutional delivery.
  - **Needs:** Deferred; C07/C08 and separate prioritization. **Done when:** Real channel/cost/access checks and privacy aggregation precede launch.

- [x] <a id="ui-01-son"></a>**UI-01-SON | P1 | Complete (current backend contracts)** - [Align all public and signed-in journeys.](../reference/fixplan-detail.md#ui-01)
  - **Files:** API, DB. **Work:** Provide factual capability/readiness/source metadata used by Tier; remove no frontend copy on Tier's behalf.
  - **Needs:** Relevant C01-C08; UI wiring depends on real capability evidence. **Done when:** Persisted capability status cannot be synthesized from preview/local storage or imply deployment proof.

- [x] <a id="ui-02-son"></a>**UI-02-SON | P1 | Complete (current backend contracts)** - [Extend accessible regional-language flows.](../reference/fixplan-detail.md#ui-02)
  - **Files:** API, DB. **Work:** Persist language and provide stable localized-validation/status inputs and duplicate-safe bounded requests.
  - **Needs:** C03-C05; D10. **Done when:** Language survives reload; server behavior supports retries without requiring a native app.

- [ ] <a id="priv-01-son"></a>**PRIV-01-SON | P1 | Partial** - [Separate identity, reports and delegated access.](../reference/fixplan-detail.md#priv-01)
  - **Files:** API, DB, AUTH. **Work:** Own RLS/server/service-role checks, identity-location separation, export permissions, tamper-evident audits and reviewed retention/purge.
  - **Needs:** C03, C05, C07, C08; D02/D09. **Done when:** Cross-account/fleet/helper access denied; raw sensitive catch locations protected; no continuous tracking or unrestricted enforcement feed.

- [ ] <a id="ux-01-son"></a>**UX-01-SON | P2 | Deferred** - [Preserve useful map/trip-planning additions.](../reference/fixplan-detail.md#ux-01)
  - **Files:** API, DB, GEO. **Work:** Later serve masked polygons and route/vessel-backed estimation/export contracts.
  - **Needs:** Deferred; C01/C06/C07 and separate prioritization. **Done when:** No recommended land/restricted hulls or unsupported route certainty.

- [ ] <a id="leg-01-son"></a>**LEG-01-SON | P2 | Superseded** - [Incoming SMS commands and rating feedback.](../reference/fixplan-detail.md#leg-01)
  - **Files:** API, DB, DISPATCH. **Work:** Retain inbound commands/ratings as superseded reference; future reactivation needs separate authorization/provider validation.
  - **Needs:** Superseded; no implementation work now; Tier removes core claims under UI-01. **Done when:** Do not delete legacy handlers/data or require inbound SMS; any future parser rejects ambiguity and has durable retry-safe idempotency.

- [ ] <a id="leg-02-son"></a>**LEG-02-SON | P2 | Deferred** - [Cooperative fuel pooling.](../reference/fixplan-detail.md#leg-02)
  - **Files:** API, DB, AUTH. **Work:** Only later reconcile persistent fuel pools/orders/membership with existing schema and concurrency/fulfilment rules.
  - **Needs:** Deferred; separate fuel product authorization. **Done when:** Authorized persistent orders/commitments and confirmed volume/status required; not a prerequisite for pilot fuel evaluation.

## Progress and handoffs

### UI-02-SON / MAP-03-SON / UI-01-SON backend acceptance

**Verified October 15, 2026:** Son supplied successful presentation dry-run and
apply output. Migration 04 committed; capability evidence controls, client-write
denial and actual deployed species fields passed. Verification fixtures rolled
back. Existing ownership, RLS/privileges, consent/audit and Auth-revocation checks
also passed. No OTP/SMS requested. The current backend contracts are complete.

UI-02 provides persisted language/fallback metadata, stable validation codes and
fields, 64 KiB/5-second request-body bounds, and repeated-consent timestamp
preservation. Profile and registration retries retain owner/duplicate checks.
This does not certify reviewed translations or implement future report/SMS retry
channels; those remain Tier/REPORT-01/C05/SMS-01/02 handoffs.

MAP-03 uses the observed common_name/representative_species and unit-suffixed
schema consistently in Next.js, Python ORM and catalog responses. Exact aliases
and scoped IDs reject unknown/ambiguous queries. No unrelated-row fallback,
fixed depth or false HSI adjustment remains; habitat scores remain unchanged.
Real depth/HSI/source validation remains a Toby dependency before adjustment can
be enabled. Incompatible startup catalog creation/seeding was removed.

UI-01 reads persisted capability implementation/evidence and fails unavailable
when storage/evidence is missing or expired. Seeds never claim deployment proof.
Validation: 174 JavaScript tests/7 Python tests passed before schema correction;
then 23 affected JavaScript tests, 5 Python schema/alias tests and scoped TypeScript
passed after mapping the actual deployed columns. Syntax/diff checks passed.
Contract and Tier/Toby requests: [backend-presentation-contract.md](backend-presentation-contract.md).
The three parent features remain partial until consumer/science/release acceptance
is complete. Code changes still require commit/review; no readiness evidence was
invented from local storage, configuration or preview output.

### Current REG-01-SON preference persistence

Implemented owner-only preference read/update and registration defaults, shared
TypeScript and FastAPI preference contracts, and migration 03 with database
constraints. Contract and Tier handoff: [advisory-preferences-contract.md](advisory-preferences-contract.md).
Routine weekdays are explicit (0–5, ISO Monday=1); empty pauses routine advisories
without withdrawing consent or blocking independent critical eligibility.
Unrelated profile updates preserve saved days/time/language/habitat. Responses
provide the next strictly future Manila schedule candidate. This task does not
implement SMS-01 scheduling or MAP-02 ranking.

Focused Python schema checks pass (4 tests); scoped backend TypeScript and script
syntax checks pass. The initial root Vitest attempt could not start because an
installed rolldown dependency is missing; the existing isolated runner completed
165 backend/auth/preference tests successfully; after correcting parameterized
test inputs, all 112 tests in the three directly changed suites passed again,
and scoped TypeScript including the new tests passed. The agent database attempt
failed at connect with EACCES. Subsequently, Son supplied successful dry-run and
apply output for migration 03 on October 15, 2026: existing profiles preserved,
verification fixtures rolled back, and defaults, five-day save/reload, port-only
preservation, invalid/duplicate/sixth-day rejection and routine pause verified.
Owner isolation, RLS/privileges, consent/audit and independent SMS eligibility
also passed. No OTP or SMS was requested. REG-01-SON backend acceptance is
complete. The parent REG-01 remains partial pending Tier's UI integration and
full application acceptance. Changes still require the Git commit/review workflow.
Son's saved list remains in [son-backlog.md](son-backlog.md).

### REG-02-SON backend acceptance

**Verified October 15, 2026:** user-provided output from
`node scripts/apply-registration-migration.mjs --remove-reported-duplicates`
confirms the approved two profiles were backed up and removed, migration 02
committed, and all real database checks passed: normalization, privileges/RLS,
owner isolation, consent grant/withdrawal/audit, eligibility and Auth revocation.
Other profile count was preserved and verification fixtures were rolled back.
The local backup was checked to contain two full profile rows, and the latest
duplicate report has zero groups. No OTP/SMS request was made by this operation.
Enabled `PAROLA_PHONE_AUTH_ENABLED=true` in ignored `.env.local`; restart the
local backend to load it; the restarted development server was subsequently
confirmed to respond on port 3000. Together with the live OTP/session result and
passing API/hook tests, these checks complete the approved REG-02-SON self-service
backend scope. Assisted operations remain disabled as agreed. Full app HTTP/
session integration, Tier's client acceptance/UI and production deployment checks
remain pending for parent REG-02, which is still partial. This uses the same
backend-only acceptance boundary as REG-01-SON. The notes below record earlier
attempts and do not supersede this signoff.

The read-only report confirmed one duplicate pair. The user was unsure whether
they were test profiles and explicitly authorized removing both. Prepared a
Git-ignored local plan restricted to those exact snapshots and added the opt-in
`--remove-reported-duplicates` operation. It backs up complete rows before deletion,
refuses linked history/verified profiles/custom DELETE triggers/complex keys, and
commits removal only with successful migration verification. Auth users are not
deleted. Nine focused cleanup safeguard tests pass with mocked database calls.
An execution attempt still failed at connection with EACCES; no rows were removed
by the agent. User-terminal execution remains pending. No SMS credits were used.

After certificate setup, the user's migration run reached application but raised
P0001. The migration's explicit apply-stage guard rejects duplicate canonical
phones; this is suspected, not yet confirmed from live rows. Added a read-only
`--check-duplicates` command and preflight, saving affected rows only in the
Git-ignored `.registration-duplicates.local` file and printing counts. Known
duplicate-guard errors now have a useful safe message. No reconciliation,
automatic account deletion/merge or SMS request was performed.

The user's terminal reached PostgreSQL but reported `SELF_SIGNED_CERT_IN_CHAIN`
before migration. The runner now loads a PEM CA from `SUPABASE_DB_CA_FILE` or the
connection-string `sslrootcert` parameter, validates CA content and keeps
certificate/hostname verification enabled. Existing inline `SUPABASE_DB_CA`
remains supported. The TLS error now prints certificate setup instructions;
no bypass flag or SMS call was added. Live migration verification is still pending.

The user kept UI ownership with their teammate and explicitly requested no SMS
credit use during backend work. Added the tracked
`scripts/apply-registration-migration.mjs` runner with apply, dry-run and
verify-only modes. It verifies the schema and rollback-only fixtures in one
transaction: existing account count, normalized phones, RLS/privileges, actual
owner/stranger reads, consent/audit changes, version/owner eligibility and Auth
confirmation revocation. Fixture rows are removed before committing a migration;
no OTP or iPROG endpoint is called. Migration 02 now explicitly enables user RLS
and grants owner-policy-governed SELECT to authenticated clients.

The existing apply helper and the new runner both failed at connection with
EACCES in this workspace; neither made database changes. The new runner's syntax
and help checks pass. 157 focused tests across eight backend/hook test files pass;
these use mocked SMS calls. Live database verification remains pending a run from
the user's terminal. No extra SMS was requested, app phone-auth flag was not
enabled, and REG-02-SON is not marked complete.

Replaced the stale draft registration contract with the implemented endpoint,
session, consent, validation/error and migration examples. Updated shared C03/D02
notes with the user's proven live OTP test. The UI handoff is now ready for Tier's
acceptance; all UI files remain unchanged.

### Historical REG-02-SON update: Supabase/iPROG OTP hook

Son selected Supabase SMS OTP, explicit messaging consent and helpers disabled
in this chat; this supersedes the pending backend selection described in the
older progress notes below. The user reports enabling the Phone provider.
The requested hook implementation is in `supabase/functions/send-sms/index.ts`,
with signature/validation/provider-failure tests and `supabase/config.toml`.
Ownership for this new integration path is recorded in the shared rules.
See [the deployment and hook setup guide](../supabase-sms-otp.md).

Focused validation: 33 handler tests pass using the isolated cached Vitest runner;
the scoped TypeScript check and `git diff --check` also pass.
The local tests exercise real HMAC signatures and mocked HTTP only. Deployment
was initially blocked by missing workspace deployment credentials/network access;
the user subsequently deployed and configured the function in the dashboard.
On October 15, 2026, user-provided terminal output from
`node scripts/test-supabase-otp.mjs` confirms that a real OTP request was accepted,
the received code verified the expected phone and Supabase issued a session.
Session tokens were not printed or saved. The user reports a single SMS on the
successful repeat test; the earlier multiple-message cause is not established.
Migration application, profile/consent persistence and Tier's client integration
remain pending; REG-02-SON remains partial. The app phone-auth flag remains disabled.

### Earlier progress

Live setup check exposed `hook_payload_invalid_content_type` after the user saved
the Phone provider setting. The local successful hook response previously lacked
JSON content type. A response-contract regression assertion failed against that
implementation; the fix returns `Response.json({})` with HTTP 200. Redeployment
of the existing dashboard function and a fresh real OTP request remain required.

Subsequent user setup: screenshots show a deployed function, an enabled Send SMS
hook and the three required secret names. Son reports Verify JWT off and the hook
URL set to the actual `smooth-action` endpoint. Added the standalone
`scripts/test-supabase-otp.mjs` for a local, single-SMS request/verification check
without displaying or persisting session tokens. Live verification remains pending
the user entering their number/code locally. This does not validate the portal UI,
apply the registration migration or enable the app phone-auth flag.

REG-02-SON selected in the current chat. Independent hardening covers confirmed-phone ownership checks, registration input validation and refusing credential-dropping writes on an outdated schema. Verification route/helper scope were requested from Son; C03/D02 remain pending. See the [registration contract proposal](registration-contract.md). No assignment is marked complete.

`REG-02-SON | Tier | components/auth/AuthPage.tsx, context/AppContext.tsx, utils/auth-fetch.ts | replace demo verification/local login with the agreed server flow, collect consent, surface persistence errors and label offline drafts | blocks end-to-end live registration | requested; waiting for C03/D02 agreement`

Validation: `git diff --check` passed. Focused registration/auth tests and the full `npm test` could not start because Vitest is unavailable; TypeScript could not start because its installation is incomplete. `npm ci --ignore-scripts --no-audit --no-fund --prefer-offline` could not complete: the missing Next.js archive download timed out/returned EACCES; installation was stopped. No passing runtime/typecheck result is claimed. Separate standards/spec reviews found no introduced defects and confirmed the live requirements remain incomplete. No migration, live SMS or deployment was performed. Son subsequently authorized a Conventional Commit and push of this partial work on `codex/son/reg-02`; verification/provider and helper-scope decisions remain pending.

Handoff format: `from assignment | to member | requested file/contract change | acceptance/example | blocks | status`. Record requests here and summarize them in chat; this does not authorize sending external messages or changing the recipient's files. The recipient updates their own plan; Son updates shared integration decisions after coordination.

Completion report: assignment ID, owned files changed, focused checks/results, unmet prerequisites, and owner handoffs. Branch pattern: `codex/son/<task>`. Create/use branches only when implementation is requested; this documentation update creates none.
