# Parola session handoff — October 17, 2026

This is a project summary, not a full conversation transcript. Do not include
credentials, private screenshots, session cookies or account passwords here.

**Latest state:** The user requested deletion of the initial 11,007-row
publication and selected a fresh run. Those IDs are backed up and deleted.
Supabase now contains 2,241 October 17 pelagic candidates after the notebook's
historical proximity filter, including 618 scores below 60%. Older rows are
unchanged. Read the [replacement report](HISTORICAL_FILTERED_RUN_2026-10-17.md)
before continuing; earlier counts below are historical evidence.

## Context and completed work

- The user identified as Toby, the lead programmer, and explicitly authorized
  an urgent task outside the fix plan: lower minimum hotspot eligibility to
  inclusive 50%, align the map legend, and refresh today's AWS predictions.
- Work is on `codex/toby/hotspot-threshold-50`. Application changes are local
  and uncommitted; no frontend release, commit, push or merge was performed.
  Preserve all existing changes. Task-specific cross-owner authorization is
  recorded in [shared coordination rules](../../docs/tasks/shared.md).
- The original deployed inference generated random inputs. The deployed default
  entrypoint now requires real, dated and hash-verified inputs instead.
- Original science was inspected read-only at
  `/Users/gianne/Development/Python/Parola`. The lost feature NetCDF was not
  recovered. October's temperature baseline was reconstructed from all 341
  October days in 2015–2025 using the notebook method and pinned source version.
- Baseline and prepared daily Copernicus analysis/forecast inputs are in AWS S3.
  They were not imported wholesale into Supabase. Supabase holds the resulting
  dashboard predictions in `public.daily_grid_predictions`.
- AWS run `20261016T184655Z-bb3d5095ad6e` scored 39,328 real input cells and
  published 11,007 pelagic predictions for October 17, 2026, Asia/Manila.
  Of these, 3,951 have scores from 50% to below 60%. Existing older rows remain.
- Model scores are environmental proxies; catch probability calibration and
  sailing safety were not established. No fresh demersal run was performed.
- See [the run report](REAL_INPUT_RUN.md) for exact sources, hashes, S3 keys,
  deployment details, checks and limitations.
- A later local sign-in issue was resolved by generating the missing
  `PAROLA_DEMO_SESSION_SECRET` in ignored root `.env.local` with mode 0600.
  Other configuration and auth code were preserved. The running local server
  returned the expected HTTP 401 for an invalid demo cookie. This check alone
  did not establish a full browser registration/sign-in journey.

## Pending: Cordova coastal input gap

The user reported no hotspots around Cordova despite fishing activity there.
Read-only diagnostics of today's cached source files found:

- In the diagnostic box 10.10–10.50 N, 123.80–124.20 E, 12 of 25 physics-grid
  cells have finite source surface temperature. None of those 12 become complete
  prepared model inputs with the current preprocessing.
- All 12 have usable temperature, currents, sea level, temperature gradients
  and temperature anomalies after processing; chlorophyll and its gradient
  remain missing, causing exclusion before model scoring.
- The physics grid spacing is about 0.08333 degrees; chlorophyll is 0.25 degrees.
  Coarse source masks plus linear interpolation with missing neighbors contribute
  to the gap. Some finite chlorophyll values exist in the native source nearby.
- A diagnostic switch from linear to nearest interpolation produced finite
  chlorophyll at 9 of the 12 source-wet cells directly, and 12 after the existing
  spatial fill. This does not prove valid gradients, coastline connectivity,
  training compatibility, calibrated scores or usable fishing predictions.
- No coastal interpolation code change was saved or deployed. No predictions
  from that experiment were published or substituted in Supabase.

The proposed next step is to validate coastal chlorophyll alignment against
appropriate water-cell support and the original training preprocessing, then
recompute all required features and assess affected scores before publication.
Do not simply fill across land, increase interpolation reach, invent data, or
lower the score threshold to disguise missing inputs. Finer coastal source data
may still be needed. A visible "data unavailable" state needs coordination with
Tier/Son under the current ownership rules.

Reference for missing-value interpolation behavior:
[Xarray documentation](https://docs.xarray.dev/en/stable/user-guide/interpolation.html#interpolating-arrays-with-nan).

## Pending: automatic daily operation

A later user-requested source comparison exactly replayed the original 854-row
daily CSV from July inputs. That daily generator also omits historical DBSCAN;
separate notebook experiments add historical proximity filtering or a flag.
The original points are on a 0.25-degree lattice, while today's dense outputs
use the approximately 0.08333-degree physics grid. Historical positive boat
presence is recoverable from a nonempty Parquet file, including records near
Cordova. No new predictions were published in this investigation. Read the
[comparison report](ORIGINAL_PIPELINE_COMPARISON_2026-10-17.md) before assuming
clustering generated the earlier daily CSV or that model scores alone reproduce
the supplied architecture.

This was a verified one-day pelagic refresh. Future daily input generation and
database publication are not scheduled. The existing enabled AWS trigger still
runs the scorer, which fails when that day's real inputs are absent. Do not
describe the daily pipeline as fully automated.

## Continuing safely

Read `AGENTS.md`, `fixplan.md`, the current shared rules, Toby's checklist and
the run report before implementation. Ask for identity if the next conversation
does not explicitly identify the user; this file does not identify a future
user automatically. Select the requested scope and preserve other members' work.
Credentials stay in ignored local configuration or the existing AWS settings;
never copy them into a handoff or transcript export.

Ignored local evidence is under `artifacts/2026-10-17/`. An isolated scientific
runtime and model download were under `/tmp/parola-hotspot-50/`; temporary files
may not survive a restart. Recover pinned models from S3 if necessary.
