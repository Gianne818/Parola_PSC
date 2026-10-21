# OPS-01: API and CSV ingestion runs

Son-owned backend delivery, October 17, 2026. This is a portion of
[OPS-01 / SON-04](son.md#ops-01-son); full feature acceptance remains partial.
No frontend or scientific producer implementation is included.

## Behavior

API and CSV uploads use one service in `parola-api-service/prediction_ingestion.py`.
It validates the whole batch before writes, persists an ingestion identity, then
locks that identity while inserting all predictions and marking publication in
one transaction. Failed writes roll back the batch. A separate transaction
records a bounded failure code. No prediction deletion/replacement occurs;
existing rows, advisory references and prior successful runs remain intact.

An ingestion run identifies an **upload**, not a validated scientific model run.
`published` means all upload rows committed; it does not certify ocean eligibility,
freshness, safety, calibrated scores or operational readiness. Nearest preview
reads now select one date and expose unavailable/unverified lineage; see the
[prediction query contract](prediction-query-contract.md). Scientific run
selection/retirement remains MAP-02;
new uploads do not erase historical or overlapping runs.

## Write contract

`POST /api/predictions/ingest` retains `X-API-Key` authentication. Supply
`predictions` (1–10000 records) and optionally a stable UUID `run_id`.
Rows retain the existing field names: ISO `prediction_date`, finite numeric
`lat`/`lon`, `model_type` (`pelagic` or `demersal`), finite `catch_probability`
between 0 and 1, and optional cluster/SST/chlorophyll fields. Nullable environmental
values remain missing; real zero values are preserved. This adds no calibration
claim. Duplicate date/habitat/location rows in one upload fail with 422.

Without `run_id`, canonical content supplies a deterministic UUID. Reordering
identical rows or using negative zero does not create a new upload. Reuse the
same ID and exact content on retries, including after a lost commit acknowledgement.
Changed content with an existing ID returns 409 `run_conflict`. A deliberately
different explicit ID denotes a different upload; deduplication is not global
across separately identified scientific runs or overlapping subsets.

New publication returns 201 with `status=success`, `run_id`, `inserted_records`,
`total_records` and `replayed=false`. Replaying a published upload returns 200,
`replayed=true` and `inserted_records=0`. Database/schema failures return 503 with
a safe error code/message and, once prepared, the run ID and failure phase for
reconciliation. No successful fallback is reported.

`GET /api/predictions/runs/{run_id}` requires the same API key and disables caching.
It returns `pending`, `published` or `failed`, expected/published counts, UTC
timestamps, the geometry adapter and a safe failure code. It exposes no input
rows, credentials or raw driver errors. Unknown IDs return 404. `pending` may
mean an interrupted process, not necessarily an active worker. Failure tracking
can itself fail: reconcile the same ID rather than assuming a failed response
proves no commit occurred. A late failure cannot overwrite published success.

CSV retains its positional file/date arguments and adds `--run-id UUID`.
It prints the ID before opening the database. An optional `model_type` column
supports pelagic/demersal rows independently or together; absent columns retain
the legacy pelagic mapping. Pin the prediction date when retrying across Manila
midnight. Replays report zero new rows; CLI failures exit nonzero. A session
cleanup failure reports an unconfirmed outcome even if publication committed.

## Migration and verification boundary

`backend/migrations/05_prediction_ingestion_runs.sql` is additive and **not applied**.
It adds a private RLS-protected run ledger, nullable ingestion identity columns
on predictions, foreign-key/check constraints and per-run cell uniqueness.
Legacy rows remain null/unverified; no lineage is invented or backfilled.
Direct anon/authenticated prediction writes are revoked; service-side ingestion
remains the write boundary. Existing reads are preserved.

The existing registration migration runner does not apply migration 05.
Review and validate it separately in an explicitly approved disposable PostGIS
environment before any deployment. Until the migration exists, these writes and
status reads fail unavailable. No automatic schema creation or migration occurs.
Rollback planning must retain uploaded rows/IDs and advisory links; reverting
application code does not authorize dropping tables/columns or deleting data.

Local checks use fake sessions and in-process ASGI requests, not a live database.
They cover identities, replays, both habitats, duplicate/conflicting input,
transaction failure/count mismatch, ambiguous commit, failure status and API-key
denial. Actual PostgreSQL lock behavior, RLS/privileges, schema compatibility,
concurrent workers and publication visibility still need database integration
verification. No SMS, provider, deployment or production DB operation is required
by or performed for this delivery.

## Handoffs

- **Toby / TOBY-03 → Son / SON-04:** current Lambda output has no shared scientific
  run/cell IDs; its producer-specific envelopes differ from CSV/API's ±0.005°.
  Supply reviewed source-cell IDs/geometry and model/input/run manifests. The
  new service explicitly labels its retained geometry `legacy-envelope-v1`;
  hashed ingestion cell keys are date/habitat/location identities, not source IDs.
  Toby's direct database writer remains outside this service and its guarantees;
  it still needs coordinated replacement before operational publication claims.
- **Son / SON-04:** migrate/verify separately, then address coherent query run
  selection, ocean/coverage validity and producer integration under their selected
  portions. Last-good freshness policy is not established by retaining records.
- **Tier / TIER-02:** no frontend change is needed for this portion. If later
  consuming run status through an approved server adapter, distinguish upload
  completion from scientific validity and show pending/failed states honestly.
