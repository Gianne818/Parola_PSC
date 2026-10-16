# Son's six work packages

Owner: **Son only**. Updated October 17, 2026. [Hub](../../fixplan.md) | [Shared rules](shared.md) | [Historical checklist/progress](son-history.md)

## Start here

- Use identity explicitly stated in this chat; otherwise ask **Who are you working as: Tier, Son, or Toby?** and wait.
- Select one package or requested portion. A legacy ID selects only its mapped portion. For general continue requests, propose a ready owned portion and establish selection before coding.
- Read current code first and reuse completed work. This checkout is PR #2 (c91a3f2); later branch-only work is historical/recoverable, not assumed present.
- Missing producer runtime does not block owned fixture-tested implementation. Record the exact integration need; never edit another owner to unblock yourself.
- Preserve branded screens, onboarding/navigation, habitats and the [PR #11 authentication baseline](shared.md#preservation-and-authentication-baseline). A task is not permission to redesign auth.
- Use `codex/son/<package>` branches and focused PRs. A package can span several PRs. No installs, paid services, real SMS or deployments without explicit authorization.

## Allowed files

**API:** app/api/** and parola-api-service/** except Toby's HSI files. **DB/AUTH/GEO:** owned lib/**, migrations, data and spatial helpers. **DISPATCH:** owned SMS/safety services and templates. **SHARED:** schemas, dependencies, configuration and integration documents. Exact exceptions in shared rules.

## Packages

All packages remain unchecked: reorganization is not implementation evidence. **Member delivery** and **integrated acceptance** are tracked separately. Original priorities, acceptance criteria and concept-note evidence remain binding in the references. Acceptance scenarios can use isolated fixtures for owned delivery; real account/database/provider/model behavior belongs to integrated acceptance. State what was actually checked. Each package includes its own accessibility where applicable; no package waits for TIER-06 common practices.

<a id="son-01"></a>
### SON-01: Accounts, profiles, consent and permissions

- [ ] **SON-01 | P0 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [REG-01-SON](son-history.md#reg-01-son), [REG-02-SON](son-history.md#reg-02-son), [PRIV-01-SON](son-history.md#priv-01-son).
- **Allowed files:** API, DB, AUTH, SHARED above, limited by the exact shared ownership map.
- **Work:** Preserve PR #11's agreed auth flow; complete canonical profile/preferences, ownership, consent and assistance boundaries.
- **Start / prerequisites:** Owned service tests with mocked DB/Auth now; verify accepted PR #11 head before auth edits. Do not edit Tier screens.
- **Acceptance:** Allowed edits persist/reload; day limits enforced; cross-account assistance denied; password-only demo login; demo cannot grant live SMS eligibility; failures honest.
- **Integration handoff:** TIER-01,06: C03/C08 examples and errors; actual browser/database readback tracked separately.

<a id="son-02"></a>
### SON-02: Advisory scheduling and SMS delivery

- [ ] **SON-02 | P0 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [SMS-01-SON](son-history.md#sms-01-son), [SMS-02-SON](son-history.md#sms-02-son), [SMS-03-SON](son-history.md#sms-03-son).
- **Allowed files:** API, DB, DISPATCH above, limited by the exact shared ownership map.
- **Work:** Implement selected-day durable jobs, independent critical routing, retries/deduplication, callbacks, delivery history, encoding costs and routine-only sponsor rules.
- **Start / prerequisites:** Deterministic recipient/event/safety fixtures now; real providers and recipients require separate authorization/evidence.
- **Acceptance:** Restart/duplicate-safe; off-schedule hazards alert; hazardous messages lack fishing coordinates; budgets never cap safety; Unicode/callback failures tested without provider calls.
- **Integration handoff:** SON-01,03,04 supply operational inputs; TIER-03 consumes C04. Missing runtime does not block isolated dispatch work.

<a id="son-03"></a>
### SON-03: Safety decisions and warning enforcement

- [ ] **SON-03 | P0 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [SAFE-01-SON](son-history.md#safe-01-son), [SAFE-02-SON](son-history.md#safe-02-son), [SAFE-03-SON](son-history.md#safe-03-son).
- **Allowed files:** API, DB, DISPATCH above, limited by the exact shared ownership map.
- **Work:** Persist shared vessel-specific decisions and warning applicability; enforce query/SMS/export suppression and independent valid warnings.
- **Start / prerequisites:** Decision plumbing with labelled fixtures now; actual thresholds/providers need Toby validation and agreed C02.
- **Acceptance:** UNKNOWN retained; approved unit/boundary cases pass; outages withhold guidance while valid warnings survive; endpoints cannot bypass suppression.
- **Integration handoff:** TOBY-04 validates inputs/rules; TIER-03 consumes reasons/times/quality (C02).

<a id="son-04"></a>
### SON-04: Prediction storage, queries and geographic eligibility

- [ ] **SON-04 | P0 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [DATA-01-SON](son-history.md#data-01-son), [DATA-02-SON](son-history.md#data-02-son), [DATA-03-SON](son-history.md#data-03-son), [DATA-04-SON](son-history.md#data-04-son), [MAP-01-SON](son-history.md#map-01-son), [MAP-02-SON](son-history.md#map-02-son), [MAP-03-SON](son-history.md#map-03-son), [OPS-01-SON](son-history.md#ops-01-son), [GEO-01-SON](son-history.md#geo-01-son), [GEO-02-SON](son-history.md#geo-02-son), [GEO-03-SON](son-history.md#geo-03-son).
- **Allowed files:** API, DB, GEO, SHARED above, limited by the exact shared ownership map.
- **Work:** Implement versioned atomic ingest/publication, numeric coordinates, coherent scoped runs, species/features, bounded ranking/paging, regional eligibility and reviewed exclusions.
- **Start / prerequisites:** Storage/query logic can use labelled synthetic batches; operational publication requires validated outputs and authoritative boundaries.
- **Acceptance:** Invalid/land targets rejected; no duplicate/mixed-run starvation; transaction failures visible; real zeros retained; legacy provenance not invented; no unreviewed destructive cleanup.
- **Integration handoff:** TOBY-01,02,03,05 provide validated batches; TIER-02,05 consume C01/C06. Legal/product boundary decisions explicit.

<a id="son-05"></a>
### SON-05: Catch reporting, review and evaluation access

- [ ] **SON-05 | P1 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [REPORT-01-SON](son-history.md#report-01-son), [REPORT-02-SON](son-history.md#report-02-son), [EVAL-01-SON](son-history.md#eval-01-son).
- **Allowed files:** API, DB, AUTH above, limited by the exact shared ownership map.
- **Work:** Persist duplicate-safe reports, review/corrections, assistant attribution and controlled de-identified exports. Keep ratings separate from catch records.
- **Start / prerequisites:** Reviewed example fixtures now; scientific units and retention agreement before operational use.
- **Acceptance:** Zero catch round-trip; invalid values denied; ownership/assistance enforced; unreviewed reports excluded from learning; catch-location access restricted.
- **Integration handoff:** TIER-04,06 / TOBY-06 consume C05/C08; publish examples without waiting for screens/models.

<a id="son-06"></a>
### SON-06: Enterprise entitlements, exports and capability contracts

- [ ] **SON-06 | P1 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [ENT-01-SON](son-history.md#ent-01-son), [ENT-02-SON](son-history.md#ent-02-son), [UI-01-SON](son-history.md#ui-01-son), [UI-02-SON](son-history.md#ui-02-son).
- **Allowed files:** API, DB, AUTH, SHARED above, limited by the exact shared ownership map.
- **Work:** Implement server vessel/plan/zone locks and export delivery; publish capability/error/language contracts for truthful UI without owning frontend copy.
- **Start / prerequisites:** Owned logic with isolated datasets now; activation, real forecast data and device compatibility gated separately.
- **Acceptance:** Access denied correctly; concurrent locks/quotas atomic; GPX/KML/GeoJSON genuinely generated/validated when supported; unknown horizons/devices unavailable; no payment activation.
- **Integration handoff:** TIER-05,06 / TOBY-06 consume/provide C07 and capability evidence; shared configuration remains Son-owned.

## Existing progress and next selection

- PR #11 was source-reviewed at 0642034ee537a0b9c883698bb652983d575bcfe8, open/unmerged at inspection; it is not installed in this PR #2 checkout. Preserve its agreed direction without claiming runtime readiness.
- Suggested next selection: verify the accepted SON-01 PR #11 baseline and remaining work, or independently test SON-02 scheduling. Do not reintroduce the reverted PR #3–7 journey.

## Legacy lookup and deferred work

Each original assignment maps once below. Historical labels do not establish current completion; full criteria/logs remain in the archive and [detailed proposal](../reference/fixplan-detail.md).

| Original assignment / anchor | Current package or disposition | Historical priority / status |
| --- | --- | --- |
| <a id="reg-01-son"></a>[REG-01-SON](son-history.md#reg-01-son) | [SON-01](#son-01) | P1 / Partial |
| <a id="reg-02-son"></a>[REG-02-SON](son-history.md#reg-02-son) | [SON-01](#son-01) | P0 / Partial |
| <a id="sms-01-son"></a>[SMS-01-SON](son-history.md#sms-01-son) | [SON-02](#son-02) | P1 / Partial |
| <a id="sms-02-son"></a>[SMS-02-SON](son-history.md#sms-02-son) | [SON-02](#son-02) | P0 / Partial |
| <a id="sms-03-son"></a>[SMS-03-SON](son-history.md#sms-03-son) | [SON-02](#son-02) | P1 / Partial |
| <a id="safe-01-son"></a>[SAFE-01-SON](son-history.md#safe-01-son) | [SON-03](#son-03) | P0 / Partial |
| <a id="safe-02-son"></a>[SAFE-02-SON](son-history.md#safe-02-son) | [SON-03](#son-03) | P0 / Partial |
| <a id="safe-03-son"></a>[SAFE-03-SON](son-history.md#safe-03-son) | [SON-03](#son-03) | P0 / Partial |
| <a id="data-01-son"></a>[DATA-01-SON](son-history.md#data-01-son) | [SON-04](#son-04) | P0 / Planned |
| <a id="data-02-son"></a>[DATA-02-SON](son-history.md#data-02-son) | [SON-04](#son-04) | P0 / Planned |
| <a id="data-03-son"></a>[DATA-03-SON](son-history.md#data-03-son) | [SON-04](#son-04) | P0 / Planned |
| <a id="data-04-son"></a>[DATA-04-SON](son-history.md#data-04-son) | [SON-04](#son-04) | P1 / Planned |
| <a id="map-01-son"></a>[MAP-01-SON](son-history.md#map-01-son) | [SON-04](#son-04) | P0 / Partial |
| <a id="map-02-son"></a>[MAP-02-SON](son-history.md#map-02-son) | [SON-04](#son-04) | P1 / Partial |
| <a id="map-03-son"></a>[MAP-03-SON](son-history.md#map-03-son) | [SON-04](#son-04) | P1 / Partial |
| <a id="ops-01-son"></a>[OPS-01-SON](son-history.md#ops-01-son) | [SON-04](#son-04) | P1 / Partial |
| <a id="report-01-son"></a>[REPORT-01-SON](son-history.md#report-01-son) | [SON-05](#son-05) | P1 / Planned |
| <a id="report-02-son"></a>[REPORT-02-SON](son-history.md#report-02-son) | [SON-05](#son-05) | P1 / Planned |
| <a id="eval-01-son"></a>[EVAL-01-SON](son-history.md#eval-01-son) | [SON-05](#son-05) | P1 / Planned |
| <a id="geo-01-son"></a>[GEO-01-SON](son-history.md#geo-01-son) | [SON-04](#son-04) | P0 / Planned |
| <a id="geo-02-son"></a>[GEO-02-SON](son-history.md#geo-02-son) | [SON-04](#son-04) | P1 / Planned |
| <a id="geo-03-son"></a>[GEO-03-SON](son-history.md#geo-03-son) | [SON-04](#son-04) | P1 / Planned |
| <a id="ent-01-son"></a>[ENT-01-SON](son-history.md#ent-01-son) | [SON-06](#son-06) | P2 / Planned |
| <a id="ent-02-son"></a>[ENT-02-SON](son-history.md#ent-02-son) | [SON-06](#son-06) | P2 / Partial |
| <a id="road-01-son"></a>[ROAD-01-SON](son-history.md#road-01-son) | Deferred; separate prioritization required | P2 / Deferred |
| <a id="ui-01-son"></a>[UI-01-SON](son-history.md#ui-01-son) | [SON-06](#son-06) | P1 / Partial |
| <a id="ui-02-son"></a>[UI-02-SON](son-history.md#ui-02-son) | [SON-06](#son-06) | P1 / Partial |
| <a id="priv-01-son"></a>[PRIV-01-SON](son-history.md#priv-01-son) | [SON-01](#son-01) | P1 / Partial |
| <a id="ux-01-son"></a>[UX-01-SON](son-history.md#ux-01-son) | Deferred; separate prioritization required | P2 / Deferred |
| <a id="leg-01-son"></a>[LEG-01-SON](son-history.md#leg-01-son) | Superseded; separate prioritization required | P2 / Superseded |
| <a id="leg-02-son"></a>[LEG-02-SON](son-history.md#leg-02-son) | Deferred; separate prioritization required | P2 / Deferred |

## Delivery log and integration handoffs

Log selected portions with package/legacy IDs, changed files, automated/manual evidence, remaining work and PR. Mark only proven-complete member delivery; integration may stay pending. Never mark another owner complete.

| From package / portion | Producer → consumer | Missing interface and example | Integration status / evidence |
| --- | --- | --- |
| None newly asserted by this documentation change | — | Carry forward relevant historical handoffs after checking current code; consolidate by actual interface. | Needs verification |

Historical requests remain preserved in the archive. Add each still-applicable interface here once with its producer/consumer and acceptance evidence. Do not copy blanket gates onto every package.
