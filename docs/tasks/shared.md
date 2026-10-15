# Team ownership, interfaces and release gates

Updated October 15, 2026. [Hub](../../fixplan.md) | [Tier](tier.md) | [Son](son.md) | [Toby](toby.md) | [Detailed reference](../reference/fixplan-detail.md)

## Identity and selected scope

1. Before coding, use an explicitly stated current-chat identity or ask exactly: **Who are you working as: Tier, Son, or Toby?** Wait when unknown. Do not infer identity from branch/account/history in a different chat. Tier has identified themselves in the originating chat; that is not a default for teammates.
2. Read the hub, these rules and that member's checklist. A request naming an owned assignment selects it. For a generic request to continue, propose one ready owned assignment and establish selection before coding. An explicit list of owned IDs authorizes that list.
3. Both assignment ownership and file ownership must permit an edit. Read-only investigation/review of another area is allowed; editing, auto-formatting, codegen, installs or migrations must not change another owner's files.
4. If the user requests someone else's assignment, identify its owner and ask whether they intend an explicit reassignment; do not silently switch identity. Explicit user reassignment takes precedence and must be recorded in the ownership documents before dependent code work.
5. Missing contracts/data/another member's work create a handoff; work only on independent selected portions. Never finish someone else's task to unblock yours, impersonate them, or spawn a subagent to bypass scope.
6. User-requested documentation maintenance may update the agreed coordination documents; it never authorizes implementing their application backlog. These instructions guide agents, not operating-system access permissions.

## Exact file ownership

Most-specific path wins. New files use the matching scope; any unlisted/ambiguous integration path needs Son to record its owner before edits. Ownership grants no authority beyond the selected assignment. Existing user changes must be preserved.

| Owner | Owned paths / exceptions |
| --- | --- |
| Tier: UI | `app/**` excluding `app/api/**`; `components/**`, `hooks/**`, `context/**`, `public/**`; their colocated frontend tests. |
| Tier: client | `services/**` except Son's `iprogSmsService.ts` and `smsServiceInstance.ts`; `utils/**` except Son's `spatial.ts` and `hotspotCalculator.ts`; `lib/dashboard.ts`, `lib/dashboard.test.ts`, `lib/updates.ts`, `lib/updates.test.ts`, `lib/frontend/**`, `tests/dashboardService.test.ts`, `tests/frontend/**`. |
| Son: API / registry | `app/api/**` and tests; `parola-api-service/**` except Toby's exact HSI paths below. |
| Son: storage / server / geography | `backend/migrations/**`; `lib/**` except Tier's exact files/subtree; `data/**`; `utils/spatial.ts`, `utils/hotspotCalculator.ts`; new `tests/backend/**` and matching server/region tests. |
| Son: SMS / operational safety | `backend/sms-dispatch/**`, `backend/safety-dispatch/**`, `services/iprogSmsService.ts`, `services/smsServiceInstance.ts`, `templates/**`; `tests/iprogSmsService.test.ts`, `tests/philippineRegions.test.ts`, `tests/run_all_tests.js`, `tests/verify.js`. |
| Toby: inference / science | `backend/aws-inference/**` except all dependency manifests; `notebooks/**`, `backend/science/**` and their tests. Inference SAM/config is Toby's; operational alert dispatch is Son's separate scope. |
| Toby: scientific legacy modules | Within `StarIsdaData/backend/`: `download.py`, `model_layers.py`, `weather.py`, `ocean_data.py`, `ocean_temperature.py`, `ocean_salinity.py`, `ocean_currents.py`, `ocean_chlorophyll.py`; `tests/test_download.py` and `tests/test_model_layers.py`. |
| Toby: HSI | `parola-api-service/hsi_calculator.py`, `parola-api-service/tests/test_hsi_calculator.py`. API callers/schemas stay Son's; interface changes require handoff. |
| Son: legacy integration | Remaining `StarIsdaData/backend/**`, including `main.py`, `database.py`, `config.py` and their tests; remaining `backend/**` excluding Toby's inference/science scopes. |
| Son: shared integration | `types/index.ts` and other shared types; all dependency manifests/lockfiles (including Python requirements), root configuration, `middleware.ts`, deployment scripts, CI/hooks and integration-test configuration. Son coordinates these changes; Tier/Toby submit requests rather than changing them via install/codegen side effects. |
| Son: Supabase integration | `supabase/**`: REG-02-SON Send SMS Auth hook, its configuration and tests; deployment instructions in `docs/supabase-sms-otp.md`. |
| Documentation | Each member owns their own task-file statuses/handoffs. Son maintains hub/shared rules/reference/team-wide instructions and other integration docs after coordination. Tier owns frontend user guides/copy; Toby scientific documentation in owned directories. Explicit user-requested team-document maintenance is the stated exception. |

File-group names in member checklists are shorthand for this table, never broader permissions. In particular, Tier's `lib/dashboard.ts` ownership permits consuming the server decision, not inventing separate production safety thresholds. Toby supplies scientifically validated rule/input recommendations; Son owns shared operational safety contracts and enforcement. Coordinate new common helpers before adding them.

## Interface handoffs (C03 backend selection recorded; consumer integration pending)

**C03 registration subset, October 15, 2026:** Son explicitly selected Supabase SMS OTP, explicit messaging consent and disabled assisted access in this chat. Backend contract/examples are in [registration-contract.md](registration-contract.md). User-provided command output confirms a live iPROG OTP/session test, migration 02 application and real database consent/owner-isolation checks. Two explicitly approved duplicate profiles were backed up and removed; other accounts and Auth identities were preserved. Tier consultation/client acceptance and actual app integration remain pending. This selection does not settle REG-01/D01 schedule defaults or report/review delegation.

Son records each approved interface and example in this section after consulting producer/consumer owners. This document selects responsibilities, not final database/wire shapes. Existing product decisions remain unresolved below; agents must not invent defaults to clear a gate.

| Gate | Coordinator / consultation | Agreement required before dependent integration |
| --- | --- | --- |
| C01: predictions / land / run | Son; Toby produces scientific data, Tier consumes | Numeric coordinates/order, cell/mask/run/source/model versions, input/generation/validity times, quality/coverage/publication, score units, feature/cluster support and unknown handling. Geometry/storage changes are Son's; inference payload is Toby's. |
| C02: safety | Son; Toby validates science/providers, Tier consumes | Vessel profile, applicable geography, units, issue/validity/freshness, rule version/reasons, NORMAL/suppressed/UNKNOWN semantics and query/SMS/export suppression. Known applicable warnings survive unrelated outages. |
| C03: registry / access | Son; Tier designs user flow | Contact verification, separate consent/roles/assisting actor, home port, selected weekdays/time/language/habitat/ranking and persistence/migration/error states. |
| C04: dispatch | Son; Tier consumes | Separate routine/critical identities, next scheduled day, attempts/idempotency/retries, callback authentication, queued/submitted/delivered/failed/unknown, encoding/segments and sponsor eligibility. |
| C05: catch review | Son; Tier enters/displays, Toby consumes reviewed exports | Trip/area/optional GPS, species, weight/effort units including zero, fisher/assistant, corrections/review status, duplicate handling and evaluation eligibility. Ratings stay separate. |
| C06: spatial / selection | Son; Toby scientific review, Tier consumes | Authoritative/versioned marine scopes/restrictions, ranking/thresholds/count metadata, recommendation counting/rotation and explicit unsupported/empty coverage. |
| C07: enterprise / exports | Son; Toby supplies forecasts, Tier consumes | Verified vessel/plan/operator scope, trial/payment activation, zone identity/cycle/expiry/re-download rules, supported horizon/format/device evidence and safe authorized artifact delivery. |
| C08: evaluation / privacy | Son; Toby scientific metrics, Tier presentation | Approved de-identification, reviewed-data export/retention/access, reproducible metrics/sample sizes/limits, operational outcomes versus targets and allowed institutional aggregation. |

A gate is satisfied by a written agreed contract and representative examples/errors, not by assuming a feature is deployed. Son owns schema/contract/dependency edits; Toby implements producer-side adapters/tests; Tier implements client consumption/tests after agreement. If runtime implementation is not yet available, isolated fixtures/tests may use the agreed contract, but cannot be connected to live guidance or advertised as working.

## Product decisions (D02 registration subset selected; remaining decisions pending)

**D02 registration decision:** Son approved Supabase SMS OTP and explicit messaging consent, with helpers disabled for now (current chat, October 15, 2026). Backend registration and consent changes require the confirmed owner's Supabase session; admin keys do not enroll or consent on a fisher's behalf. User-provided output confirms live iPROG OTP verification and database consent/audit/owner-isolation checks. Tier's client acceptance, actual app integration and report/review assistance decisions remain pending.

The coordinators must record the actual decision, consulted members, evidence/date and affected gates. No name here grants legal approval or authority to choose unsupported scientific policy.

| ID | Coordinator; consult | Decision and affected work |
| --- | --- | --- |
| D01 | Son; Tier | Son approved October 15, 2026: 0–5 distinct ISO weekdays (1 Monday through 7 Sunday); zero pauses routine advisories; 05:00 Asia/Manila default; edits affect future unsent advisories without a cutoff; existing users start with no days. Critical alerts remain independent. Tier acceptance/UI wiring and SMS-01 dispatch implementation remain pending. C03/C04; REG-01, SMS-01, OPS-01. |
| D02 | Son; Tier | Real verification/provider route, assisted enrollment/report/review scope and revocation. C03/C05/C08; REG-02, REPORT-02, PRIV-01. |
| D03 | Son; Toby and Tier | Provider/input freshness, affected-area sampling, approved vessel-specific thresholds/comparisons, safe unknown/known-hazard precedence and independent alert cadence versus inference. C01/C02/C04; SAFE-01/02/03, SMS-01/02, OPS-01. Toby coordinates scientific validation; Son coordinates operational agreement. |
| D04 | Son; Toby and Tier | Highest-score/nearest/combined formula and calibrated confidence, recommendation event/window/threshold, retries/re-download accounting and alternative selection. C01/C06; MAP-02, GEO-03. |
| D05 | Son; Toby and Tier, authoritative partners | Marine boundary source/coverage and product/legal GT classification including 3.0/fractional boundary cases. C03/C06/C07; GEO-01/02, ENT-01. Do not infer legal clearance from administrative polygons. |
| D06 | Son; Tier and Toby | Calendar-day vs rolling zone cycle, zone definition, horizon/format/revision changes, scope changes and expiry/re-download policy. C06/C07; GEO-03, ENT-01/02. |
| D07 | Son; Tier | Gateway quote/sender approval/callback/failover/encoding; sponsorship conditions and enterprise activation/payment workflow. C03/C04/C07; SMS-02/03, ENT-01. Budgeted alerts are never hazard caps. |
| D08 | Toby; Son | Scientific source/mask/VIIRS/shallow/backup accuracy, access/licences/validity and data lineage. Son additionally owns authoritative marine/restriction acquisition, database cleanup/migration/atomic publication/rollback approvals. C01/C02/C06/C07; DATA, OPS, GEO and exports. Never invent legacy provenance. |
| D09 | Toby; Son and Tier | Catch/effort scientific units, pilot/evaluation protocol, review eligibility and honest uncertainty. Son coordinates review/correction access, consent and retention (one-year audit proposal needs review). C05/C08; REPORT, EVAL, PRIV. |
| D10 | Tier; Son and pilot partners | Regional terminology/translations, accessible forms/statuses and language fallback; Son persists language and operational validation. C03-C05; UI-02. User-flow choices must stay within approved product/safety rules. |

**C03/D01 preference subset, October 15, 2026:** REG-01-SON backend acceptance is
complete. Owner-only registration/profile APIs, TypeScript/FastAPI contracts,
and migration 03 implement the approved preference rules. Focused API/schema/
type checks and Son's live database apply/verification passed; existing profiles
were preserved and fixtures rolled back without OTP/SMS requests. Tier consumes
[advisory-preferences-contract.md](advisory-preferences-contract.md). Parent REG-01
remains partial pending Tier integration and full application acceptance. The
earlier C03 registration note predates this D01 decision.

## All 31 parent tasks and member assignments

Priority/status are inherited from the detailed plan; none is complete. A named owner appears only once for each member-specific ID. The full parent acceptance criteria and source evidence remain binding in the linked reference. This matrix is a dependency map, not permission to execute another member's IDs.

| Parent | Priority / inherited status | Tier | Son | Toby |
| --- | --- | --- | --- | --- |
| [REG-01](../reference/fixplan-detail.md#reg-01) | P1 / Partial | [REG-01-TIER](tier.md#reg-01-tier) | [REG-01-SON — backend complete](son.md#reg-01-son) | - |
| [REG-02](../reference/fixplan-detail.md#reg-02) | P0 / Partial | [REG-02-TIER](tier.md#reg-02-tier) | [REG-02-SON](son.md#reg-02-son) | - |
| [SMS-01](../reference/fixplan-detail.md#sms-01) | P1 / Partial | [SMS-01-TIER](tier.md#sms-01-tier) | [SMS-01-SON](son.md#sms-01-son) | - |
| [SMS-02](../reference/fixplan-detail.md#sms-02) | P0 / Partial | [SMS-02-TIER](tier.md#sms-02-tier) | [SMS-02-SON](son.md#sms-02-son) | - |
| [SMS-03](../reference/fixplan-detail.md#sms-03) | P1 / Partial | [SMS-03-TIER](tier.md#sms-03-tier) | [SMS-03-SON](son.md#sms-03-son) | - |
| [SAFE-01](../reference/fixplan-detail.md#safe-01) | P0 / Partial | [SAFE-01-TIER](tier.md#safe-01-tier) | [SAFE-01-SON](son.md#safe-01-son) | [SAFE-01-TOBY](toby.md#safe-01-toby) |
| [SAFE-02](../reference/fixplan-detail.md#safe-02) | P0 / Partial | [SAFE-02-TIER](tier.md#safe-02-tier) | [SAFE-02-SON](son.md#safe-02-son) | [SAFE-02-TOBY](toby.md#safe-02-toby) |
| [SAFE-03](../reference/fixplan-detail.md#safe-03) | P0 / Partial | [SAFE-03-TIER](tier.md#safe-03-tier) | [SAFE-03-SON](son.md#safe-03-son) | [SAFE-03-TOBY](toby.md#safe-03-toby) |
| [DATA-01](../reference/fixplan-detail.md#data-01) | P0 / Planned | [DATA-01-TIER](tier.md#data-01-tier) | [DATA-01-SON](son.md#data-01-son) | [DATA-01-TOBY](toby.md#data-01-toby) |
| [DATA-02](../reference/fixplan-detail.md#data-02) | P0 / Planned | [DATA-02-TIER](tier.md#data-02-tier) | [DATA-02-SON](son.md#data-02-son) | [DATA-02-TOBY](toby.md#data-02-toby) |
| [DATA-03](../reference/fixplan-detail.md#data-03) | P0 / Planned | [DATA-03-TIER](tier.md#data-03-tier) | [DATA-03-SON](son.md#data-03-son) | [DATA-03-TOBY](toby.md#data-03-toby) |
| [DATA-04](../reference/fixplan-detail.md#data-04) | P1 / Planned | [DATA-04-TIER](tier.md#data-04-tier) | [DATA-04-SON](son.md#data-04-son) | [DATA-04-TOBY](toby.md#data-04-toby) |
| [MAP-01](../reference/fixplan-detail.md#map-01) | P0 / Partial | [MAP-01-TIER](tier.md#map-01-tier) | [MAP-01-SON](son.md#map-01-son) | - |
| [MAP-02](../reference/fixplan-detail.md#map-02) | P1 / Partial | [MAP-02-TIER](tier.md#map-02-tier) | [MAP-02-SON](son.md#map-02-son) | [MAP-02-TOBY](toby.md#map-02-toby) |
| [MAP-03](../reference/fixplan-detail.md#map-03) | P1 / Partial | [MAP-03-TIER](tier.md#map-03-tier) | [MAP-03-SON](son.md#map-03-son) | [MAP-03-TOBY](toby.md#map-03-toby) |
| [OPS-01](../reference/fixplan-detail.md#ops-01) | P1 / Partial | [OPS-01-TIER](tier.md#ops-01-tier) | [OPS-01-SON](son.md#ops-01-son) | [OPS-01-TOBY](toby.md#ops-01-toby) |
| [REPORT-01](../reference/fixplan-detail.md#report-01) | P1 / Planned | [REPORT-01-TIER](tier.md#report-01-tier) | [REPORT-01-SON](son.md#report-01-son) | - |
| [REPORT-02](../reference/fixplan-detail.md#report-02) | P1 / Planned | [REPORT-02-TIER](tier.md#report-02-tier) | [REPORT-02-SON](son.md#report-02-son) | [REPORT-02-TOBY](toby.md#report-02-toby) |
| [EVAL-01](../reference/fixplan-detail.md#eval-01) | P1 / Planned | [EVAL-01-TIER](tier.md#eval-01-tier) | [EVAL-01-SON](son.md#eval-01-son) | [EVAL-01-TOBY](toby.md#eval-01-toby) |
| [GEO-01](../reference/fixplan-detail.md#geo-01) | P0 / Planned | [GEO-01-TIER](tier.md#geo-01-tier) | [GEO-01-SON](son.md#geo-01-son) | - |
| [GEO-02](../reference/fixplan-detail.md#geo-02) | P1 / Planned | [GEO-02-TIER](tier.md#geo-02-tier) | [GEO-02-SON](son.md#geo-02-son) | - |
| [GEO-03](../reference/fixplan-detail.md#geo-03) | P1 / Planned | [GEO-03-TIER](tier.md#geo-03-tier) | [GEO-03-SON](son.md#geo-03-son) | [GEO-03-TOBY](toby.md#geo-03-toby) |
| [ENT-01](../reference/fixplan-detail.md#ent-01) | P2 / Planned | [ENT-01-TIER](tier.md#ent-01-tier) | [ENT-01-SON](son.md#ent-01-son) | - |
| [ENT-02](../reference/fixplan-detail.md#ent-02) | P2 / Partial | [ENT-02-TIER](tier.md#ent-02-tier) | [ENT-02-SON](son.md#ent-02-son) | [ENT-02-TOBY](toby.md#ent-02-toby) |
| [ROAD-01](../reference/fixplan-detail.md#road-01) | P2 / Deferred | [ROAD-01-TIER](tier.md#road-01-tier) | [ROAD-01-SON](son.md#road-01-son) | [ROAD-01-TOBY](toby.md#road-01-toby) |
| [UI-01](../reference/fixplan-detail.md#ui-01) | P1 / Partial | [UI-01-TIER](tier.md#ui-01-tier) | [UI-01-SON](son.md#ui-01-son) | - |
| [UI-02](../reference/fixplan-detail.md#ui-02) | P1 / Partial | [UI-02-TIER](tier.md#ui-02-tier) | [UI-02-SON](son.md#ui-02-son) | - |
| [PRIV-01](../reference/fixplan-detail.md#priv-01) | P1 / Partial | [PRIV-01-TIER](tier.md#priv-01-tier) | [PRIV-01-SON](son.md#priv-01-son) | [PRIV-01-TOBY](toby.md#priv-01-toby) |
| [UX-01](../reference/fixplan-detail.md#ux-01) | P2 / Deferred | [UX-01-TIER](tier.md#ux-01-tier) | [UX-01-SON](son.md#ux-01-son) | [UX-01-TOBY](toby.md#ux-01-toby) |
| [LEG-01](../reference/fixplan-detail.md#leg-01) | P2 / Superseded | - | [LEG-01-SON](son.md#leg-01-son) | - |
| [LEG-02](../reference/fixplan-detail.md#leg-02) | P2 / Deferred | [LEG-02-TIER](tier.md#leg-02-tier) | [LEG-02-SON](son.md#leg-02-son) | - |

Historical H01-H22 findings and their resolutions remain in [reference section 3.1](../reference/fixplan-detail.md#31-original-22-findings-complete-traceability). Some earlier audit files and the external concept PDF are local-only/ignored; the archived text preserves the attributed observations, page references and limitations so teammates do not need those local files to understand their assignment. Never add secrets or the external PDF to solve a missing reference.

## Branch, dependency and completion workflow

- Separate checkout/branch per member/task: `codex/tier/<task>`, `codex/son/<task>`, `codex/toby/<task>`. No branch, deployment, migration, model run or live SMS is created by this documentation update.
- Establish the selected owned ID, allowed files and pending gates before edits. Shared-file requests go to Son; a Son integration request that needs frontend/scientific code goes back to its owner. Son does not take over their implementation.
- Record handoffs in the requesting member's own plan: from-ID, recipient, exact requested file/contract change, example/acceptance, dependent work and status. The recipient updates their own records; Son updates agreed shared decisions. Summarizing in chat is enough; do not message external apps/teammates without explicit authorization.
- Merge agreed contracts first, then each producer/backend/client implementation in dependency order. Son coordinates review/integration; merging/publishing still requires the user's authorized workflow. Never stage, revert or format another member's changes as incidental cleanup.
- Keep existing parent priorities; the P0 foundation precedes pilot live release, while independent honest-copy work can proceed. Deferred ROAD-01/UX-01/LEG-02 and superseded LEG-01 remain outside active work unless explicitly reprioritized.
- The original plan includes cross-feature release dependencies that can look circular. Separate contract agreement, isolated implementation and release: e.g. feature extraction can be built/tested before sufficient reviewed catch data exists, but cannot claim calibrated validation or publish unsupported guidance.
- Check off only your own assignment after its focused acceptance checks pass and report proof plus unmet dependencies. Partial/Deferred/Superseded labels must not silently become completed. A parent completes only after all its active required member portions and integration gates pass; each role's approval/test evidence is required.
- Son records parent integration evidence in this document when requested; Tier/Toby completion alone never completes the backend or full parent feature. Read-only review of another role is allowed; resulting fixes remain theirs.

## Release checks

| Gate | Required evidence / phase |
| --- | --- |
| A: trust and safety foundation | Real source/run provenance; validated land/coordinate checks; no production simulation; shared fail-closed safety including independent known warnings; verified contact/consent and privacy prerequisites. |
| B: pilot | Selected-day routine dispatch plus any-day critical alerts; structured zero-catch/assisted reporting and review; valid regional scope/ranking, data quality and permissions; honest accessible UI. Scoped commercial trials are distinct from paid SaaS. |
| C: enterprise | Verified entitlements/atomic locks; real safe spatial/forecast exports, supported device imports and applicable validated exclusions. |
| D: later roadmap | Independently evidenced satellite/fleet/institutional/optional map or fuel additions; no target represented as achieved result. |

Run appropriate focused checks in each owned area, then relevant integration/build checks when implementation warrants them. Detailed future scenarios remain in [reference section 7](../reference/fixplan-detail.md#7-future-acceptance-and-verification-scenarios). Validate provider outages, no-land, Manila dates, zero catch, any-day alerts, access denials and export locks jointly at release. No code tests are needed for this documentation split.

## Identity/scope walkthroughs

| Request | Agent behavior |
| --- | --- |
| New chat: "implement the next fix" without a name | Ask the exact identity question and wait; then propose one ready owned ID and establish selection. |
| "I'm Tier; implement REG-01-TIER" | Load Tier/shared plans, check C03 readiness and edit only Tier files; missing Son contract becomes a handoff. |
| Tier requests REG-01-SON | Explain Son ownership; do not switch or implement it without an explicit recorded user reassignment. |
| Toby needs a migration or Python dependency | Request Son's schema/manifest change; do not edit it via inference work or install side effects. |
| Son completes an API portion | Mark only the SON ID; request corresponding Tier/Toby work rather than complete or merge it implicitly. |
| User requests this team-document reorganization | Edit agreed documents/ignore entry only; it does not select any application assignment. |
