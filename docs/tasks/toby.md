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
- **Work:** Use real environmental/reef/bottom inputs, 2D gradients and aligned training/inference; remove forced scores and unrelated species fallback. Persist and export Copernicus ocean current vectors (`uo`, `vo` velocity/heading) alongside SST and chlorophyll to identify up-current feeding zones. Differentiate spatial footprints: 9 km Copernicus ocean physics grid for Pelagic vs. 3 km localized reef structure footprint for Demersal.
- **Start / prerequisites:** Versioned local fixtures now. Request dependencies from Son; no installs or invented observations.
- **Acceptance:** Units/gradients/missingness and pelagic/demersal semantics verified; no random inputs or arbitrary universal depth; calibration needs evidence. Current vectors carry valid m/s units and degrees heading.
- **Integration handoff:** SON-04 receives units/fields/score limits plus current vector schema; TIER-02 consumes supported values and renders directional flow arrows (C01).

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

### Urgent task: minimum hotspot score of 50% — October 17, 2026

### Ocean current vectors (`uo`, `vo`), frontal sweet spots, and Demersal 3 km radius refinement — October 21, 2026

- **Demersal vs Pelagic footprint refinement:** Identified and corrected the model radius discrepancy: Pelagic retains the 9 km Copernicus ocean physics cell (`PREDICTION_RADIUS_KM = 9`), while Demersal is refined to a localized 3 km reef zone (`DEMERSAL_RADIUS_KM = 3`) matching the PostGIS `0.02°` bounding envelope (`run_daily_predictions.py#L362`), Allen Coral Atlas reef crests, and benthic home ranges. Visual integration delivered in `MapComponent.tsx` and `MapInner.tsx`.
- **Copernicus current vectors (`uo`, `vo`) and sweet-spot modeling:**
  In `backend/aws-inference/run_daily_predictions.py`, Copernicus `uo` and `vo` horizontal ocean current velocities are ingested and used for inference, but were omitted from the database write. Tasked Toby with:
  1) Persisting `uo` and `vo` (or computed current speed in m/s and current heading in degrees) into `public.daily_grid_predictions` when inserting hotspot rows.
  2) Handoff to Son to update database migration and API serialization in `app/api/advisories/nearest/route.ts`.
  3) Handoff to Tier to render an ocean current drift vector arrow on the selected hotspot circle showing the flow direction and up-current feeding side.

- **Latest user-requested daily pipeline deployment & 25% threshold slider (October 17, 2026):**
  Toby explicitly authorized integrating and deploying the updated Pelagic +
  Demersal daily hotspot prediction pipeline from
  `/Users/gianne/Development/Python/Parola/AWS_DEPLOYMENT_HANDOFF.md` and
  `/Users/gianne/Development/Python/Parola/run_daily_predictions.py` into
  `backend/aws-inference/` (including `backend/aws-inference/requirements.txt`)
  with a daily-prediction toggle (`ENABLE_DAILY_PREDICTIONS = True` in code and
  `PAROLA_ENABLE_DAILY_PREDICTIONS=true` in Lambda env vars, plus `{"enabled": false}`
  and `{"force": true}` event overrides), and subsequently lowering the stored
  and queryable hotspot floor to `0.25` (25%) while keeping the default UI
  threshold at `>= 50%` with a user-adjustable slider (`25%`–`95%`, step `5%`).
  Built and deployed the ARM64 container image (`sha256:2d1b93c6a016abcc6a125fd273ae11d4a18618c709bb5f1ad526ecfd82c90ccf`,
  tag `daily-pipeline-25pct-v3-5707923a35c5`) to `parola-ParolaInferenceFunction-OjglErBmhUc2`
  with `EphemeralStorage=2048 MB` and updated `ParolaDailyInferenceSchedule` to
  `cron(0 21 * * ? *)` (05:00 AM Philippine Time daily). Verified in AWS Lambda:
  1) `{"enabled": false, "date": "2026-10-17"}` returned HTTP 200 with
     `{"status": "skipped", "reason": "daily_predictions_disabled"}`;
  2) `{"date": "2026-10-17", "force": true}` synced `879` local peak hotspots
     (`768` pelagic + `111` demersal, including `243` hotspots in `25%–49%`
     alongside `636` at `>= 50%`) to Supabase `public.daily_grid_predictions`.
  Updated `lib/regional-predictions.ts`, `app/api/advisories/nearest/route.ts`,
  `lib/dashboard.ts`, `app/dashboard/page.tsx`, `components/dashboard/DashboardWorkspace.tsx`,
  `components/dashboard/dashboard-copy.ts`, `components/dashboard/dashboard.module.css`,
  `components/features/hotspots/MapComponent.tsx`, and `utils/speciesColors.ts`.
  6 focused daily-pipeline Python tests and 402 Vitest frontend/API tests pass.

- **Prior user-requested replacement:** The initial 11,007 inserted IDs were
  backed up, deleted and marked withdrawn in the AWS manifest. Toby explicitly
  selected a fresh run with historical corroboration. Fresh AWS scoring run
  `20261017T075119Z-bde19907d30a` was filtered using notebook cell 8's historical
  DBSCAN reference and 15 km proximity rule at the inclusive 50% score floor.
  Published 2,241 pelagic candidates (618 below 60%); all initial IDs remain
  absent, and all 2,232 older rows match their pre-withdrawal full-row hash.
  Central Visayas returns 51 uncapped candidates from the replacement run.
  Added `historical_hotspots.py` and focused tests; the publisher verifies
  historical selection/lineage and rejects withdrawn runs. 34 focused Python
  tests pass. Cordova's missing-input gap and future automation remain pending;
  no parent package is completed. See the
  [replacement report](../../backend/aws-inference/HISTORICAL_FILTERED_RUN_2026-10-17.md).

- **Scope:** Separate high-priority user request outside the backlog packages, on `codex/toby/hotspot-threshold-50`. Toby identified themselves and authorized the task as lead programmer; the task-specific UI/API/configuration and operational exceptions are recorded in [shared rules](shared.md#urgent-hotspot-threshold-exception--october-17-2026). No parent package is checked off.
- **Owned delivery: complete for the urgent threshold and real-input pelagic refresh.** Dashboard legend/color documentation starts at 50–69%; regional/national SQL uses >= 0.50. The default inference entrypoint now requires dated, hashed real inputs and preserves the trained model scores. Added the reproducible baseline/input producer, validated AWS scorer, source-only ARM64 image helper and transactional PostGIS publisher, with focused tests. Docker copies the scorer; the local SAM architecture now matches ARM64.
- **Integrated evidence: verified for October 17 pelagic results.** AWS executed run `20261016T184655Z-bb3d5095ad6e` over 39,328 complete real Copernicus input cells. Published 11,007 scores >= 50% to the existing Supabase table, including 3,951 below 60%; the same model/inputs yield 7,056 at >= 60%. Validated source-cell geometry and SRIDs; older September 25 groups (1,582 pelagic and 650 demersal) remain unchanged. Live local national/regional/species-filtered APIs returned rows from that exact run. Central Visayas returned 126 rows, including 9 below 60%, with October 17 dates and no cap.
- **Recovered science lineage:** The user directed inspection of `/Users/gianne/Development/Python/Parola`. Its original model matches the deployed bytes, and `copernicus.ipynb` records the feature definitions and 2015–2025 baseline. Reconstructed October's temperature climatology from all 341 October days on the original source grid and saved it in S3. Real daily analysis/forecast fields replace random input generation. The original missing NetCDF/training CSV was not fabricated or relabelled. Retained explicit model-calibration, reconstructed-baseline and coarse wet-mask limitations.
- **Configuration and deployment:** Direct AWS account verification and Copernicus authentication passed. Copernicus keys were updated on the existing Lambda using its revision ID while preserving other variables. Local credentials stay in ignored mode-0600 `.env.local`; no values entered tracked files or command output. Deployed only reviewed application source over the pinned ARM64 image, preserving runtime dependencies, role, URL auth and schedule. No repository dependency manifests, shared schema, authentication UI or SMS dispatch changed.
- **Checks:** 28 focused Python tests passed; 41 focused frontend/API tests, focused ESLint and TypeScript checks passed. Python compilation and `git diff --check` passed. Actual AWS invocation, atomic database publication, independent read-only database verification and three live local API paths were exercised. No browser journey or remote frontend deployment is claimed.
- **Remaining work:** Future-day real-input generation/publication still needs scheduling; the scorer fails visibly if a day's real inputs are absent. This refresh covers pelagic only; a fresh demersal inference needs its own supported inputs. Shared API run-provenance and automatic advisory/SMS integration remain separate. Broader TOBY/DATA/OPS/GEO parent acceptance remains unchecked.
- **Detailed files, artifact hashes, S3 keys and limits:** [Scientific run report](../../backend/aws-inference/REAL_INPUT_RUN.md). The earlier live Lambda was independently inspected and proven to generate 5,000 random rows with a strict > 0.5 filter and S3-only output; this run replaced that production entrypoint after source/model verification. Application changes remain uncommitted on the task branch.

Log selected portions with package/legacy IDs, changed files, automated/manual evidence, remaining work and PR. Mark only proven-complete member delivery; integration may stay pending. Never mark another owner complete.

| From package / portion | Producer → consumer | Missing interface and example | Integration status / evidence |
| --- | --- | --- |
| Urgent 50% refresh: future daily operation | Toby's real-input producer + Son's shared-runtime coordination → AWS scorer/publication job | Schedule generation and publication of `inputs/real-pelagic/YYYY-MM-DD/features.csv` plus its validated manifest, using the current provider runtime. The existing scorer requires this exact dated input and fails when missing. Coordinate any shared dependency changes; no such manifest changes were made in this task. | October 17 pelagic integration verified; subsequent-day automation remains unimplemented. See the run report for the concrete producer/consumer example. |
| TOBY-02: ocean current vectors and heading | Toby's inference publisher → Son's database migration and API serializer | Schema and insert payload containing `current_u DOUBLE PRECISION, current_v DOUBLE PRECISION` (or `current_speed_mps`, `current_heading_deg`) for each hotspot row in `public.daily_grid_predictions` and `/api/advisories/nearest`. | Pending Son coordination. |
| TOBY-02: current flow visualization | Toby/Son current vector data → Tier's map circle visualization | Flow heading angle (degrees) and speed (m/s) to draw a directional current drift arrow inside the selected 9 km / 3 km hotspot zone. | Pending upstream API handoff. |

Historical requests remain preserved in the archive. Add each still-applicable interface here once with its producer/consumer and acceptance evidence. Do not copy blanket gates onto every package.
