# Son's task plan

Owner: **Son only**. Updated October 15, 2026. [Hub](../../fixplan.md) | [Shared rules, files and gates](shared.md) | [Full reference](../reference/fixplan-detail.md)

## Before coding

- Confirm identity from this chat; otherwise ask "Who are you working as: Tier, Son, or Toby?" and wait. Never infer it from a branch, username or last session.
- Work on one explicitly selected `-SON` assignment. For a general "continue", propose your next ready assignment and wait for selection. A specific matching assignment in the user's request already establishes the task.
- Only edit owned files listed below and their assigned tests; read other areas for context. Request the owning member's change when a shared dependency is missing. Never finish their portion yourself.
- C01-C08 are interface gates and D01-D10 are unresolved decisions in the shared rules. Pending prerequisites block dependent integration/live behavior; isolated evaluation/tests may proceed only where an assignment explicitly allows it.
- Parent statuses describe existing code, not completion. All boxes remain unchecked. Deferred/superseded items are not the next task without explicit separate prioritization.

## Allowed files

| File group | Allowed scope |
| --- | --- |
| API | `app/api/**` and its tests; `parola-api-service/**` except Toby's HSI file/test listed in shared rules. |
| DB / AUTH / GEO | `backend/migrations/**`, `lib/**` except Tier's listed helpers/tests; `data/**`, `utils/spatial.ts`, `utils/hotspotCalculator.ts`; matching backend tests. |
| DISPATCH | `backend/sms-dispatch/**`, `backend/safety-dispatch/**`, `services/iprogSmsService.ts`, `services/smsServiceInstance.ts`, `templates/**`; SMS/backend test suites. |
| SHARED / DOC | Dependency manifests/lockfiles, shared config/types, other integration paths and shared documents as enumerated in shared rules; your checklist. Never edit Tier/Toby implementation just to integrate it. |

**First candidate:** REG-02-SON, beginning with C03/D02 contact/consent/assistance contract and tests. Live verification waits for an agreed real verification process; no provider capability is presumed.

## Assignments

- [ ] <a id="reg-01-son"></a>**REG-01-SON | P1 | Partial** - [Persist selected-day preferences.](../reference/fixplan-detail.md#reg-01)
  - **Files:** API, DB. **Work:** Persist validated preferences consistently across Next.js/FastAPI/types; preserve them on unrelated edits.
  - **Needs:** C03; D01. **Done when:** Distinct-day limits, time/language/habitat persistence and migration behavior pass API tests.

- [ ] <a id="reg-02-son"></a>**REG-02-SON | P0 | Partial** - [Verify contacts, consent and assisted authority.](../reference/fixplan-detail.md#reg-02)
  - **Files:** API, DB, AUTH. **Work:** Implement verified contact/consent eligibility and scoped assisted changes with actor provenance.
  - **Needs:** C03; D02. **Done when:** Demo verification cannot enroll live recipients; unauthorized cross-user edits fail and assisted edits are attributable.

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

- [ ] <a id="map-03-son"></a>**MAP-03-SON | P1 | Partial** - [Correct species and environment presentation.](../reference/fixplan-detail.md#map-03)
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

- [ ] <a id="ui-01-son"></a>**UI-01-SON | P1 | Partial** - [Align all public and signed-in journeys.](../reference/fixplan-detail.md#ui-01)
  - **Files:** API, DB. **Work:** Provide factual capability/readiness/source metadata used by Tier; remove no frontend copy on Tier's behalf.
  - **Needs:** Relevant C01-C08; UI wiring depends on real capability evidence. **Done when:** Persisted capability status cannot be synthesized from preview/local storage or imply deployment proof.

- [ ] <a id="ui-02-son"></a>**UI-02-SON | P1 | Partial** - [Extend accessible regional-language flows.](../reference/fixplan-detail.md#ui-02)
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

REG-02-SON selected in the current chat. Independent hardening covers confirmed-phone ownership checks, registration input validation and refusing credential-dropping writes on an outdated schema. Verification route/helper scope were requested from Son; C03/D02 remain pending. See the [registration contract proposal](registration-contract.md). No assignment is marked complete.

`REG-02-SON | Tier | components/auth/AuthPage.tsx, context/AppContext.tsx, utils/auth-fetch.ts | replace demo verification/local login with the agreed server flow, collect consent, surface persistence errors and label offline drafts | blocks end-to-end live registration | requested; waiting for C03/D02 agreement`

Validation: `git diff --check` passed. Focused registration/auth tests and the full `npm test` could not start because Vitest is unavailable; TypeScript could not start because its installation is incomplete. `npm ci --ignore-scripts --no-audit --no-fund --prefer-offline` could not complete: the missing Next.js archive download timed out/returned EACCES; installation was stopped. No passing runtime/typecheck result is claimed. Separate standards/spec reviews found no introduced defects and confirmed the live requirements remain incomplete. No migration, live SMS or deployment was performed. Son subsequently authorized a Conventional Commit and push of this partial work on `codex/son/reg-02`; verification/provider and helper-scope decisions remain pending.

Handoff format: `from assignment | to member | requested file/contract change | acceptance/example | blocks | status`. Record requests here and summarize them in chat; this does not authorize sending external messages or changing the recipient's files. The recipient updates their own plan; Son updates shared integration decisions after coordination.

Completion report: assignment ID, owned files changed, focused checks/results, unmet prerequisites, and owner handoffs. Branch pattern: `codex/son/<task>`. Create/use branches only when implementation is requested; this documentation update creates none.
