# Toby's task plan

Owner: **Toby only**. Updated October 15, 2026. [Hub](../../fixplan.md) | [Shared rules, files and gates](shared.md) | [Full reference](../reference/fixplan-detail.md)

## Before coding

- Confirm identity from this chat; otherwise ask "Who are you working as: Tier, Son, or Toby?" and wait. Never infer it from a branch, username or last session.
- Work on one explicitly selected `-TOBY` assignment. For a general "continue", propose your next ready assignment and wait for selection. A specific matching assignment in the user's request already establishes the task.
- Only edit owned files listed below and their assigned tests; read other areas for context. Request the owning member's change when a shared dependency is missing. Never finish their portion yourself.
- C01-C08 are interface gates and D01-D10 are unresolved decisions in the shared rules. Pending prerequisites block dependent integration/live behavior; isolated evaluation/tests may proceed only where an assignment explicitly allows it.
- Parent statuses describe existing code, not completion. All boxes remain unchecked. Deferred/superseded items are not the next task without explicit separate prioritization.

## Allowed files

| File group | Allowed scope |
| --- | --- |
| INFERENCE | `backend/aws-inference/**` except dependency manifests (Son); inference tests; SAM inference schedule/config, not the separate critical dispatcher. |
| SCIENCE | `notebooks/**`, `backend/science/**`; the exact scientific `StarIsdaData/backend` files/tests listed in shared rules. No FastAPI registry/database changes. |
| HSI | `parola-api-service/hsi_calculator.py`, `parola-api-service/tests/test_hsi_calculator.py`; no changes to API/schema files importing them. |
| DOC | Your checklist/progress/handoff section here. Schema, dependencies and scientific wire contracts need Son's coordinated change. |

**First candidate:** DATA-01-TOBY, beginning with source/fixture evaluation. Publish no new predictions or mask to production before C01/D08 approval.

## Assignments

- [ ] <a id="safe-01-toby"></a>**SAFE-01-TOBY | P0 | Partial** - [Validate weather providers and backup.](../reference/fixplan-detail.md#safe-01)
  - **Files:** SCIENCE, INFERENCE. **Work:** Validate NOAA GFS/GFS-Wave, PAGASA and ECMWF backup adapters, units/coverage/issue-valid times; assess proposed ocean backups.
  - **Needs:** C02 shape; D03/D08 before operational publication. **Done when:** Source fixtures prove compatibility/freshness behavior; no heuristic/default-zero safety; licences/coverage limits recorded.

- [ ] <a id="safe-02-toby"></a>**SAFE-02-TOBY | P0 | Partial** - [Localize warnings and decouple them from inference.](../reference/fixplan-detail.md#safe-02)
  - **Files:** SCIENCE, INFERENCE. **Work:** Provide validated spatial sampling/warning applicability inputs rather than a Cebu/default or universal regional centroid.
  - **Needs:** C02, C06; D03. **Done when:** Fixture coverage includes Cebu/Bicol/Northern Mindanao and explicitly unknown locations.

- [ ] <a id="safe-03-toby"></a>**SAFE-03-TOBY | P0 | Partial** - [Share deterministic rules and preserve UNKNOWN.](../reference/fixplan-detail.md#safe-03)
  - **Files:** SCIENCE, INFERENCE. **Work:** Provide vessel-specific scientific rule validation/fixtures and consume the approved rule version in inference; do not choose operational thresholds alone.
  - **Needs:** C02; D03 jointly approved with Son. **Done when:** Boundary/unit/warning fixtures match approved semantics; no independent 3 m inference rule conflicts with operational decision.

- [ ] <a id="data-01-toby"></a>**DATA-01-TOBY | P0 | Planned** - [Apply a validated ocean mask.](../reference/fixplan-detail.md#data-01)
  - **Files:** SCIENCE, INFERENCE. **Work:** Validate coastline/mask resolution and land/ocean/coastal/island fixtures; apply generation exclusion and provide versioned source geometry.
  - **Needs:** Source evaluation may start now; C01/D08 before publication. **Done when:** Known land rejected, ocean controls retained; no unvalidated 1 km buffer or bounding-box-as-ocean assumption.

- [ ] <a id="data-02-toby"></a>**DATA-02-TOBY | P0 | Planned** - [Stop production simulation and record provenance.](../reference/fixplan-detail.md#data-02)
  - **Files:** SCIENCE, INFERENCE. **Work:** Fail affected production runs without random/dummy/heuristic replacement; emit reproducible source/model/input/run manifests.
  - **Needs:** C01 before publication; OPS-01 interface. **Done when:** Unavailable models/data create visible failures; preserve original last-good validity and isolate demos.

- [ ] <a id="data-03-toby"></a>**DATA-03-TOBY | P0 | Planned** - [Use real environmental features and calibrated scores.](../reference/fixplan-detail.md#data-03)
  - **Files:** SCIENCE, INFERENCE, HSI. **Work:** Source real CHL/physical/bathymetry/reef/bottom/biological features; compute 2D fronts and align training/inference; remove score floor.
  - **Needs:** DATA-02-Toby; C01; D08/D09; EVAL review before validation claims. **Done when:** Real inputs, spatial units and missingness verified; no universal 10-200 m/15 km substitute; calibrated scores need evidence.

- [ ] <a id="data-04-toby"></a>**DATA-04-TOBY | P1 | Planned** - [Integrate real historical VIIRS DBSCAN.](../reference/fixplan-detail.md#data-04)
  - **Files:** SCIENCE, INFERENCE. **Work:** Implement quality-filtered historical VIIRS DBSCAN with distance-aware metric/noise and held-out confidence evaluation.
  - **Needs:** DATA-02/03-Toby; C01; D08/D09. **Done when:** No rank buckets; parameters and confidence claims are validated against the correct historical proxy.

- [ ] <a id="map-02-toby"></a>**MAP-02-TOBY | P1 | Partial** - [Unify run validity, ranking and bounded payloads.](../reference/fixplan-detail.md#map-02)
  - **Files:** SCIENCE, HSI. **Work:** Validate score/threshold units and scientific implications of proposed ranking; supply review fixtures to Son.
  - **Needs:** C01, C06; D04. **Done when:** No arbitrary threshold lowering; supported models/scopes and calibration limits are documented.

- [ ] <a id="map-03-toby"></a>**MAP-03-TOBY | P1 | Partial** - [Correct species and environment presentation.](../reference/fixplan-detail.md#map-03)
  - **Files:** HSI, SCIENCE. **Work:** Validate species/HSI field semantics and missing-depth behavior for scientific modules; supply expected-score fixtures.
  - **Needs:** C01; DATA-03-Toby. **Done when:** HSI adjustment is not mislabeled verified species presence; correct input units/coverage are required.

- [ ] <a id="ops-01-toby"></a>**OPS-01-TOBY | P1 | Partial** - [Harden dates, ingestion and run visibility.](../reference/fixplan-detail.md#ops-01)
  - **Files:** INFERENCE, SCIENCE. **Work:** Remove duplicate loader/dead initialization; use Manila dates, actual source-cell envelopes, batch writes and visible failed runs in inference.
  - **Needs:** C01; coordinate migrations/dependencies with Son; D03/D08. **Done when:** Training/inference/ingest geometry and run IDs agree; no partial-success publication or hidden failure.

- [ ] <a id="report-02-toby"></a>**REPORT-02-TOBY | P1 | Planned** - [Review assisted reports before learning.](../reference/fixplan-detail.md#report-02)
  - **Files:** SCIENCE, INFERENCE. **Work:** Consume approved de-identified reviewed exports for reproducible evaluation/batch learning and model lineage/rollback.
  - **Needs:** C05, C08; Son reviewed export; D09. **Done when:** Zero catches remain usable; unreviewed data excluded; no automatic promotion on each report.

- [ ] <a id="eval-01-toby"></a>**EVAL-01-TOBY | P1 | Planned** - [Measure outcomes without overstating them.](../reference/fixplan-detail.md#eval-01)
  - **Files:** SCIENCE, INFERENCE. **Work:** Design separated pelagic/demersal time/spatial validation, BFAR comparisons, Pearson/precision/recall and fuel study protocol.
  - **Needs:** C05, C08; D09; reviewed inputs. **Done when:** Report sample size/exclusions/uncertainty and zero catches; no unsupported accuracy or savings claims.

- [ ] <a id="geo-03-toby"></a>**GEO-03-TOBY | P1 | Planned** - [Distribute recommendations across suitable grounds.](../reference/fixplan-detail.md#geo-03)
  - **Files:** SCIENCE. **Work:** Evaluate recommendation concentration/suitability thresholds and pilot effectiveness, distinct from actual fishing pressure.
  - **Needs:** C06; D04; EVAL protocol. **Done when:** Threshold recommendations state uncertainty; conservation/biomass outcomes are not inferred from counts.

- [ ] <a id="ent-02-toby"></a>**ENT-02-TOBY | P2 | Partial** - [Generate real verified Geo-Packs.](../reference/fixplan-detail.md#ent-02)
  - **Files:** SCIENCE, INFERENCE. **Work:** Supply validated horizon-specific forecast/thermal/depth datasets and limitations for export workers.
  - **Needs:** C01, C07; D08. **Done when:** 24-72h coverage is real and time-valid; today's points never stand in for unsupported future forecasts.

- [ ] <a id="road-01-toby"></a>**ROAD-01-TOBY | P2 | Deferred** - [Validate satellite, fleet and institutional capabilities.](../reference/fixplan-detail.md#road-01)
  - **Files:** SCIENCE, INFERENCE. **Work:** Later validate delta payload science and evidence behind institutional aggregates.
  - **Needs:** Deferred; C07/C08 and separate prioritization. **Done when:** No biomass/stock recovery/effort inferred from download logs alone.

- [ ] <a id="priv-01-toby"></a>**PRIV-01-TOBY | P1 | Partial** - [Separate identity, reports and delegated access.](../reference/fixplan-detail.md#priv-01)
  - **Files:** SCIENCE, INFERENCE. **Work:** Use only approved de-identified scientific datasets; preserve restricted lineage and controlled evaluation outputs.
  - **Needs:** C05, C08; D09; Son approved export. **Done when:** Training/evaluation artifacts expose no personal catch-location records; no raw institutional resale.

- [ ] <a id="ux-01-toby"></a>**UX-01-TOBY | P2 | Deferred** - [Preserve useful map/trip-planning additions.](../reference/fixplan-detail.md#ux-01)
  - **Files:** SCIENCE, INFERENCE. **Work:** Later validate cluster/contour/forecast spatial support and scientific estimation assumptions.
  - **Needs:** Deferred; C01/C06/C07 and separate prioritization. **Done when:** Hull support does not imply fish everywhere; genuine future data and uncertainty documented.

## Progress and handoffs

No assignment is completed and no handoff is outstanding at document creation. Keep this section short; update only your own records. Do not mark a parent feature complete from this checklist alone.

Handoff format: `from assignment | to member | requested file/contract change | acceptance/example | blocks | status`. Record requests here and summarize them in chat; this does not authorize sending external messages or changing the recipient's files. The recipient updates their own plan; Son updates shared integration decisions after coordination.

Completion report: assignment ID, owned files changed, focused checks/results, unmet prerequisites, and owner handoffs. Branch pattern: `codex/toby/<task>`. Create/use branches only when implementation is requested; this documentation update creates none.
