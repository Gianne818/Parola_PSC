# Toby's six work packages

Owner: **Toby only**. Updated October 17, 2026. [Hub](../../fixplan.md) | [Shared rules](shared.md) | [Historical checklist/progress](toby-history.md)

## Start here

- Use identity explicitly stated in this chat; otherwise ask **Who are you working as: Tier, Son, or Toby?** and wait.
- Select one package or requested portion. A legacy ID selects only its mapped portion. For general continue requests, propose a ready owned portion and establish selection before coding.
- Read current code first and reuse completed work. This checkout is PR #2 (c91a3f2); later branch-only work is historical/recoverable, not assumed present.
- Missing producer runtime does not block owned fixture-tested implementation. Record the exact integration need; never edit another owner to unblock yourself.
- Preserve branded screens, onboarding/navigation, habitats and the [PR #11 authentication baseline](shared.md#preservation-and-authentication-baseline). A task is not permission to redesign auth.
- Use `codex/toby/<package>` branches and focused PRs. A package can span several PRs. No installs, paid services, real SMS or deployments without explicit authorization.

## Allowed files

**SCIENCE/INFERENCE:** backend/science/**, backend/aws-inference/** excluding dependency manifests, notebooks/** and exact legacy scientific modules in shared rules. **HSI:** hsi_calculator.py and its test. No other API/schema/database/shared-config edits.

## Packages

All packages remain unchecked: reorganization is not implementation evidence. **Member delivery** and **integrated acceptance** are tracked separately. Original priorities, acceptance criteria and concept-note evidence remain binding in the references. Acceptance scenarios can use isolated fixtures for owned delivery; real account/database/provider/model behavior belongs to integrated acceptance. State what was actually checked. Each package includes its own accessibility where applicable; no package waits for TIER-06 common practices.

<a id="toby-01"></a>
### TOBY-01: Ocean masking and spatial validity

- [ ] **TOBY-01 | P0 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [DATA-01-TOBY](toby-history.md#data-01-toby).
- **Allowed files:** SCIENCE, INFERENCE above, limited by the exact shared ownership map.
- **Work:** Complete validated land/ocean/coastal/island controls, generation exclusion and source/version evidence.
- **Start / prerequisites:** PR #2 contains initial offline evaluation; inspect and extend rather than restart. Source evaluation needs no server integration.
- **Acceptance:** Known land rejected; ocean controls retained; mixed cells/boundaries/missing coverage explicit; no arbitrary coastal buffer as validated science.
- **Integration handoff:** SON-04 receives mask/source/coordinate examples (C01/D08); production storage/publication stays Son-owned.

<a id="toby-02"></a>
### TOBY-02: Environmental features, models and species scoring

- [ ] **TOBY-02 | P0 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [DATA-03-TOBY](toby-history.md#data-03-toby), [MAP-03-TOBY](toby-history.md#map-03-toby).
- **Allowed files:** SCIENCE, INFERENCE, HSI above, limited by the exact shared ownership map.
- **Work:** Use real environmental/reef/bottom inputs, 2D gradients and aligned training/inference; remove forced scores and unrelated species fallback.
- **Start / prerequisites:** Versioned local fixtures now. Request dependencies from Son; no installs or invented observations.
- **Acceptance:** Units/gradients/missingness and pelagic/demersal semantics verified; no random inputs or arbitrary universal depth; calibration needs evidence.
- **Integration handoff:** SON-04 receives units/fields/score limits; TIER-02 consumes supported values (C01).

<a id="toby-03"></a>
### TOBY-03: Run integrity, provenance and pipeline robustness

- [ ] **TOBY-03 | P0 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [DATA-02-TOBY](toby-history.md#data-02-toby), [OPS-01-TOBY](toby-history.md#ops-01-toby).
- **Allowed files:** SCIENCE, INFERENCE above, limited by the exact shared ownership map.
- **Work:** Remove production simulation fallback, redundant loaders and silent failures; emit source/model/run/input/validity manifests and actual source-cell geometry.
- **Start / prerequisites:** Local failure/manifest/batch tests independent of DB deployment; publication needs agreed ingest contract.
- **Acceptance:** Missing models/data fail affected runs; last-good validity retained; Manila dates/grid envelopes consistent; no partial-success publication.
- **Integration handoff:** SON-04 integrates manifests/batches and owned migrations (C01); TIER-02 displays provenance.

<a id="toby-04"></a>
### TOBY-04: Weather inputs and scientific safety validation

- [ ] **TOBY-04 | P0 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [SAFE-01-TOBY](toby-history.md#safe-01-toby), [SAFE-02-TOBY](toby-history.md#safe-02-toby), [SAFE-03-TOBY](toby-history.md#safe-03-toby).
- **Allowed files:** SCIENCE, INFERENCE above, limited by the exact shared ownership map.
- **Work:** Validate proposed NOAA GFS/GFS-Wave, PAGASA, ECMWF backup, spatial applicability and vessel-specific rule evidence.
- **Start / prerequisites:** Offline format/coverage/unit fixtures now; operational policy and enforcement stay Son-coordinated.
- **Acceptance:** Issue/validity/freshness/geography explicit; outages do not become zero/clear; backup compatibility/rule boundaries evidenced; no conflicting independent thresholds.
- **Integration handoff:** SON-03 receives validated inputs/rule fixtures (C02/D03/D08); TIER-03 consumes backend results.

<a id="toby-05"></a>
### TOBY-05: Historical clustering and recommendation evaluation

- [ ] **TOBY-05 | P1 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [DATA-04-TOBY](toby-history.md#data-04-toby), [MAP-02-TOBY](toby-history.md#map-02-toby), [GEO-03-TOBY](toby-history.md#geo-03-toby).
- **Allowed files:** SCIENCE, INFERENCE, HSI above, limited by the exact shared ownership map.
- **Work:** Implement historical VIIRS quality-filtered DBSCAN and evaluate ranking/concentration with honest proxy/distance/noise/calibration semantics.
- **Start / prerequisites:** Labelled historical fixtures now; no requirement to wait for operational counters/maps.
- **Acceptance:** No rank buckets as clusters; parameters/source traceable; detections not verified catches; ranking/count claims include uncertainty/held-out limits.
- **Integration handoff:** SON-04 receives clustering/scoring/ranking evidence (C01/C06); tests do not invent operational policy.

<a id="toby-06"></a>
### TOBY-06: Reviewed research data, evaluation and export datasets

- [ ] **TOBY-06 | P1 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [REPORT-02-TOBY](toby-history.md#report-02-toby), [EVAL-01-TOBY](toby-history.md#eval-01-toby), [PRIV-01-TOBY](toby-history.md#priv-01-toby), [ENT-02-TOBY](toby-history.md#ent-02-toby).
- **Allowed files:** SCIENCE, INFERENCE above, limited by the exact shared ownership map.
- **Work:** Build reviewed-data import, de-identification checks, batch learning/evaluation lineage and horizon-specific export datasets; report measured uncertainty/sample sizes.
- **Start / prerequisites:** Synthetic or approved de-identified fixtures now; real learning/evaluation requires reviewed permitted data.
- **Acceptance:** Zero catch retained; unreviewed/personal data excluded; time/spatial/habitat validation separated; no automatic promotion, fabricated forecasts or unverified savings.
- **Integration handoff:** SON-05,06 provide reviewed exports/access; outputs/limits through C05/C07/C08 for TIER-04,05,06.

## Existing progress and next selection

- PR #1 ocean-mask evaluation is included in PR #2. Preserve and extend its controls/evidence; production masking/publication is not established by evaluation.
- Suggested next independent selection: remaining TOBY-01 source/control review or TOBY-03 provenance/failure fixtures.

## Legacy lookup and deferred work

Each original assignment maps once below. Historical labels do not establish current completion; full criteria/logs remain in the archive and [detailed proposal](../reference/fixplan-detail.md).

| Original assignment / anchor | Current package or disposition | Historical priority / status |
| --- | --- | --- |
| <a id="safe-01-toby"></a>[SAFE-01-TOBY](toby-history.md#safe-01-toby) | [TOBY-04](#toby-04) | P0 / Partial |
| <a id="safe-02-toby"></a>[SAFE-02-TOBY](toby-history.md#safe-02-toby) | [TOBY-04](#toby-04) | P0 / Partial |
| <a id="safe-03-toby"></a>[SAFE-03-TOBY](toby-history.md#safe-03-toby) | [TOBY-04](#toby-04) | P0 / Partial |
| <a id="data-01-toby"></a>[DATA-01-TOBY](toby-history.md#data-01-toby) | [TOBY-01](#toby-01) | P0 / Planned |
| <a id="data-02-toby"></a>[DATA-02-TOBY](toby-history.md#data-02-toby) | [TOBY-03](#toby-03) | P0 / Planned |
| <a id="data-03-toby"></a>[DATA-03-TOBY](toby-history.md#data-03-toby) | [TOBY-02](#toby-02) | P0 / Planned |
| <a id="data-04-toby"></a>[DATA-04-TOBY](toby-history.md#data-04-toby) | [TOBY-05](#toby-05) | P1 / Planned |
| <a id="map-02-toby"></a>[MAP-02-TOBY](toby-history.md#map-02-toby) | [TOBY-05](#toby-05) | P1 / Partial |
| <a id="map-03-toby"></a>[MAP-03-TOBY](toby-history.md#map-03-toby) | [TOBY-02](#toby-02) | P1 / Partial |
| <a id="ops-01-toby"></a>[OPS-01-TOBY](toby-history.md#ops-01-toby) | [TOBY-03](#toby-03) | P1 / Partial |
| <a id="report-02-toby"></a>[REPORT-02-TOBY](toby-history.md#report-02-toby) | [TOBY-06](#toby-06) | P1 / Planned |
| <a id="eval-01-toby"></a>[EVAL-01-TOBY](toby-history.md#eval-01-toby) | [TOBY-06](#toby-06) | P1 / Planned |
| <a id="geo-03-toby"></a>[GEO-03-TOBY](toby-history.md#geo-03-toby) | [TOBY-05](#toby-05) | P1 / Planned |
| <a id="ent-02-toby"></a>[ENT-02-TOBY](toby-history.md#ent-02-toby) | [TOBY-06](#toby-06) | P2 / Partial |
| <a id="road-01-toby"></a>[ROAD-01-TOBY](toby-history.md#road-01-toby) | Deferred; separate prioritization required | P2 / Deferred |
| <a id="priv-01-toby"></a>[PRIV-01-TOBY](toby-history.md#priv-01-toby) | [TOBY-06](#toby-06) | P1 / Partial |
| <a id="ux-01-toby"></a>[UX-01-TOBY](toby-history.md#ux-01-toby) | Deferred; separate prioritization required | P2 / Deferred |

## Delivery log and integration handoffs

Log selected portions with package/legacy IDs, changed files, automated/manual evidence, remaining work and PR. Mark only proven-complete member delivery; integration may stay pending. Never mark another owner complete.

| From package / portion | Producer → consumer | Missing interface and example | Integration status / evidence |
| --- | --- | --- |
| None newly asserted by this documentation change | — | Carry forward relevant historical handoffs after checking current code; consolidate by actual interface. | Needs verification |

Historical requests remain preserved in the archive. Add each still-applicable interface here once with its producer/consumer and acceptance evidence. Do not copy blanket gates onto every package.
