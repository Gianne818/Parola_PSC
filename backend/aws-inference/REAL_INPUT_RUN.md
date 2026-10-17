# Real-input pelagic refresh — October 17, 2026

**Publication status: withdrawn and superseded.** The user explicitly requested
removal of this report's initial 11,007 database rows, followed by a fresh run.
The current Supabase publication is the 2,241-row
[historical-filtered replacement](HISTORICAL_FILTERED_RUN_2026-10-17.md).
Counts below describe the original run's historical execution evidence.

The urgent 50% task completed a real-input AWS scoring run and published its
results to the existing Supabase prediction table. Other backlog packages remain
separate. This refresh covers the deployed **pelagic** model; it does not create
a fresh demersal forecast.

Later source comparison exactly reproduced the original 854-row daily CSV and
confirmed that neither its daily generator nor this refresh applies the separate
historical DBSCAN experiments. These are eligible grid scores; the illustrated
full hotspot/advisory architecture remains incomplete. See the
[original pipeline comparison](ORIGINAL_PIPELINE_COMPARISON_2026-10-17.md).

## Verified result

| Measure | Result |
| --- | --- |
| Prediction date, Asia/Manila | 2026-10-17 |
| Source daily analysis/forecast time | 2026-10-17 00:00 UTC |
| Complete real input cells | 39,328 |
| Scores >= 50% | 11,007 |
| Scores >= 60% on the same inputs/model | 7,056 |
| Additional cells at 50% through below 60% | 3,951 |
| Stored score range | 0.500022186391617–0.979103297259123 |
| Central Visayas API results | 126, including 9 below 60% |
| Invalid stored cell geometries/SRIDs | 0 |

These are uncalibrated environmental proxy model scores, not verified catches or
sailing clearance. Inputs for the target day come from Copernicus's daily
analysis/forecast products, rather than observed catches or random samples.

## Baseline reconstruction

The original file `env_features_filled_v3.nc` was unavailable. The user provided
the original science folder at `/Users/gianne/Development/Python/Parola`.
Its `copernicus.ipynb` records the source datasets, 2015–2025 historical period,
surface layer, study grid, spatial filling and derived feature definitions.
The local pelagic model exactly matches the deployed S3 model:

`39e0d48bcc179629464be0cdcbeb55ead845f92bace5a297ca55cfd4c2a55913`

`real_pelagic_inputs.py` reconstructed October's monthly temperature mean from
all **341 October days in 2015–2025**, using the original historical dataset
`cmems_mod_glo_phy_my_0.083deg_P1D-m`, version `202311`. Every retained baseline
cell has 341 daily samples. This reconstructs the notebook method using the
available pinned source version; byte-for-byte identity with the lost file
cannot be established.

The baseline hash is:

`c99623889af54706e81068abd13f8735f0c7880f4b8d21da50b868e0206d3318`

The saved S3 baseline is:

`baselines/pelagic/2015-2025/month-10-c99623889af54706e81068abd13f8735f0c7880f4b8d21da50b868e0206d3318.nc`

Daily temperature, currents and sea level use forecast version `202406`;
chlorophyll uses version `202311`. The study rectangle is 116–131°E, 2–23°N,
matching the notebook. It is not an authoritative marine jurisdiction boundary.
Source wet cells are identified before spatial filling; missing required inputs
or baseline values are excluded. Grid-index gradient units match the training
notebook. Source-cell bounds are computed from the actual grid coordinates.
No score scaling, fabricated clusters or replacement environmental values are
introduced.

## AWS execution and publication

- Function: `parola-ParolaInferenceFunction-OjglErBmhUc2`, `us-east-1`, ARM64.
- Model and artifact bucket: `parola-data-bucket-715991411553-us-east-1`.
- Input manifest: `inputs/real-pelagic/2026-10-17/manifest.json`.
- Input SHA256: `6887c09d55de920b633c02c4447d6281f57ab28381b6b4058adab0dca6e0b10f`.
- Run ID: `20261016T184655Z-bb3d5095ad6e`.
- Output manifest: `inference-runs/pelagic/2026-10-17/20261016T184655Z-bb3d5095ad6e/manifest.json`.
- Output SHA256: `d6a543e04e743023f5e1f751e1a1596b03efb8ebd29ae4cd96b175d05aa9f535`.
- New image digest: `sha256:8302f2f2c450c8d36d5bdeb8fe4af9c85bd79ad1f6612cab7fa1c866bcaf1884`.
- Prior image retained: `sha256:7e859a7497bd408013422a16eadcc6213220133dded90984f1b6977fed5ce064`.

The image update adds only the reviewed application source layer. Existing
runtime dependencies, ARM64 architecture, container command, role, URL auth and
deployed schedule were preserved. The public entrypoint now delegates to
`validated_csv_handler.py`. It requires a current Manila-day input manifest,
matching CSV/model hashes and the trained feature order. Missing inputs fail
instead of generating simulated replacements. The older local simulation is
not called by the production entrypoint.

`publish_verified_run.py` verified output lineage against the input cells and
published all rows in one Postgres transaction. PostGIS checks passed before
commit. Publication refuses to replace conflicting existing same-day work.
The previous September 25 pelagic/demersal rows remain unchanged. The run
manifest records the inserted prediction IDs and verified publication status.
No schema migration or SMS dispatch was performed.

## Checks and artifacts

- 28 focused Python tests passed: actual-input preparation, input integrity,
  threshold boundaries, model compatibility, source-only image construction,
  publication rollback and preservation of existing work.
- 41 focused frontend/API tests passed; focused ESLint and TypeScript checks passed.
- Live national, Central Visayas and Tamban-filtered API requests returned the
  verified AWS run's rows for October 17. Date checking used the actual frontend
  Manila-date parser, covering both the national timestamp response and regional
  calendar-date response.
- The Central Visayas API returned all 126 eligible rows without truncation,
  including scores down to 0.503558912434893. The selected-species response
  preserves the habitat score and its existing unavailable-HSI status.
- A separate read-only database check confirmed 11,007 current pelagic rows,
  3,951 below 60%, valid SRIDs/geometries, and preservation of both older groups.
- Browser interaction and a remote frontend deployment were not performed.

Local generated data and verification JSON are ignored under
`artifacts/2026-10-17/`. Private deployment receipts/model downloads are under
`/tmp/parola-hotspot-50/`. Credentials remain in ignored local configuration and
AWS environment settings; no credential values are stored in this report.

For reproducible input generation, use `real_pelagic_inputs.py` with the target
Manila date, a reusable artifact/cache directory and the verified model file.
The isolated operator runtime uses Copernicus Toolbox 2.5.0. The production
scorer retains its existing image dependencies. Shared dependency manifests were
not changed.

## Remaining integration

This is a verified **one-day pelagic refresh**. Future dates still need a
scheduled real-input producer and publication job. The deployed trigger remains
`ParolaDailyInferenceSchedule`, enabled at `cron(0 3 * * ? *)`; the local SAM
template's pre-existing six-hour schedule differs and was not deployed.
The scorer refuses missing future-day inputs. Do not interpret this run as proof
of automatic daily ingestion or publication.

Downstream consumers should use the verified run manifest and its output key.
The legacy `advisories/parola_daily_advisories.csv` is not this verified run's
output and was not overwritten. Automatic advisory/SMS integration and rich
run-provenance fields in the shared API remain coordinated work. The current
dashboard/API is verified against the existing running local Next.js server.
