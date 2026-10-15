# Tier's task plan

Owner: **Tier only**. Updated October 15, 2026. [Hub](../../fixplan.md) | [Shared rules, files and gates](shared.md) | [Full reference](../reference/fixplan-detail.md)

## Before coding

- Confirm identity from this chat; otherwise ask "Who are you working as: Tier, Son, or Toby?" and wait. Never infer it from a branch, username or last session.
- Work on one explicitly selected `-TIER` assignment. For a general "continue", propose your next ready assignment and wait for selection. A specific matching assignment in the user's request already establishes the task.
- Only edit owned files listed below and their assigned tests; read other areas for context. Request the owning member's change when a shared dependency is missing. Never finish their portion yourself.
- C01-C08 are interface gates and D01-D10 are unresolved decisions in the shared rules. Pending prerequisites block dependent integration/live behavior; isolated evaluation/tests may proceed only where an assignment explicitly allows it.
- Parent statuses describe existing code, not completion. All boxes remain unchecked. Deferred/superseded items are not the next task without explicit separate prioritization.

## Allowed files

| File group | Allowed scope |
| --- | --- |
| UI | `app/**` except `app/api/**`; `components/**`, `hooks/**`, `context/**`, `public/**`; colocated UI tests. |
| CLIENT | `services/**` except `iprogSmsService.ts`/`smsServiceInstance.ts`; `utils/**` except `spatial.ts`/`hotspotCalculator.ts`; `lib/dashboard.ts`, `lib/updates.ts`, their matching tests, `lib/frontend/**`, `tests/dashboardService.test.ts`, `tests/frontend/**`. |
| DOC | Your checklist/progress/handoff section in this file. Shared types/config/schema/hub/instructions belong to Son; request changes. |

**First candidate:** UI-01-TIER, limited to correcting misleading public/demo copy using existing behavior. Do not claim selected-day scheduling or real exports already work.

## Assignments

- [ ] <a id="reg-01-tier"></a>**REG-01-TIER | P1 | Partial** - [Persist selected-day preferences.](../reference/fixplan-detail.md#reg-01)
  - **Files:** UI, CLIENT. **Work:** Build weekday/time/habitat/ranking settings and saved schedule; preserve port editing and explain any-day safety alerts.
  - **Needs:** C03; Son profile fields. **Done when:** Five-day/duplicate validation and reload/edit flows agree with persisted values; no guessed enrollment.

- [ ] <a id="reg-02-tier"></a>**REG-02-TIER | P0 | Partial** - [Verify contacts, consent and assisted authority.](../reference/fixplan-detail.md#reg-02)
  - **Files:** UI, CLIENT. **Work:** Replace false verification/licence impressions with honest contact/consent and authorized-assistance flows.
  - **Needs:** C03; Son verification/role outcomes. **Done when:** Demo code never appears to establish live ownership; optional municipal IDs stay optional; denied assistance is clear.

- [ ] <a id="sms-01-tier"></a>**SMS-01-TIER | P1 | Partial** - [Schedule routine advisories durably.](../reference/fixplan-detail.md#sms-01)
  - **Files:** UI, CLIENT. **Work:** Show next selected routine day and last attempt; distinguish preview, acceptance and delivery.
  - **Needs:** C03, C04; Son schedule/status APIs. **Done when:** Non-selected days are explained accurately; receiving SMS requires no portal login.

- [ ] <a id="sms-02-tier"></a>**SMS-02-TIER | P0 | Partial** - [Route critical events independently and track delivery.](../reference/fixplan-detail.md#sms-02)
  - **Files:** UI, CLIENT. **Work:** Display any-day critical events and truthful queued/submitted/delivered/failed/unknown history.
  - **Needs:** C04; Son critical event/status feed. **Done when:** Gateway acceptance is never receipt; non-selected-day alerts remain visible.

- [ ] <a id="sms-03-tier"></a>**SMS-03-TIER | P1 | Partial** - [Govern segments, sponsorship and costs.](../reference/fixplan-detail.md#sms-03)
  - **Files:** UI, CLIENT. **Work:** Expose separate sponsor consent and maintain ad-free critical/enterprise presentation; qualify provider rates.
  - **Needs:** C03, C04. **Done when:** No UI implies guaranteed delivery or contracted rates; consent states are explicit.

- [ ] <a id="safe-01-tier"></a>**SAFE-01-TIER | P0 | Partial** - [Validate weather providers and backup.](../reference/fixplan-detail.md#safe-01)
  - **Files:** UI, CLIENT. **Work:** Show actual provider, validity and unavailable/backup state; remove operational synthetic weather.
  - **Needs:** C02. **Done when:** Open-Meteo is not relabeled NOAA; missing readings never look like zero/safe.

- [ ] <a id="safe-02-tier"></a>**SAFE-02-TIER | P0 | Partial** - [Localize warnings and decouple them from inference.](../reference/fixplan-detail.md#safe-02)
  - **Files:** UI, CLIENT. **Work:** Show checked geography, applicable warning and incomplete coverage without treating absent holds as clearance.
  - **Needs:** C02; Son coverage feed. **Done when:** Cebu readings cannot appear as evidence for another region.

- [ ] <a id="safe-03-tier"></a>**SAFE-03-TIER | P0 | Partial** - [Share deterministic rules and preserve UNKNOWN.](../reference/fixplan-detail.md#safe-03)
  - **Files:** UI, CLIENT. **Work:** Consume authoritative hold/unknown/reason/rule-version states; suppress actionable UI targets instead of only recoloring banners.
  - **Needs:** C02; Son operational decision. **Done when:** Portal status and actionable controls agree with server; missing inputs never display NORMAL.

- [ ] <a id="data-01-tier"></a>**DATA-01-TIER | P0 | Planned** - [Apply a validated ocean mask.](../reference/fixplan-detail.md#data-01)
  - **Files:** UI, CLIENT. **Work:** Omit server-rejected land/invalid targets and keep honest empty states.
  - **Needs:** C01; Son ocean-filtered responses. **Done when:** No fallback land/sample markers; home-port selection remains valid on shore.

- [ ] <a id="data-02-tier"></a>**DATA-02-TIER | P0 | Planned** - [Stop production simulation and record provenance.](../reference/fixplan-detail.md#data-02)
  - **Files:** UI, CLIENT. **Work:** Display observation, prediction validity, generation/fetch times and genuine demo/stale/unavailable distinctions.
  - **Needs:** C01. **Done when:** Old or unverified data never gains a live label or current date from UI fetch time.

- [ ] <a id="data-03-tier"></a>**DATA-03-TIER | P0 | Planned** - [Use real environmental features and calibrated scores.](../reference/fixplan-detail.md#data-03)
  - **Files:** UI, CLIENT. **Work:** Display actual depth/habitat/species support and surface/bottom meanings; unknown is not a measured zero.
  - **Needs:** C01; Son supported feature metadata. **Done when:** No fixed or fabricated depth/species measurement reaches the operational UI.

- [ ] <a id="data-04-tier"></a>**DATA-04-TIER | P1 | Planned** - [Integrate real historical VIIRS DBSCAN.](../reference/fixplan-detail.md#data-04)
  - **Files:** UI, CLIENT. **Work:** Explain historical nighttime vessel activity as supporting evidence with age/coverage, never catch/species ground truth.
  - **Needs:** C01 cluster metadata. **Done when:** Descriptions remain accurate for clustered, noise and no-history areas.

- [ ] <a id="map-01-tier"></a>**MAP-01-TIER | P0 | Partial** - [Normalize coordinates and remove legacy bypasses.](../reference/fixplan-detail.md#map-01)
  - **Files:** UI, CLIENT. **Work:** Unify sanitized map/context/service feeds, reject invalid geometry/coordinates and remove live-failure sample fallbacks.
  - **Needs:** C01; Son numeric coordinate feed. **Done when:** No (0,0)/swapped/malformed targets; legacy direct path cannot bypass server filtering.

- [ ] <a id="map-02-tier"></a>**MAP-02-TIER | P1 | Partial** - [Unify run validity, ranking and bounded payloads.](../reference/fixplan-detail.md#map-02)
  - **Files:** UI, CLIENT. **Work:** Preserve regional dedup/dates/counts; add approved ranking and bounded load-more/empty states.
  - **Needs:** C01, C06; Son selection results. **Done when:** UI reflects correct mode, eligibility, caps and unavailable region without inventing extra coverage.

- [ ] <a id="map-03-tier"></a>**MAP-03-TIER | P1 | Partial** - [Correct species and environment presentation.](../reference/fixplan-detail.md#map-03)
  - **Files:** UI, CLIENT. **Work:** Remove index-based species, prepended selected-species claims, fixed depth and hashed storm/wind/waves.
  - **Needs:** C01, C02; Son supported species contract. **Done when:** Unsupported species is explicit; habitat/HSI/model output remain distinct.

- [ ] <a id="ops-01-tier"></a>**OPS-01-TIER | P1 | Partial** - [Harden dates, ingestion and run visibility.](../reference/fixplan-detail.md#ops-01)
  - **Files:** UI, CLIENT. **Work:** Show run health/coverage/failure notices from server without secrets or successful-looking samples.
  - **Needs:** C01. **Done when:** Refresh time never replaces prediction age; failed runs and missing coverage are understandable.

- [ ] <a id="report-01-tier"></a>**REPORT-01-TIER | P1 | Planned** - [Add structured voluntary trip reports.](../reference/fixplan-detail.md#report-01)
  - **Files:** UI, CLIENT. **Work:** Build voluntary trip form/history including zero catch, approximate area, optional GPS, species/weight/effort and recoverable errors.
  - **Needs:** C03, C05; D09. **Done when:** Zero/no-GPS reports work; failed save is not success and internet-reporting need is clear.

- [ ] <a id="report-02-tier"></a>**REPORT-02-TIER | P1 | Planned** - [Review assisted reports before learning.](../reference/fixplan-detail.md#report-02)
  - **Files:** UI, CLIENT. **Work:** Add scoped acting-for/review status and correction flows; keep feedback optional for advisory reception.
  - **Needs:** C03, C05; Son role/report states. **Done when:** Helpers cannot choose unrelated fishers; pending/flagged/reviewed outcomes are distinct.

- [ ] <a id="eval-01-tier"></a>**EVAL-01-TIER | P1 | Planned** - [Measure outcomes without overstating them.](../reference/fixplan-detail.md#eval-01)
  - **Files:** UI, CLIENT. **Work:** Present scores versus validated metrics, uncertainty/sample size and targets versus actual adoption/fuel results.
  - **Needs:** C08; approved findings. **Done when:** 76% anecdote is not accuracy; search fuel, total fuel, suppression and delivery stay separate.

- [ ] <a id="geo-01-tier"></a>**GEO-01-TIER | P0 | Planned** - [Enforce proposed permitted areas server-side.](../reference/fixplan-detail.md#geo-01)
  - **Files:** UI, CLIENT. **Work:** Show permitted municipal/commercial scope and denial/coverage limitations without treating admin polygons as marine law.
  - **Needs:** C03, C06, C07. **Done when:** Client region/plan controls cannot imply they grant permission or certify legal clearance.

- [ ] <a id="geo-02-tier"></a>**GEO-02-TIER | P1 | Planned** - [Stage authoritative conservation exclusions.](../reference/fixplan-detail.md#geo-02)
  - **Files:** UI, CLIENT. **Work:** Add initial official-verification reminders and clearly qualified validated restriction overlays.
  - **Needs:** C06; Son dataset coverage. **Done when:** No full-compliance claim before authoritative coverage; unavailable is not unrestricted.

- [ ] <a id="geo-03-tier"></a>**GEO-03-TIER | P1 | Planned** - [Distribute recommendations across suitable grounds.](../reference/fixplan-detail.md#geo-03)
  - **Files:** UI, CLIENT. **Work:** Explain next-best alternatives/no suitable target without claiming measured fishing pressure.
  - **Needs:** C06; Son selection reasons. **Done when:** Rotation cannot hide unsafe/out-of-scope fallback or claim biomass/actual vessel activity.

- [ ] <a id="ent-01-tier"></a>**ENT-01-TIER | P2 | Planned** - [Verify vessels and persist entitlements/zone locks.](../reference/fixplan-detail.md#ent-01)
  - **Files:** UI, CLIENT. **Work:** Build verified vessel/operator/plan/scope/zone/expiry presentation; keep Standard free and incomplete purchases honest.
  - **Needs:** C03, C07; Son verification/entitlements. **Done when:** No client local quota/GT is presented as verified; no fake active subscription.

- [ ] <a id="ent-02-tier"></a>**ENT-02-TIER | P2 | Partial** - [Generate real verified Geo-Packs.](../reference/fixplan-detail.md#ent-02)
  - **Files:** UI, CLIENT. **Work:** Replace sample export UI with actual zone/horizon/format/validity and unsupported states, retaining explicit demos until ready.
  - **Needs:** C01, C02, C07; Son export contract. **Done when:** No static coordinates or unsupported future horizon appears as real forecast; actual reset comes from server.

- [ ] <a id="road-01-tier"></a>**ROAD-01-TIER | P2 | Deferred** - [Validate satellite, fleet and institutional capabilities.](../reference/fixplan-detail.md#road-01)
  - **Files:** UI, CLIENT. **Work:** Keep satellite/fleet/institutional experiences planned until separately validated.
  - **Needs:** Deferred; C07/C08 and separate prioritization. **Done when:** No simulated readiness, tracking or contracted revenue claims.

- [ ] <a id="ui-01-tier"></a>**UI-01-TIER | P1 | Partial** - [Align all public and signed-in journeys.](../reference/fixplan-detail.md#ui-01)
  - **Files:** UI, CLIENT. **Work:** Correct landing/pricing/guide/resources/onboarding/dashboard/report/export claims and outbound-only examples; preserve truthful current states.
  - **Needs:** Claims-only correction can start now; feature wiring waits on C01-C08 as relevant. **Done when:** No required inbound commands/1-2-3 replies, unconditional daily promise or unsupported live/accuracy/device/savings claim.

- [ ] <a id="ui-02-tier"></a>**UI-02-TIER | P1 | Partial** - [Extend accessible regional-language flows.](../reference/fixplan-detail.md#ui-02)
  - **Files:** UI, CLIENT. **Work:** Extend reviewed regional-language, keyboard/screen-reader/mobile, slow-network and recoverable-input flows.
  - **Needs:** C03-C05; D10 with pilot translation review. **Done when:** Clear labels/focus/non-color states; Bicolano pending coverage qualified; no duplicate retry or unsaved-draft success.

- [ ] <a id="priv-01-tier"></a>**PRIV-01-TIER | P1 | Partial** - [Separate identity, reports and delegated access.](../reference/fixplan-detail.md#priv-01)
  - **Files:** UI, CLIENT. **Work:** Explain optional reports, consent, approximate location, assisted roles and reviewed retention honestly.
  - **Needs:** C03, C05, C08; D02/D09. **Done when:** No precise GPS/feedback condition for free SMS; roles and purposes remain understandable.

- [ ] <a id="ux-01-tier"></a>**UX-01-TIER | P2 | Deferred** - [Preserve useful map/trip-planning additions.](../reference/fixplan-detail.md#ux-01)
  - **Files:** UI, CLIENT. **Work:** Later evaluate clearer zones/contours and qualified travel/fuel/forecast controls.
  - **Needs:** Deferred; C01/C06/C07 and separate prioritization. **Done when:** Visible source/uncertainty; estimates are not navigational clearance or measured savings.

- [ ] <a id="leg-02-tier"></a>**LEG-02-TIER | P2 | Deferred** - [Cooperative fuel pooling.](../reference/fixplan-detail.md#leg-02)
  - **Files:** UI, CLIENT. **Work:** Keep fuel-pooling UI outside core pilot; only later replace local samples if separately prioritized.
  - **Needs:** Deferred; separate fuel product authorization and Son contracts. **Done when:** No verified discount/payment/supply claim from local state; no fuel coding now.

## Progress and handoffs

No assignment is completed and no handoff is outstanding at document creation. Keep this section short; update only your own records. Do not mark a parent feature complete from this checklist alone.

Handoff format: `from assignment | to member | requested file/contract change | acceptance/example | blocks | status`. Record requests here and summarize them in chat; this does not authorize sending external messages or changing the recipient's files. The recipient updates their own plan; Son updates shared integration decisions after coordination.

Completion report: assignment ID, owned files changed, focused checks/results, unmet prerequisites, and owner handoffs. Branch pattern: `codex/tier/<task>`. Create/use branches only when implementation is requested; this documentation update creates none.
