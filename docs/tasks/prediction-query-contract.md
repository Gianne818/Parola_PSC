# SON-04: nearest prediction query corrections

Selected by Son on October 18, 2026. Branch:
`codex/son/prediction-queries`. This delivers the date-selection/query portion of
MAP-01/MAP-02 and explicit lineage availability for DATA-02;
SON-04 remains partial.

`GET /api/advisories/nearest` keeps its existing hotspot fields, species lookup,
regional metadata and default limits. Both regional and national queries now
use the same selection logic:

1. Select one national prediction date for the requested habitat: the newest
   stored date on or before the current **Asia/Manila** day. With `both`, this is
   the latest date present in either habitat, not the last date containing both.
   `prediction_date=YYYY-MM-DD` requests that exact date for history/future preview.
2. Apply region/habitat filters within that date. Keep the newest row per
   coordinate pair **and habitat**, ordered by creation timestamp and ID.
   Pelagic and demersal rows remain distinct. Do not fill regional/habitat gaps
   with a different date, model or older prediction at another location.
3. Apply the existing inclusive 0.25 score floor to that newest row. An older
   high score cannot replace a newer below-floor score at the same location.
4. Sort by spherical distance from the requested port, then ID, before limiting.
   Regional counts and dates describe all eligible rows before the response cap.

Coordinates come from PostGIS `ST_Y` (latitude) and `ST_X` (longitude), without
parsing WKT. Invalid/missing coordinates, the invalid target pair `(0,0)`, or a
missing/nonfinite/out-of-range score produce HTTP 503 with
`code: "prediction_data_unavailable"` and no hotspots. A partly corrupt result
is not silently presented as complete. Individual zero coordinates and real
zero environmental readings are retained; valid home-port inputs are unchanged.

## Habitat and error compatibility

| Input/result | Behavior |
| --- | --- |
| No habitat, no species | Both habitats remain eligible, matching existing callers. |
| `habitat=pelagic` / `demersal` | Only that model is queried; no substitute habitat query. |
| `habitat=both` | Both models are eligible; the distance cap still applies across them. |
| Species without habitat, or with `both` | The resolved species' habitat is used, as before. |
| Species conflicts with an explicit single habitat | HTTP 422, `species_habitat_conflict`. |
| Invalid habitat or blank coordinate/limit parameter | HTTP 400 before database access. |
| Invalid/blank/nonexistent calendar `prediction_date` | HTTP 400 before database access. |
| No matching rows | HTTP 200, empty hotspots, `habitat_status: "unavailable"`. |
| Matching rows | `habitat_status: "available"` means matching stored rows exist, not operational or scientific validation. |

Success/empty responses add `requested_habitat` describing the effective filter.
Existing consumers can continue using their current request and response fields.
`both` does not promise a quota of each model within a bounded nearest result.
Unknown depth/HSI inputs retain their explicit unavailable values and existing
provenance remains `legacy_unverified`.

## Date, coverage and lineage metadata

Success and empty responses include `selection`:

| Field | Meaning |
| --- | --- |
| `requested_date`, `prediction_date`, `as_of_date`, `timezone` | Exact override or null; selected date or null; database statement's Manila day; `Asia/Manila`. |
| `date_status` | `today`, `historical`, `future` or `unavailable`; calendar classification, not input freshness. |
| `habitats.pelagic`, `habitats.demersal` | `status` (`available`, `unavailable`, `not_requested`) and `eligible_count` before response limiting. |
| `coherence` | `prediction_date_only`; it does not certify a single scientific run. |
| `lineage_status` | `unavailable`, `upload_identity_only` or `mixed`; no invented lineage for legacy rows. |
| `ingestion_run_ids`, `ingestion_run_count`, `ingestion_run_ids_capped` | At most ten observed upload IDs, the full distinct count and whether IDs were capped. |
| `validity_status`, `operational_eligible` | Always `unverified` and `false` for this preview/storage contract. |
| `geography` | Demo preview is `not_evaluated`. Enabled authenticated reads filter using server profile authority and report denied/unavailable counts; inactive live reads fail unavailable. See the [geographic contract](geographic-eligibility-contract.md). |

Upload IDs are read if migration 05's nullable field exists; otherwise legacy
rows remain unlinked without a schema error. No ledger join or publication/
scientific approval is inferred. A date can contain several uploads or unlinked
producer writes. Even today's rows do not establish fresh inputs, safety,
publication approval or fishing eligibility. The API's metadata reports this
limitation; it does not implement enforcement in other query/SMS/export paths.
No arbitrary last-good age policy is invented. Older stored data remains
historical, future rows require explicit date selection, and absent coverage
stays unavailable. Successful and empty responses use `Cache-Control: no-store`
so a cached prior-day classification is not reused after Manila midnight.

## Validation and remaining integration

API regression tests use mocked storage. A separate local, in-memory PGlite
check executes the actual SQL with mocked geometry functions: per-habitat/both
selection, nearest-before-limit, stable deduplication, newer-low-score exclusion,
regional counts, numeric coordinate order and missing-habitat isolation pass.
Continuation fixtures also exercise exact historical dates, future exclusion,
Manila midnight independently of the database timezone, regional/date gaps,
lineage with and without migration 05, and bounded upload-ID metadata.
This is not a real PostGIS distance/containment, deployed schema or query-plan
check. It uses already-installed tooling, no remote database or providers.
The continuation passes 560 network-denied tests across 39 files and full
TypeScript. Tracked/changed-file secret scans and whitespace checks pass.
Independent spec/standards reviews found no remaining code blocker in this
portion; the removed date-window behavior is documented accurately above.

The previous two-day/global-latest fallback is removed. Date coherence is now
implemented, but true run coherence/publication is not established by date alone.
Toby's current direct writer does not supply the shared scientific run identity;
his ocean-mask screening report explicitly says `production_approved: false`.
Next integration needs reviewed run/model/input/source-cell manifests and mask
approval, followed by Son's authoritative eligibility and read/write enforcement.
Migration 05 remains prepared only; this continuation requires no new schema.

Tier retains frontend ownership. Existing readers remain compatible; forwarding
an explicit habitat/date to storage and displaying `selection` can be a separate
Tier change. Calendar/history controls must request another date rather than
assume one response contains several dates. The returned per-habitat counts
must not be inferred from a capped result's model distribution. Toby
retains model/threshold/science ownership. No UI, account preferences, model,
SMS guard, AWS schedule, local credential or remote setting was changed.
