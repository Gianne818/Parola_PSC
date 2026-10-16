# Tier's six work packages

Owner: **Tier only**. Updated October 17, 2026. [Hub](../../fixplan.md) | [Shared rules](shared.md) | [Historical checklist/progress](tier-history.md)

## Start here

- Use identity explicitly stated in this chat; otherwise ask **Who are you working as: Tier, Son, or Toby?** and wait.
- Select one package or requested portion. A legacy ID selects only its mapped portion. For general continue requests, propose a ready owned portion and establish selection before coding.
- Read current code first and reuse completed work. This checkout is PR #2 (c91a3f2); later branch-only work is historical/recoverable, not assumed present.
- Missing producer runtime does not block owned fixture-tested implementation. Record the exact integration need; never edit another owner to unblock yourself.
- Preserve branded screens, onboarding/navigation, habitats and the [PR #11 authentication baseline](shared.md#preservation-and-authentication-baseline). A task is not permission to redesign auth.
- Use `codex/tier/<package>` branches and focused PRs. A package can span several PRs. No installs, paid services, real SMS or deployments without explicit authorization.

## Allowed files

**UI:** app/** except app/api/**; components/**, hooks/**, context/**, public/** and UI tests.
**CLIENT:** owned services/utils, lib/frontend/**, dashboard/updates helpers and tests; exact exceptions in shared rules. Frontend-local models/types/adapters are Tier-owned. Shared API schemas, configuration and dependencies remain Son-owned.

## Packages

All packages remain unchecked: reorganization is not implementation evidence. **Member delivery** and **integrated acceptance** are tracked separately. Original priorities, acceptance criteria and concept-note evidence remain binding in the references. Acceptance scenarios can use isolated fixtures for owned delivery; real account/database/provider/model behavior belongs to integrated acceptance. State what was actually checked. Each package includes its own accessibility where applicable; no package waits for TIER-06 common practices.

<a id="tier-01"></a>
### TIER-01: Account, onboarding and settings

- [ ] **TIER-01 | P0 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [REG-01-TIER](tier-history.md#reg-01-tier), [REG-02-TIER](tier-history.md#reg-02-tier).
- **Allowed files:** UI, CLIENT above, limited by the exact shared ownership map.
- **Work:** Preserve branded registration/sign-in and the agreed demo OTP journey. Complete home-port, weekday/time, habitat, language and settings forms with honest draft/save/error states.
- **Start / prerequisites:** Existing UI/responses now; isolated editor work needs no new backend. C03 applies only to new persisted fields or changed authority.
- **Acceptance:** Registration → onboarding → dashboard; password-only later sign-in; logout/reload; approved weekday limits including sixth-day errors; port edits retain habitat/settings.
- **Integration handoff:** SON-01: canonical profile/preferences, authority, consent and persistence. Preserve PR #11, do not rebuild auth.

<a id="tier-02"></a>
### TIER-02: Dashboard, maps and prediction presentation

- [ ] **TIER-02 | P0 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [DATA-01-TIER](tier-history.md#data-01-tier), [DATA-02-TIER](tier-history.md#data-02-tier), [DATA-03-TIER](tier-history.md#data-03-tier), [DATA-04-TIER](tier-history.md#data-04-tier), [MAP-01-TIER](tier-history.md#map-01-tier), [MAP-02-TIER](tier-history.md#map-02-tier), [MAP-03-TIER](tier-history.md#map-03-tier), [OPS-01-TIER](tier-history.md#ops-01-tier), [GEO-03-TIER](tier-history.md#geo-03-tier).
- **Allowed files:** UI, CLIENT above, limited by the exact shared ownership map.
- **Work:** Complete map/dashboard controls, coordinate validation, habitat/species selection, dates, provenance, quality/coverage and loading/empty/error states. Unsupported fields stay unavailable.
- **Start / prerequisites:** Use current responses and frontend-local adapters now; fixtures cover missing states. Scientific validity and operational ranking stay external.
- **Acceptance:** Malformed targets rejected; pelagic/demersal/both retained; retrieval/generation/validity distinct; missing depth/features stay unknown; no fabricated replacement targets.
- **Integration handoff:** SON-04 / TOBY-01,02,03,05: validated runs, masking, features, ranking and distribution (C01/C06).

<a id="tier-03"></a>
### TIER-03: Safety, alerts and messaging status

- [ ] **TIER-03 | P0 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [SAFE-01-TIER](tier-history.md#safe-01-tier), [SAFE-02-TIER](tier-history.md#safe-02-tier), [SAFE-03-TIER](tier-history.md#safe-03-tier), [SMS-01-TIER](tier-history.md#sms-01-tier), [SMS-02-TIER](tier-history.md#sms-02-tier), [SMS-03-TIER](tier-history.md#sms-03-tier).
- **Allowed files:** UI, CLIENT above, limited by the exact shared ownership map.
- **Work:** Present warning sources/times, unavailable safety, routine versus any-day critical alerts, delivery stages and segment/cost explanations. Consume authoritative decisions.
- **Start / prerequisites:** Existing responses and isolated display fixtures now; live SMS is unnecessary for frontend completion. No invented safety thresholds.
- **Acceptance:** Hazard/unknown states suppress fishing guidance; valid official warnings survive weather outages; queued is not delivered; off-schedule alerts remain separate.
- **Integration handoff:** SON-02,03 / TOBY-04: safety/warning applicability, schedule, receipt/cost states (C02/C04).

<a id="tier-04"></a>
### TIER-04: Catch reporting and assisted-entry screens

- [ ] **TIER-04 | P1 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [REPORT-01-TIER](tier-history.md#report-01-tier), [REPORT-02-TIER](tier-history.md#report-02-tier).
- **Allowed files:** UI, CLIENT above, limited by the exact shared ownership map.
- **Work:** Build voluntary trip date, approximate area/optional GPS, species, weight including zero, effort, review/correction and allowed/denied assisted states.
- **Start / prerequisites:** Forms and fixture checks now; unresolved units/permissions stay pending. Connect real submission only through available agreed endpoints.
- **Acceptance:** Zero catch accepted; negative/invalid values rejected; GPS optional; failed submission preserves draft without saved claim; unauthorized helpers cannot act.
- **Integration handoff:** SON-05 / TOBY-06: persistence/review/assistance, units and reviewed-data eligibility (C05/C08).

<a id="tier-05"></a>
### TIER-05: Vessel, geographic-access and export screens

- [ ] **TIER-05 | P0 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [GEO-01-TIER](tier-history.md#geo-01-tier), [GEO-02-TIER](tier-history.md#geo-02-tier), [ENT-01-TIER](tier-history.md#ent-01-tier), [ENT-02-TIER](tier-history.md#ent-02-tier).
- **Allowed files:** UI, CLIENT above, limited by the exact shared ownership map.
- **Work:** Build vessel/plan/zone/access and export request/status views with denied, unavailable, quota and expiry states. Separate product restrictions from verified legal requirements.
- **Start / prerequisites:** Current capability responses and isolated future-state fixtures now; no payments, live unlocking or dataset invention.
- **Acceptance:** Unknown entitlement stays unavailable; quota/zone/expiry errors clear; no unsupported forecast/device claim; server authorization still required.
- **Integration handoff:** SON-04,06 / TOBY-06: scope, verified vessels, entitlements, locks, quotas and real artifacts (C06/C07).

<a id="tier-06"></a>
### TIER-06: Public information, accessibility, languages and privacy presentation

- [ ] **TIER-06 | P1 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [UI-01-TIER](tier-history.md#ui-01-tier), [UI-02-TIER](tier-history.md#ui-02-tier), [PRIV-01-TIER](tier-history.md#priv-01-tier), [EVAL-01-TIER](tier-history.md#eval-01-tier).
- **Allowed files:** UI, CLIENT above, limited by the exact shared ownership map.
- **Work:** Maintain truthful landing/pricing/guides, reusable accessible interactions, regional copy and privacy/evaluation presentation. Other packages own their screen-specific accessibility.
- **Start / prerequisites:** Existing behavior/copy can be reviewed now. Pilot language approval and measured outcomes remain separate evidence.
- **Acceptance:** Keyboard/focus/errors, mobile and 200% zoom checked; record speech/device/language manual checks; no unverified savings/accuracy/live claims or private catch locations.
- **Integration handoff:** SON-01,05,06 / TOBY-06: permissions, capabilities and de-identified measured outcomes (C08); terminology reviewers.

## Existing progress and next selection

- PR #2 contains independent truthful-copy, coordinate, fabrication-removal, provenance/safety-display and automated accessibility portions. Keep these; do not reassign them from scratch.
- Manual accessibility/translation acceptance and live integration were not established by isolated checks. Inspect remaining selected work before implementation.
- Later REG-01/REG-02/restoration batches are recoverable history, not assumed present here. Six pre-existing untracked restoration files remain untouched.
- Suggested next independent selection: remaining TIER-06 review or a missing TIER-04 form portion. TIER-01 does not authorize rebuilding authentication.

## Legacy lookup and deferred work

Each original assignment maps once below. Historical labels do not establish current completion; full criteria/logs remain in the archive and [detailed proposal](../reference/fixplan-detail.md).

| Original assignment / anchor | Current package or disposition | Historical priority / status |
| --- | --- | --- |
| <a id="reg-01-tier"></a>[REG-01-TIER](tier-history.md#reg-01-tier) | [TIER-01](#tier-01) | P1 / Partial |
| <a id="reg-02-tier"></a>[REG-02-TIER](tier-history.md#reg-02-tier) | [TIER-01](#tier-01) | P0 / Partial |
| <a id="sms-01-tier"></a>[SMS-01-TIER](tier-history.md#sms-01-tier) | [TIER-03](#tier-03) | P1 / Partial |
| <a id="sms-02-tier"></a>[SMS-02-TIER](tier-history.md#sms-02-tier) | [TIER-03](#tier-03) | P0 / Partial |
| <a id="sms-03-tier"></a>[SMS-03-TIER](tier-history.md#sms-03-tier) | [TIER-03](#tier-03) | P1 / Partial |
| <a id="safe-01-tier"></a>[SAFE-01-TIER](tier-history.md#safe-01-tier) | [TIER-03](#tier-03) | P0 / Partial |
| <a id="safe-02-tier"></a>[SAFE-02-TIER](tier-history.md#safe-02-tier) | [TIER-03](#tier-03) | P0 / Partial |
| <a id="safe-03-tier"></a>[SAFE-03-TIER](tier-history.md#safe-03-tier) | [TIER-03](#tier-03) | P0 / Partial |
| <a id="data-01-tier"></a>[DATA-01-TIER](tier-history.md#data-01-tier) | [TIER-02](#tier-02) | P0 / Planned |
| <a id="data-02-tier"></a>[DATA-02-TIER](tier-history.md#data-02-tier) | [TIER-02](#tier-02) | P0 / Planned |
| <a id="data-03-tier"></a>[DATA-03-TIER](tier-history.md#data-03-tier) | [TIER-02](#tier-02) | P0 / Planned |
| <a id="data-04-tier"></a>[DATA-04-TIER](tier-history.md#data-04-tier) | [TIER-02](#tier-02) | P1 / Planned |
| <a id="map-01-tier"></a>[MAP-01-TIER](tier-history.md#map-01-tier) | [TIER-02](#tier-02) | P0 / Partial |
| <a id="map-02-tier"></a>[MAP-02-TIER](tier-history.md#map-02-tier) | [TIER-02](#tier-02) | P1 / Partial |
| <a id="map-03-tier"></a>[MAP-03-TIER](tier-history.md#map-03-tier) | [TIER-02](#tier-02) | P1 / Partial |
| <a id="ops-01-tier"></a>[OPS-01-TIER](tier-history.md#ops-01-tier) | [TIER-02](#tier-02) | P1 / Partial |
| <a id="report-01-tier"></a>[REPORT-01-TIER](tier-history.md#report-01-tier) | [TIER-04](#tier-04) | P1 / Planned |
| <a id="report-02-tier"></a>[REPORT-02-TIER](tier-history.md#report-02-tier) | [TIER-04](#tier-04) | P1 / Planned |
| <a id="eval-01-tier"></a>[EVAL-01-TIER](tier-history.md#eval-01-tier) | [TIER-06](#tier-06) | P1 / Planned |
| <a id="geo-01-tier"></a>[GEO-01-TIER](tier-history.md#geo-01-tier) | [TIER-05](#tier-05) | P0 / Planned |
| <a id="geo-02-tier"></a>[GEO-02-TIER](tier-history.md#geo-02-tier) | [TIER-05](#tier-05) | P1 / Planned |
| <a id="geo-03-tier"></a>[GEO-03-TIER](tier-history.md#geo-03-tier) | [TIER-02](#tier-02) | P1 / Planned |
| <a id="ent-01-tier"></a>[ENT-01-TIER](tier-history.md#ent-01-tier) | [TIER-05](#tier-05) | P2 / Planned |
| <a id="ent-02-tier"></a>[ENT-02-TIER](tier-history.md#ent-02-tier) | [TIER-05](#tier-05) | P2 / Partial |
| <a id="road-01-tier"></a>[ROAD-01-TIER](tier-history.md#road-01-tier) | Deferred; separate prioritization required | P2 / Deferred |
| <a id="ui-01-tier"></a>[UI-01-TIER](tier-history.md#ui-01-tier) | [TIER-06](#tier-06) | P1 / Partial |
| <a id="ui-02-tier"></a>[UI-02-TIER](tier-history.md#ui-02-tier) | [TIER-06](#tier-06) | P1 / Partial |
| <a id="priv-01-tier"></a>[PRIV-01-TIER](tier-history.md#priv-01-tier) | [TIER-06](#tier-06) | P1 / Partial |
| <a id="ux-01-tier"></a>[UX-01-TIER](tier-history.md#ux-01-tier) | Deferred; separate prioritization required | P2 / Deferred |
| <a id="leg-02-tier"></a>[LEG-02-TIER](tier-history.md#leg-02-tier) | Deferred; separate prioritization required | P2 / Deferred |

## Delivery log and integration handoffs

Log selected portions with package/legacy IDs, changed files, automated/manual evidence, remaining work and PR. Mark only proven-complete member delivery; integration may stay pending. Never mark another owner complete.

| From package / portion | Producer → consumer | Missing interface and example | Integration status / evidence |
| --- | --- | --- |
| None newly asserted by this documentation change | — | Carry forward relevant historical handoffs after checking current code; consolidate by actual interface. | Needs verification |

Historical requests remain preserved in the archive. Add each still-applicable interface here once with its producer/consumer and acceptance evidence. Do not copy blanket gates onto every package.
