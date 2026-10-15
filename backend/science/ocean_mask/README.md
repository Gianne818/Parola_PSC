# DATA-01-TOBY: offline ocean-mask evaluation

This directory completes the initial source/fixture screening portion, not the
full assignment or a production mask. C01 and D08 remain pending. Nothing here is
connected to inference, databases, APIs, maps or publication. No dependency is
added. All commands below run from the repository root with Python 3.10+ and the
standard library (checked locally with Python 3.14.3).

## Result and limits

The bundled Natural Earth candidate labels the plan's four rounded city points
as land and retains its two open-water controls: six screening matches. These
six controls are **provisional**, not independently surveyed truth. They do not
establish classification accuracy, small-island completeness or safe fishing
eligibility. In particular, a city name does not prove its rounded point is on
the correct side of a shoreline.

Three additional probes remain unscored. The candidate labels the proposed
Malapascua and Cabilao points as `water_candidate`, and the proposed Cebu cell as
`coastal_or_mixed`. Independently verify each exact point and footprint before
interpreting these as omissions or assigning expected results. Do not change
expected results to match this candidate. These observations prevent approval
based only on the six broad controls.

The exact coordinates, expectations, review states and basis are in
[fixtures/controls.json](fixtures/controls.json). The deterministic results and
source/fixture hashes are in [screening-report.json](screening-report.json).
No real shoreline or small-island control has been independently approved.
Synthetic tests supply exact geometry truth for algorithm behavior only.

## Candidate sources

| Candidate | Evidence and reuse | Evaluation and remaining evidence |
| --- | --- | --- |
| Natural Earth land | [Provider's land page](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/) describes major-island land polygons at **1:10 million map scale**, not 10-metre resolution. [Terms](https://www.naturalearthdata.com/about/terms-of-use/) permit public-domain reuse. | Executed on the pinned **v5.0.0 GeoJSON** snapshot below. The provider's current land page lists v5.1.1; this experiment does not evaluate that newer shapefile or imply equivalence. Exact coastal accuracy and small-island coverage are unvalidated. |
| `global-land-mask` | [Maintainer's README](https://github.com/toddkarin/global-land-mask) describes GLOBE-derived approximately 1-km sampling and nearest-neighbor lookup; code is MIT licensed. It requires NumPy and notes lakes are treated as land. | Literature/source review only; **not installed or executed**. Nominal sampling does not demonstrate small-island or shoreline correctness. Son must coordinate pinned dependencies and data-license review before a reproducible comparison. |

Sources were inspected on 2026-10-15. Neither candidate is approved. D08 needs
reviewed independent shoreline/small-island evidence, source access/reuse and
lineage, and an explicit resolution/uncertainty decision. Assess the current
Natural Earth release and a more detailed source if the reviewed controls show
that these candidates are insufficient. Do not invent an accuracy estimate or
solve resolution uncertainty with an arbitrary 1-km shore buffer.

## Reproduce the screening

Use the bundled subset without network access:

```sh
python3 -m unittest discover -s backend/science/ocean_mask/tests -v
python3 -m backend.science.ocean_mask.evaluate evaluate --output /tmp/parola-mask-report.json
diff -u backend/science/ocean_mask/screening-report.json /tmp/parola-mask-report.json
```

The evaluator verifies the pinned subset digest, source commit/URL/hash, study
bounds and non-approval state before classifying anything. A missing, changed,
empty or structurally unsupported source fails visibly; it never becomes an
empty land layer that accepts all points as ocean. Exit code 0 means a report
was generated, **not** source validation or publication approval. Exit code 2
means input/evaluation failure. Mismatches and unscored probes remain in reports.

To reproduce the subset from upstream (requires network access):

```sh
curl --fail --location --output /tmp/parola-ne-10m-land.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ace5fed0eaf3c6c03c951e75b439ba8fffbc218e/geojson/ne_10m_land.geojson
python3 -m backend.science.ocean_mask.evaluate prepare /tmp/parola-ne-10m-land.geojson /tmp/parola-mask-subset
diff -u backend/science/ocean_mask/fixtures/source.json /tmp/parola-mask-subset/source.json
cmp backend/science/ocean_mask/fixtures/natural_earth_land.geojson /tmp/parola-mask-subset/natural_earth_land.geojson
```

The upstream commit message identifies this as the final v5.0.0 GeoJSON, dated
2021-12-08 ([commit](https://github.com/nvkelso/natural-earth-vector/commit/ace5fed0eaf3c6c03c951e75b439ba8fffbc218e)).
The original 10,157,965 bytes have SHA-256
`1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416`.
Preparation refuses different upstream bytes. It keeps 232 complete polygons
whose exteriors intersect `[117, 5, 127, 21]` in CRS84; it does not clip,
simplify, round coordinates or buffer shores. The resulting 288,332-byte
GeoJSON has SHA-256
`e3944b196f38446ab971b53a188ac9b12b1b1a2bb05bbf4259c4202b9d069107`.
Made with Natural Earth; the bundled geometry retains its public-domain status.

## Classification semantics and tests

The study rectangle limits this experiment. It is neither an ocean predicate
nor a legal/EEZ boundary. Longitude precedes latitude. Invalid, missing, swapped
or out-of-study inputs stay `unknown`; no values are coerced or coordinates
swapped automatically. Exact polygon edges/vertices are `boundary`. Points
inside polygon holes stay `unknown`: a lake is not evidence of ocean. Points
outside land polygons within the study area are only `water_candidate`.

Cell screening checks edges and enclosed polygons as well as corners. A small
island wholly inside a cell with four wet corners still yields
`coastal_or_mixed`. A land centroid or ocean centroid alone cannot validate a
mixed source cell. Boundaries include upstream internal polygon seams, so this
conservative label can overflag cells. Actual grid-cell geometry and production
cell exclusion/clipping policy still need C01/D08 agreement.

This planar algorithm is restricted to a region away from the antimeridian.
Structural checks reject unsupported CRS, unclosed/nonfinite/degenerate rings
and antimeridian-crossing edges in candidate polygons. They do **not** perform
full topology repair/validation, quantify positional error or identify missing
islands. Synthetic behavioral tests cover land/water, winding direction,
holes/islands, exact boundaries, near-shore water without a blanket buffer,
mixed/enclosed-island cells, malformed inputs and source integrity. The report
regression checks reproducibility, not scientific ground truth.

## Handoff and remaining work

- **Toby / D08:** Independently review exact controls, small-island footprints
  and coast-adjacent/mixed cells; compare current source versions and document
  resolution, accuracy evidence and limitations before recommending a source.
- **Son / C01, shared rules:** Agree coordinate order, mask/source version and
  checksums, coverage/unknown/boundary semantics, actual grid-cell envelopes and
  exclusion policy, and publication examples/errors. Local JSON files in this
  directory are experimental artifacts, not shared wire or database contracts.
- **Son / dependencies:** If the GLOBE-based comparison is pursued, coordinate
  pinned `global-land-mask`/NumPy requirements and reproducible data versions in
  Son-owned manifests. No package or manifest was changed here.
- **After approval:** Toby adds generation exclusion in owned inference code;
  Son owns versioned storage/load/query/ingestion/cleanup and integration;
  Tier owns rendering. Historical deletion/cleanup, legal marine eligibility,
  home-port validation and production publication are outside this experiment.

The complete DATA-01-TOBY checkbox remains unchecked until approved generation
exclusion and validated source geometry meet the assignment's acceptance gates.
