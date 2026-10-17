# Team ownership, interfaces and release gates

Updated October 17, 2026. [Hub](../../fixplan.md) | [Tier](tier.md) | [Son](son.md) | [Toby](toby.md) | [Detailed reference](../reference/fixplan-detail.md)

## Identity and selected scope

1. Before coding, use an explicitly stated current-chat identity or ask exactly: **Who are you working as: Tier, Son, or Toby?** Wait when unknown. Do not infer identity from branch/account/history in a different chat. Tier has identified themselves in the originating chat; that is not a default for teammates.
2. Read the hub, these rules and that member's checklist. A request naming an owned assignment selects it. For a generic request to continue, propose one ready owned assignment and establish selection before coding. An explicit list of owned IDs authorizes that list.
3. Both assignment ownership and file ownership must permit an edit. Read-only investigation/review of another area is allowed; editing, auto-formatting, codegen, installs or migrations must not change another owner's files.
4. If the user requests someone else's assignment, identify its owner and ask whether they intend an explicit reassignment; do not silently switch identity. Explicit user reassignment takes precedence and must be recorded in the ownership documents before dependent code work.
5. Missing contracts/data/another member's work create a handoff; work only on independent selected portions. Never finish someone else's task to unblock yours, impersonate them, or spawn a subagent to bypass scope.
6. User-requested documentation maintenance may update the agreed coordination documents; it never authorizes implementing their application backlog. These instructions guide agents, not operating-system access permissions.

## Urgent hotspot threshold exception — October 17, 2026

Toby identified themselves in the current chat and explicitly authorized this task as lead programmer: lower hotspot eligibility from 60% to an inclusive 50%, align the dashboard map legend, and recalculate today's hotspots in AWS. For this task only, Toby may edit Tier's `components/features/hotspots/MapComponent.tsx` and `utils/speciesColors.ts`, Son's `lib/regional-predictions.ts` and `app/api/advisories/nearest/route.ts`, and directly related threshold tests, alongside Toby's inference files. Existing owners retain all other scope. No backlog package is selected or completed by this exception. The scoped October 17 pelagic deployment, invocation and database/API evidence are recorded in the [scientific run report](../../backend/aws-inference/REAL_INPUT_RUN.md); this grants no broader backlog or release authority.

The user's subsequent explicit request to update Copernicus credentials extends this task's exception to the ignored root `.env.local` and the identified inference Lambda's Copernicus environment settings. Preserve unrelated settings and AWS revision checks. Never put credential values in coordination documents, tracked source or command output. Credential configuration alone does not establish real-data ingestion or authorize representing synthetic results as actual observations.

The user subsequently saved AWS credentials in `.env.local` and requested direct AWS work instead of further CloudShell commands. This task includes reading those local credentials and correcting the local AWS region/model-bucket settings from verified deployment metadata. Keep credentials in the ignored file and preserve unrelated values.

For the same requested real recalculation, Toby is implementing the necessary owned inference workflow: reconstruct the current month's 2015–2025 baseline from the original notebook, prepare dated real Copernicus inputs, update the existing ARM64 Lambda's application source, and publish its verified result to the existing prediction table. This task-specific operational scope uses the existing schema and preserves other dates/models and any conflicting existing same-day work. It does not select or complete the broader DATA/OPS/GEO packages, introduce shared dependency changes, or authorize SMS dispatches.

Toby subsequently requested help testing the local application after the sign-in screen reported a missing `PAROLA_DEMO_SESSION_SECRET`. This follow-up covers configuring that missing server-only secret in ignored `.env.local` and checking that the existing local demo authentication rejects an unsigned request normally. Preserve the existing account/password checks and auth mode; no auth implementation, account creation, database migration, live SMS or hosted configuration changes are selected.

Local configuration check: generated a random secret in mode-0600 `.env.local`, preserving all other values. The running local server picked it up: `/api/users/profile` with an invalid demo cookie returned HTTP 401, `Sign in again to continue.`, rather than the missing-secret error. No account sign-in or full browser journey is claimed by this check.

## Exact file ownership

### User-requested withdrawal of the October 17 run

Toby explicitly requested updating Supabase and deleting the previous predictions
created by this session. This authorizes withdrawing only the 11,007 prediction
IDs recorded for run `20261016T184655Z-bb3d5095ad6e`, after checking row identity,
dependencies and saving a recoverable backup. Preserve other runs/dates/models.
The exported October 17 CSV contains those same scores, not a corrected result;
replacement source/method is being clarified before inserting replacement data.
Never relabel the original July 10 CSV as today's predictions. Record the final
withdrawal/publication evidence in Toby's run documentation.

Toby selected a fresh run rather than importing the July CSV. The replacement
uses current-day real inputs and the notebook's filtering variant (cell 8:
historical haversine DBSCAN, eps 0.001 radians, min_samples 15, sampled to
100,000 rows with seed 42, retain candidates within 15 km of a cluster mean),
with the requested inclusive 50% score floor. Reconstruct the historical
reference from the surviving positive-presence Parquet and record its lineage;
do not claim byte identity with the missing merged dataset. This extends the
task's scoped existing-schema publication exception to the verified replacement.
Preserve source coordinates, calibrated-score limitations, missing-input
exclusions and the older September records; no frontend redesign or SMS work.

### User-requested daily hotspot pipeline integration and AWS deployment

Toby explicitly authorized integrating the updated Pelagic + Demersal daily
hotspot prediction pipeline specified in
`/Users/gianne/Development/Python/Parola/AWS_DEPLOYMENT_HANDOFF.md` and
`/Users/gianne/Development/Python/Parola/run_daily_predictions.py` into
`backend/aws-inference/`, adding an explicit code/environment toggle (enabled by
default) to pause or skip daily prediction runs when desired, updating
`backend/aws-inference/requirements.txt` (task-specific shared dependency
manifest exception), and deploying the updated container image and schedule
configuration to the existing AWS Lambda (`parola-ParolaInferenceFunction-OjglErBmhUc2`).

Toby subsequently authorized lowering the stored and queryable hotspot
threshold floor from `0.50` (50%) to `0.25` (25%) in the daily prediction
pipeline (`run_daily_predictions.py`), Supabase (`public.daily_grid_predictions`),
and backend regional/nearest advisory queries (`lib/regional-predictions.ts`,
`app/api/advisories/nearest/route.ts`), while keeping the default displayed
threshold at `>= 50%` and adding a user-adjustable minimum threshold slider
(`25%`–`90%`, default `50%`) to the map and dashboard UI (`components/dashboard/**`,
`components/features/hotspots/**`, `lib/dashboard.ts`, `utils/speciesColors.ts`,
and associated tests) so municipalities without `>= 50%` hotspots can access
lower-threshold predictions down to 25%.

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
| Son: shared integration | `types/index.ts` and other shared types; all dependency manifests/lockfiles (including Python requirements), root configuration, `middleware.ts`, deployment scripts, CI/hooks and integration-test configuration. Son coordinates these shared changes; Tier/Toby submit requests rather than changing them via install/codegen side effects. Tier-local models/types/adapters in owned frontend paths are explicitly Tier-owned; they do not redefine the shared wire schema. |
| Documentation | Each member owns their own task-file statuses/handoffs. Son maintains hub/shared rules/reference/team-wide instructions and other integration docs after coordination. Tier owns frontend user guides/copy; Toby scientific documentation in owned directories. Explicit user-requested team-document maintenance is the stated exception. |

File-group names in member checklists are shorthand for this table, never broader permissions. In particular, Tier's `lib/dashboard.ts` ownership permits consuming the server decision, not inventing separate production safety thresholds. Toby supplies scientifically validated rule/input recommendations; Son owns shared operational safety contracts and enforcement. Coordinate new common helpers before adding them.

## Interface reference categories (C01–C08)

These categories classify integration concerns, not prerequisites for every member task. Use existing verified responses now; isolated owned work may use explicitly provisional local fixtures. Son records approved shared contracts/examples after producer/consumer consultation. Historical Pending entries require rechecking against the selected baseline; preserve later published agreements and do not invent policy.

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

Actual dependent integration requires an agreed contract and representative success/error examples. Shared wire schemas remain Son-owned. Tier independently owns frontend-local models/types/adapters and fixtures in its existing paths; those are not approved API contracts. Toby independently owns scientific evaluation with isolated inputs. Neither fixtures nor code inspection prove live readiness.

## Product decision reference (D01–D10)

The coordinators must record the actual decision, consulted members, evidence/date and affected gates. No name here grants legal approval or authority to choose unsupported scientific policy.

| ID | Coordinator; consult | Decision and affected work |
| --- | --- | --- |
| D01 | Son; Tier | Weekday minimum/zero-day pause, advisory time (05:00 code vs 04:30 copy), edit cutoff and consent-safe existing-user migration. C03/C04; REG-01, SMS-01, OPS-01. |
| D02 | Son; Tier | Real verification/provider route, assisted enrollment/report/review scope and revocation. C03/C05/C08; REG-02, REPORT-02, PRIV-01. |
| D03 | Son; Toby and Tier | Provider/input freshness, affected-area sampling, approved vessel-specific thresholds/comparisons, safe unknown/known-hazard precedence and independent alert cadence versus inference. C01/C02/C04; SAFE-01/02/03, SMS-01/02, OPS-01. Toby coordinates scientific validation; Son coordinates operational agreement. |
| D04 | Son; Toby and Tier | Highest-score/nearest/combined formula and calibrated confidence, recommendation event/window/threshold, retries/re-download accounting and alternative selection. C01/C06; MAP-02, GEO-03. |
| D05 | Son; Toby and Tier, authoritative partners | Marine boundary source/coverage and product/legal GT classification including 3.0/fractional boundary cases. C03/C06/C07; GEO-01/02, ENT-01. Do not infer legal clearance from administrative polygons. |
| D06 | Son; Tier and Toby | Calendar-day vs rolling zone cycle, zone definition, horizon/format/revision changes, scope changes and expiry/re-download policy. C06/C07; GEO-03, ENT-01/02. |
| D07 | Son; Tier | Gateway quote/sender approval/callback/failover/encoding; sponsorship conditions and enterprise activation/payment workflow. C03/C04/C07; SMS-02/03, ENT-01. Budgeted alerts are never hazard caps. |
| D08 | Toby; Son | Scientific source/mask/VIIRS/shallow/backup accuracy, access/licences/validity and data lineage. Son additionally owns authoritative marine/restriction acquisition, database cleanup/migration/atomic publication/rollback approvals. C01/C02/C06/C07; DATA, OPS, GEO and exports. Never invent legacy provenance. |
| D09 | Toby; Son and Tier | Catch/effort scientific units, pilot/evaluation protocol, review eligibility and honest uncertainty. Son coordinates review/correction access, consent and retention (one-year audit proposal needs review). C05/C08; REPORT, EVAL, PRIV. |
| D10 | Tier; Son and pilot partners | Regional terminology/translations, accessible forms/statuses and language fallback; Son persists language and operational validation. C03-C05; UI-02. User-flow choices must stay within approved product/safety rules. |

## All 31 parent tasks and member assignments

Priority/status below are inherited historical labels, not a fresh audit of completion. A named owner appears only once for each member-specific ID. The full parent acceptance criteria and source evidence remain binding in the linked reference. This matrix is a dependency map, not permission to execute another member's IDs.

| Parent | Priority / inherited status | Tier | Son | Toby |
| --- | --- | --- | --- | --- |
| [REG-01](../reference/fixplan-detail.md#reg-01) | P1 / Partial | [REG-01-TIER → TIER-01](tier.md#reg-01-tier) | [REG-01-SON → SON-01](son.md#reg-01-son) | - |
| [REG-02](../reference/fixplan-detail.md#reg-02) | P0 / Partial | [REG-02-TIER → TIER-01](tier.md#reg-02-tier) | [REG-02-SON → SON-01](son.md#reg-02-son) | - |
| [SMS-01](../reference/fixplan-detail.md#sms-01) | P1 / Partial | [SMS-01-TIER → TIER-03](tier.md#sms-01-tier) | [SMS-01-SON → SON-02](son.md#sms-01-son) | - |
| [SMS-02](../reference/fixplan-detail.md#sms-02) | P0 / Partial | [SMS-02-TIER → TIER-03](tier.md#sms-02-tier) | [SMS-02-SON → SON-02](son.md#sms-02-son) | - |
| [SMS-03](../reference/fixplan-detail.md#sms-03) | P1 / Partial | [SMS-03-TIER → TIER-03](tier.md#sms-03-tier) | [SMS-03-SON → SON-02](son.md#sms-03-son) | - |
| [SAFE-01](../reference/fixplan-detail.md#safe-01) | P0 / Partial | [SAFE-01-TIER → TIER-03](tier.md#safe-01-tier) | [SAFE-01-SON → SON-03](son.md#safe-01-son) | [SAFE-01-TOBY → TOBY-04](toby.md#safe-01-toby) |
| [SAFE-02](../reference/fixplan-detail.md#safe-02) | P0 / Partial | [SAFE-02-TIER → TIER-03](tier.md#safe-02-tier) | [SAFE-02-SON → SON-03](son.md#safe-02-son) | [SAFE-02-TOBY → TOBY-04](toby.md#safe-02-toby) |
| [SAFE-03](../reference/fixplan-detail.md#safe-03) | P0 / Partial | [SAFE-03-TIER → TIER-03](tier.md#safe-03-tier) | [SAFE-03-SON → SON-03](son.md#safe-03-son) | [SAFE-03-TOBY → TOBY-04](toby.md#safe-03-toby) |
| [DATA-01](../reference/fixplan-detail.md#data-01) | P0 / Planned | [DATA-01-TIER → TIER-02](tier.md#data-01-tier) | [DATA-01-SON → SON-04](son.md#data-01-son) | [DATA-01-TOBY → TOBY-01](toby.md#data-01-toby) |
| [DATA-02](../reference/fixplan-detail.md#data-02) | P0 / Planned | [DATA-02-TIER → TIER-02](tier.md#data-02-tier) | [DATA-02-SON → SON-04](son.md#data-02-son) | [DATA-02-TOBY → TOBY-03](toby.md#data-02-toby) |
| [DATA-03](../reference/fixplan-detail.md#data-03) | P0 / Planned | [DATA-03-TIER → TIER-02](tier.md#data-03-tier) | [DATA-03-SON → SON-04](son.md#data-03-son) | [DATA-03-TOBY → TOBY-02](toby.md#data-03-toby) |
| [DATA-04](../reference/fixplan-detail.md#data-04) | P1 / Planned | [DATA-04-TIER → TIER-02](tier.md#data-04-tier) | [DATA-04-SON → SON-04](son.md#data-04-son) | [DATA-04-TOBY → TOBY-05](toby.md#data-04-toby) |
| [MAP-01](../reference/fixplan-detail.md#map-01) | P0 / Partial | [MAP-01-TIER → TIER-02](tier.md#map-01-tier) | [MAP-01-SON → SON-04](son.md#map-01-son) | - |
| [MAP-02](../reference/fixplan-detail.md#map-02) | P1 / Partial | [MAP-02-TIER → TIER-02](tier.md#map-02-tier) | [MAP-02-SON → SON-04](son.md#map-02-son) | [MAP-02-TOBY → TOBY-05](toby.md#map-02-toby) |
| [MAP-03](../reference/fixplan-detail.md#map-03) | P1 / Partial | [MAP-03-TIER → TIER-02](tier.md#map-03-tier) | [MAP-03-SON → SON-04](son.md#map-03-son) | [MAP-03-TOBY → TOBY-02](toby.md#map-03-toby) |
| [OPS-01](../reference/fixplan-detail.md#ops-01) | P1 / Partial | [OPS-01-TIER → TIER-02](tier.md#ops-01-tier) | [OPS-01-SON → SON-04](son.md#ops-01-son) | [OPS-01-TOBY → TOBY-03](toby.md#ops-01-toby) |
| [REPORT-01](../reference/fixplan-detail.md#report-01) | P1 / Planned | [REPORT-01-TIER → TIER-04](tier.md#report-01-tier) | [REPORT-01-SON → SON-05](son.md#report-01-son) | - |
| [REPORT-02](../reference/fixplan-detail.md#report-02) | P1 / Planned | [REPORT-02-TIER → TIER-04](tier.md#report-02-tier) | [REPORT-02-SON → SON-05](son.md#report-02-son) | [REPORT-02-TOBY → TOBY-06](toby.md#report-02-toby) |
| [EVAL-01](../reference/fixplan-detail.md#eval-01) | P1 / Planned | [EVAL-01-TIER → TIER-06](tier.md#eval-01-tier) | [EVAL-01-SON → SON-05](son.md#eval-01-son) | [EVAL-01-TOBY → TOBY-06](toby.md#eval-01-toby) |
| [GEO-01](../reference/fixplan-detail.md#geo-01) | P0 / Planned | [GEO-01-TIER → TIER-05](tier.md#geo-01-tier) | [GEO-01-SON → SON-04](son.md#geo-01-son) | - |
| [GEO-02](../reference/fixplan-detail.md#geo-02) | P1 / Planned | [GEO-02-TIER → TIER-05](tier.md#geo-02-tier) | [GEO-02-SON → SON-04](son.md#geo-02-son) | - |
| [GEO-03](../reference/fixplan-detail.md#geo-03) | P1 / Planned | [GEO-03-TIER → TIER-02](tier.md#geo-03-tier) | [GEO-03-SON → SON-04](son.md#geo-03-son) | [GEO-03-TOBY → TOBY-05](toby.md#geo-03-toby) |
| [ENT-01](../reference/fixplan-detail.md#ent-01) | P2 / Planned | [ENT-01-TIER → TIER-05](tier.md#ent-01-tier) | [ENT-01-SON → SON-06](son.md#ent-01-son) | - |
| [ENT-02](../reference/fixplan-detail.md#ent-02) | P2 / Partial | [ENT-02-TIER → TIER-05](tier.md#ent-02-tier) | [ENT-02-SON → SON-06](son.md#ent-02-son) | [ENT-02-TOBY → TOBY-06](toby.md#ent-02-toby) |
| [ROAD-01](../reference/fixplan-detail.md#road-01) | P2 / Deferred | [ROAD-01-TIER](tier.md#road-01-tier) | [ROAD-01-SON](son.md#road-01-son) | [ROAD-01-TOBY](toby.md#road-01-toby) |
| [UI-01](../reference/fixplan-detail.md#ui-01) | P1 / Partial | [UI-01-TIER → TIER-06](tier.md#ui-01-tier) | [UI-01-SON → SON-06](son.md#ui-01-son) | - |
| [UI-02](../reference/fixplan-detail.md#ui-02) | P1 / Partial | [UI-02-TIER → TIER-06](tier.md#ui-02-tier) | [UI-02-SON → SON-06](son.md#ui-02-son) | - |
| [PRIV-01](../reference/fixplan-detail.md#priv-01) | P1 / Partial | [PRIV-01-TIER → TIER-06](tier.md#priv-01-tier) | [PRIV-01-SON → SON-01](son.md#priv-01-son) | [PRIV-01-TOBY → TOBY-06](toby.md#priv-01-toby) |
| [UX-01](../reference/fixplan-detail.md#ux-01) | P2 / Deferred | [UX-01-TIER](tier.md#ux-01-tier) | [UX-01-SON](son.md#ux-01-son) | [UX-01-TOBY](toby.md#ux-01-toby) |
| [LEG-01](../reference/fixplan-detail.md#leg-01) | P2 / Superseded | - | [LEG-01-SON](son.md#leg-01-son) | - |
| [LEG-02](../reference/fixplan-detail.md#leg-02) | P2 / Deferred | [LEG-02-TIER](tier.md#leg-02-tier) | [LEG-02-SON](son.md#leg-02-son) | - |

Historical H01-H22 findings and their resolutions remain in [reference section 3.1](../reference/fixplan-detail.md#31-original-22-findings-complete-traceability). Some earlier audit files and the external concept PDF are local-only/ignored; the archived text preserves the attributed observations, page references and limitations so teammates do not need those local files to understand their assignment. Never add secrets or the external PDF to solve a missing reference.

## Branch, dependency and completion workflow

- Keep identity and selected scope explicit. A legacy ID selects only its mapped portion. Use `codex/<member>/<package>` branches and focused PRs; several PRs may deliver one package.
- Inspect current code and reuse proven work. PR #2 is this checkout's baseline. Later branch-only work is recoverable history and needs review before reuse; do not assume reverted work is present.
- Complete independent owned work using existing responses or isolated fixtures; do not require all C01–C08 contracts before UI/science/service implementation.
- Record one handoff per actual missing interface: requesting package/portion, producer → consumer, exact example/change, dependent integration and evidence/status. Do not send external messages without authorization.
- Agreement is required before dependent live integration, not before every isolated delivery. Merge shared changes and dependent consumers in the needed order; independent PRs need not wait.
- Delivery statuses: planned, in progress, needs verification, complete. Integration statuses: not required for this portion, pending contract, pending runtime, needs verification, verified. Each completion cites its scoped automated/manual evidence.
- A frontend delivery may be complete while persistence/model/dispatch integration is explicitly pending. A narrow portion's completion does not complete its whole package automatically.
- Full parent acceptance needs every required active member portion and real integration checks. Son coordinates evidence without taking over another member's implementation or completion.
- Keep original priorities; a package takes its highest unresolved priority. Lower-priority grouped work need not delay a focused P0 PR. Deferred/superseded work requires separate prioritization.
- Do not stage, revert, reset or format unrelated work. Commit/push/merge/deployment require the authorized workflow.

## Release checks

| Gate | Required evidence / phase |
| --- | --- |
| A: trust and safety foundation | Real source/run provenance; validated land/coordinate checks; no production simulation; shared fail-closed safety including independent known warnings; verified contact/consent and privacy prerequisites. |
| B: pilot | Selected-day routine dispatch plus any-day critical alerts; structured zero-catch/assisted reporting and review; valid regional scope/ranking, data quality and permissions; honest accessible UI. Scoped commercial trials are distinct from paid SaaS. |
| C: enterprise | Verified entitlements/atomic locks; real safe spatial/forecast exports, supported device imports and applicable validated exclusions. |
| D: later roadmap | Independently evidenced satellite/fleet/institutional/optional map or fuel additions; no target represented as achieved result. |

Run appropriate focused checks in each owned area, then relevant integration/build checks when implementation warrants them. Detailed future scenarios remain in [reference section 7](../reference/fixplan-detail.md#7-future-acceptance-and-verification-scenarios). Validate provider outages, no-land, Manila dates, zero catch, any-day alerts, access denials and export locks jointly at release. No code tests are needed for this documentation split.

## Identity/scope walkthroughs

| Request or dependency | Agent behavior |
| --- | --- |
| Unknown identity asks to implement next work | Ask the exact identity question and wait, then establish a ready owned selection. |
| Tier selects TIER-04 without a report API | Finish owned form/state/fixture checks and PR frontend delivery; record SON-05 persistence integration separately. Never claim a real saved report. |
| Tier selects REG-01-TIER | Work only that TIER-01 portion. Missing new persistence creates a C03 handoff; independent form work can proceed. |
| Tier requests REG-01-SON | Do not implement without explicit recorded reassignment. Local adapter ownership does not grant backend authority. |
| Toby needs a migration or dependency | Request the exact Son-owned change; continue independent evaluation using available dependencies. |
| Son completes an API portion | Mark only Son's delivery and publish examples; request consumer acceptance rather than mark Tier/Toby complete. |
| User requests documentation reorganization | Edit agreed documents only; preserve application files, untracked work and generated Next.js instructions. |

## Preservation and authentication baseline

- Preserve branded login/register layout, artwork/mascot, onboarding/home-port flow, dashboard/navigation, accessibility fixes and pelagic/demersal/both semantics unless explicitly asked to change them. A package selection is not a redesign request.
- Agreed direction: [Son PR #11](https://github.com/Gianne818/Parola_PSC/pull/11), source-reviewed at 0642034ee537a0b9c883698bb652983d575bcfe8 on October 17, 2026. It was open/unmerged at inspection; this checkout remains PR #2 (c91a3f2). Do not claim it is installed, merged, deployed or runtime-verified here.
- In PR #11 demo mode, registration accepts any 1–6 digit code without OTP request/verification/provider calls. A successful real account save establishes the application's signed HttpOnly cookie, then navigates to onboarding. Later phone/password sign-in needs no OTP and proceeds to dashboard; logout expires the cookie and reload reads the server profile.
- Accounts persist in public.users, not a synthetic account selector or a Supabase Auth identity. Contact remains unverified and ineligible for live SMS. Do not manufacture Supabase sessions, grant live permissions or fake a successful save.
- PR #11 requires a functioning database and a server-only demo-session secret; missing configuration or failed writes must remain errors. Do not copy secrets into documents. Real browser/database behavior and hosted SMS configuration were not verified by source review.
- Before auth-related code changes, verify the accepted PR #11 head/current target and retain its behavior. This reorganization does not merge it, change configuration, perform migrations or resolve review findings.
- New fixtures live only in tests or explicit development previews. Never replace default login/onboarding/dashboard routes with a plain demo interface or silently convert working data services to sample data.
- Actual route acceptance must cover registration → demo code → onboarding → dashboard → sign-out → password sign-in → dashboard, refresh/account persistence and home-port/habitat retention. Mocked tests alone cannot certify this real journey.

## Historical evidence and package mapping

The 31-row matrix above maps every active original member assignment to its package. Old anchors remain available in member plans. Full checklists, criteria/evidence and logs remain in [Tier history](tier-history.md), [Son history](son-history.md) and [Toby history](toby-history.md). Current rules supersede archived execution restrictions. H01–H22 and concept-note references remain unchanged in the detailed proposal.

PR #2 contains Tier's frontend-independent batch and Toby's initial ocean-mask evaluation. These portions are preserved, not reassigned from scratch. Manual review, operational publication and missing integrations stay separate. This reorganization asserts no new implementation completion.
