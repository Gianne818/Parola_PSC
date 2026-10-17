# Fresh historical-filtered pelagic run — October 17, 2026

**Current publication:** 2,241 October 17 pelagic candidates in Supabase. The
initial 11,007-row publication was withdrawn at the user's explicit request.
All its recorded IDs are absent; older prediction rows are unchanged.

## Result

| Measure | Verified result |
| --- | --- |
| Current-day complete environmental inputs | 39,328 |
| Fresh AWS score candidates at >= 50% | 11,007 |
| Kept after historical proximity filter | 2,241 |
| Kept scores >= 50% and < 60% | 618 |
| Published score range | 0.500218179953753–0.979103297259123 |
| Historical reference clusters | 1,381 |
| Central Visayas API candidates | 51, uncapped |
| Withdrawn IDs remaining in Supabase | 0 |
| Invalid stored source-cell geometry/SRID | 0 |

AWS scoring run: `20261017T075119Z-bde19907d30a`.
Published filtered run: `20261017T075119Z-bde19907d30a-history`.

## Method and lineage

The user selected a fresh run after requesting deletion of this session's first
publication. A new invocation of the existing verified AWS scorer used the
dated October 17 environmental input snapshot and model already stored in S3.
The October baseline and same-day inputs were reused; this was not a new
Copernicus download or a relabelling of July's saved data.

Historical processing reconstructs the **filtering variant in zero-based cell 8
of `pelagic_model.ipynb`** from the original science directory. It uses the
surviving 765,441-row positive-presence Parquet, sampled to 100,000 rows with
seed 42. Haversine DBSCAN uses eps 0.001 radians and min_samples 15. The
reconstructed cluster count matches the notebook's saved 1,381 count. The lost
merged historical feature CSV and original intermediate sample were not recovered,
so byte-for-byte historical reconstruction is not claimed.

The notebook's 15 km maximum distance from a historical cluster mean is applied
to today's scored candidates, with the requested inclusive 50% score floor.
The later min_samples-100 notebook variant, which flags rather than filters,
was not silently mixed into this method. DBSCAN parameters use
[scikit-learn's documented semantics](https://scikit-learn.org/stable/modules/generated/sklearn.cluster.DBSCAN.html).

Historical reference construction and proximity postprocessing ran locally
using existing runtimes. Their hashed artifacts and final output were uploaded
to S3. Database publication independently recomputed selection from the hashed
fresh AWS output and historical reference before inserting all rows in one
transaction. Prediction coordinates, environmental values and source-cell
bounds remain those of the scored grid; ranking is recomputed after filtering.

`dbscan_cluster_id` stays -1 because today's grid points were not themselves
clustered. The full output CSV records the actual nearest
`historical_cluster_id`, `km_to_nearest_hotspot` and `is_historical_hotspot`.
Those additional annotations do not require changing the shared database schema.

## Artifacts

Bucket: `parola-data-bucket-715991411553-us-east-1`.

- Published output prefix:
  `inference-runs/pelagic/2026-10-17/20261017T075119Z-bde19907d30a-history/`.
- Output SHA256:
  `ac00662208fbd4666ace458c4e6cf0a225e4c9c9c1e9399552c045525ba2fa0d`.
- Historical reference prefix:
  `historical-hotspots/pelagic/2015-2025/notebook-cell-8/26216ab355d7c99e3575c38ff6bad35f9c232321b6a7b2725020cb76c7cdba5f/`.
- Reference manifest SHA256:
  `941b04dbe70b4140fd9910f9dc4145128d4ed2fddda0dc6f1e84c3e1f87dbea7`.
- Input/model hashes and baseline lineage are unchanged from the
  [initial scoring report](REAL_INPUT_RUN.md).

Ignored local evidence is under `artifacts/2026-10-17/history-filtered-refresh/`:
`published-filtered-run.json`, `independent-verification.json`,
`predictions-with-historical-support.csv` and the original six-column-format
`parola_daily_advisories_2026-10-17.csv`.

The withdrawn run's complete 11,007 database rows, including original IDs,
timestamps and EWKB source geometries, were backed up before deletion in
`artifacts/2026-10-17/withdrawn-run-20261016T184655Z-bb3d5095ad6e-backup.json`
(mode 0600). Backup SHA256:
`7891a8fde29e1c9a6a92533795bbd68079a940c856021b166b9eb151164309d3`.
The withdrawal receipt and original AWS manifest record its withdrawn status.
There were no dependent advisories. Other prediction rows were checked by a
full-row hash before/after withdrawal and after replacement publication.

## Checks and limits

- 34 focused Python tests pass, including distance selection, unchanged source
  coordinates/scores, hash/provenance checks, withdrawn-run rejection and
  database commit/rollback behavior.
- Independent database checks confirm 2,241 replacement rows, zero withdrawn
  IDs, valid source-cell geometry, and preservation of all 2,232 older rows.
- Live national and Central Visayas APIs return IDs from the replacement run
  with the correct Manila prediction date. The national endpoint returns its
  existing maximum of 1,000; Central Visayas returns all 51 without truncation.
- This does not fill missing environmental inputs. Around the explicit Cordova
  reference 10.25 N, 123.95 E, there are still zero published candidates within
  30 km. Chlorophyll alignment/coverage remains separate work.
- Locations remain gridded because they are environmental source-cell centers.
  Historical proximity does not prove a catch, a navigable route, fine coastline
  validity or an official EEZ boundary. Gridded history lacks the original raw
  detection QC fields. No scores were boosted to force local recommendations.
- This is pelagic only. Weather clearance, SMS and automatic future-day input,
  scoring, history filtering and publication are not completed by this refresh.
- The existing Lambda still outputs raw scoring candidates to S3; this run's
  additional historical stage was an explicit operator workflow. The publisher
  now requires historical-filtered lineage and refuses the withdrawn run.
- No frontend redesign, dependency installation, migration, commit, push or
  merge was performed for this replacement.
