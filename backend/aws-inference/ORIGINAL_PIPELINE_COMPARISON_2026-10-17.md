# Original daily CSV and October refresh comparison

The user requested another inspection of the original science directory after
seeing regular rows of map markers. This comparison reads that directory
without changing it. No AWS deployment or database mutation was performed.

## Exact reproduction of the original CSV

Read `/Users/gianne/Development/Python/Parola/parola_daily_advisories.csv` and
replayed the daily generator in zero-based cell 10 of `pelagic_model.ipynb`
using the saved `copernicus_live_today.csv` and `parola_pelagic_model_v2.txt`.
The saved input date and month are July 10, 2026 and July. Do not overwrite that
month with the current month when reproducing this historical artifact.

All **854 rows match exactly across all six output columns**, including ranks,
coordinates, scores, temperature and chlorophyll. Maximum absolute difference
is zero. The original output has no date column; this exact replay establishes
its relationship to the dated July input file.

| Measure | Original July files | Verified October 17 run |
| --- | --- | --- |
| Input rows | 40,691 | 39,328 complete rows |
| Complete required feature rows | 4,426 | 39,328 |
| Output scores meeting the original/new threshold | 854 at > 50% | 11,007 at >= 50% |
| Coordinate pattern | Every point lies on a 0.25-degree lattice | Physics-grid cells at approximately 0.08333 degrees |
| Historical DBSCAN in the daily CSV generator/scorer | Absent | Absent |

In the old input file, 36,088 rows lack `sst_anomaly`; all complete rows have
quarter-degree coordinates. The daily generator drops rows missing any required
feature. The old sparse appearance does not demonstrate that those coordinates
were cluster centers or independently validated coastal locations.

The new producer reconstructs the monthly anomaly baseline, aligns small source
coordinate rounding differences and retains many more complete physics-grid
cells. It publishes each qualifying source-cell center as a point, explaining
the dense regular map pattern. The dates and prepared inputs also differ; do
not attribute the change from 854 to 11,007 entirely to threshold or alignment.

## Historical workflow shown in the architecture

The historical DBSCAN experiments are in zero-based cells 8 and 9 of
`pelagic_model.ipynb`, separately from the daily CSV generator:

- Cluster historical positive boat-presence rows, subsampling to 100,000 with
  seed 42 when necessary.
- Use haversine DBSCAN with `eps=0.001` radians, approximately 6.371 km.
- Two saved variants use `min_samples=15` and `min_samples=100` respectively.
- Calculate distances to historical cluster means. The earlier variant keeps
  predictions within 15 km; the later variant explicitly preserves predictions
  and adds an `is_historical_hotspot` boolean instead of dropping distant rows.
- These experiments score historical feature rows at > 80%, rather than running
  the subsequent daily CSV generator at > 50%. They are not interchangeable.

Historical clustering/corroboration exists in the notebook, but neither the
reproduced daily CSV nor the October scorer applies it. The October refresh is
**eligible pelagic grid scores**, not evidence that the entire illustrated
advisory architecture has been reproduced. Its `dbscan_cluster_id=-1` means
clustering was not performed, rather than a computed DBSCAN noise result.

## Recoverable historical source and Cordova

`vbd_gridded_presence.parquet` contains 765,441 positive grid/day rows spanning
January 1, 2015 through December 31, 2025, with `detection_date`, `grid_lat`,
`grid_lon`, `boat_count` and `presence`. The original merged feature CSV is
empty. The presence table can support a documented historical reconstruction;
the old experiment's sample/order and source quality lineage still need review.

Using an explicit approximate Cordova reference of 10.25 N, 123.95 E and a
30 km haversine radius:

- Historical presence: **2,551 grid/day records at 24 distinct grid locations**.
- Original July daily CSV: **zero** output locations in that radius.
- Verified October 17 daily output: **zero** output locations in that radius.

Historical boat detections support investigating the reported fishing activity;
they do not establish catches or today's suitability. A history flag alone
cannot generate missing environmental features. The separate chlorophyll gap
remains described in the [session handoff](SESSION_HANDOFF_2026-10-17.md).

`ph_eez.geojson` contains only a 116–131 E, 4–21 N rectangle. It is not an actual
EEZ polygon or coastline mask and cannot validate those boundaries.

## Artifacts and next work

Ignored files under `artifacts/2026-10-17/`:

- `original-pipeline-comparison.json`: measured counts and exact replay result.
- `verified-aws-predictions.csv`: published AWS output, checked against its SHA256.
- `parola_daily_advisories_2026-10-17.csv`: today's verified results exported
  with the original six columns and order. No coordinate or score is changed.

Further implementation must distinguish raw environmental scores from
historical corroboration, verify the historical DBSCAN semantics and lineage,
validate coastal input handling, and obtain proper spatial boundaries. Do not
jitter coordinates, invent cluster IDs or relabel July predictions as today's
data. Map and shared API changes retain Tier/Son ownership. Daily scheduling is
still unfinished. No corrective prediction run was published in this comparison.
