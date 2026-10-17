-- OPS-01: review/apply separately; never run automatically at API startup.
-- Additive only: legacy predictions/advisory links retain their IDs and data.
BEGIN;

CREATE TABLE public.prediction_ingestion_runs (
    id uuid PRIMARY KEY,
    payload_hash text NOT NULL CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed')),
    expected_records integer NOT NULL CHECK (expected_records BETWEEN 1 AND 10000),
    published_records integer NOT NULL DEFAULT 0,
    geometry_adapter text NOT NULL DEFAULT 'legacy-envelope-v1' CHECK (geometry_adapter = 'legacy-envelope-v1'),
    failure_code text CHECK (failure_code IN ('write_failed', 'publish_failed', 'commit_unknown')),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    published_at timestamptz,
    CHECK ((status = 'published' AND published_records = expected_records
            AND published_at IS NOT NULL AND failure_code IS NULL)
        OR (status = 'pending' AND published_records = 0 AND published_at IS NULL AND failure_code IS NULL)
        OR (status = 'failed' AND published_records = 0 AND published_at IS NULL AND failure_code IS NOT NULL))
);

ALTER TABLE public.daily_grid_predictions
    ADD COLUMN ingestion_run_id uuid REFERENCES public.prediction_ingestion_runs(id) ON DELETE RESTRICT,
    ADD COLUMN ingest_cell_key text,
    ADD CONSTRAINT prediction_ingestion_identity CHECK (
        (ingestion_run_id IS NULL AND ingest_cell_key IS NULL)
        OR (ingestion_run_id IS NOT NULL AND ingest_cell_key IS NOT NULL AND ingest_cell_key ~ '^[0-9a-f]{64}$')
    ),
    ADD CONSTRAINT prediction_run_cell_unique UNIQUE (ingestion_run_id, ingest_cell_key);

-- No backfill of run lineage for legacy rows. No deletes, truncates or reseeds.
ALTER TABLE public.prediction_ingestion_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.prediction_ingestion_runs FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.daily_grid_predictions FROM PUBLIC;
DO $$
DECLARE client_role text;
BEGIN
    FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
            EXECUTE format('REVOKE ALL ON public.prediction_ingestion_runs FROM %I', client_role);
            EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.daily_grid_predictions FROM %I', client_role);
        END IF;
    END LOOP;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT SELECT, INSERT, UPDATE ON public.prediction_ingestion_runs TO service_role;
    END IF;
END $$;

COMMIT;
