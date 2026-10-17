"""Transactional API/CSV ingestion; importing this module never connects to a DB.

Run IDs identify an upload, not a scientifically validated inference run. Legacy
geometry is retained until the producer supplies reviewed source-cell geometry.
"""
from dataclasses import dataclass
import hashlib
import json
from uuid import UUID, NAMESPACE_URL, uuid5

from sqlalchemy import text
from schemas import DailyGridPredictionItem


class IngestionError(RuntimeError):
    def __init__(self, message, code='ingestion_unavailable', status_code=503, *, run_id=None, failure_code=None):
        super().__init__(message)
        self.code = code
        self.status_code = status_code
        self.run_id = str(run_id) if run_id is not None else None
        self.failure_code = failure_code

    def as_detail(self):
        detail = {'code': self.code, 'message': str(self)}
        if self.run_id is not None:
            detail['run_id'] = self.run_id
        if self.failure_code is not None:
            detail['failure_code'] = self.failure_code
        return detail


@dataclass(frozen=True)
class PreparedBatch:
    run_id: UUID
    payload_hash: str
    rows: list[dict]


def prepare_batch(items: list[DailyGridPredictionItem], run_id: UUID | None = None) -> PreparedBatch:
    if not items or len(items) > 10000:
        raise IngestionError('Use 1–10000 prediction records.', 'invalid_batch', 422)
    rows = []
    cells = set()
    for item in items:
        # JSON's -0.0 and 0.0 denote the same location/measurement.
        row = {key: (0.0 if type(value) is float and value == 0 else value)
               for key, value in item.model_dump(mode='json').items()}
        cell = json.dumps([row['prediction_date'], row['model_type'], row['lon'], row['lat']], separators=(',', ':'))
        if cell in cells:
            raise IngestionError('Duplicate date/habitat/location in one batch.', 'duplicate_cell', 422)
        cells.add(cell)
        row['ingest_cell_key'] = hashlib.sha256(cell.encode()).hexdigest()
        rows.append(row)
    rows.sort(key=lambda row: (row['prediction_date'], row['model_type'], row['lon'], row['lat']))
    canonical = json.dumps(rows, sort_keys=True, separators=(',', ':'), allow_nan=False)
    payload_hash = hashlib.sha256(('legacy-envelope-v1:' + canonical).encode()).hexdigest()
    identity = run_id or uuid5(NAMESPACE_URL, 'parola:prediction-upload:v1:' + payload_hash)
    return PreparedBatch(identity, payload_hash, rows)


INSERT_PREDICTIONS = text("""
    INSERT INTO public.daily_grid_predictions (
        ingestion_run_id, ingest_cell_key, prediction_date, model_type,
        grid_cell_geom, centroid_geom, catch_probability, dbscan_cluster_id, sst, chl_a
    ) VALUES (
        :run_id, :ingest_cell_key, CAST(:prediction_date AS date), :model_type,
        ST_MakeEnvelope(:lon - 0.005, :lat - 0.005, :lon + 0.005, :lat + 0.005, 4326),
        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326),
        :catch_probability, :dbscan_cluster_id, :sst, :chl_a
    )
""")


def ingest_predictions(db, items: list[DailyGridPredictionItem], run_id: UUID | None = None) -> dict:
    batch = prepare_batch(items, run_id)
    params = {'run_id': str(batch.run_id), 'payload_hash': batch.payload_hash,
              'expected_records': len(batch.rows)}
    phase = 'claim_failed'
    claimed = False
    try:
        # Persist identity before the write transaction. Concurrent retries wait
        # on the unique key, then the row lock; a process crash leaves pending.
        db.execute(text("""
            INSERT INTO public.prediction_ingestion_runs (id, payload_hash, expected_records)
            VALUES (:run_id, :payload_hash, :expected_records)
            ON CONFLICT (id) DO NOTHING
        """), params)
        db.commit()
        run = db.execute(text("""
            SELECT payload_hash, status, expected_records
            FROM public.prediction_ingestion_runs WHERE id = :run_id FOR UPDATE
        """), params).mappings().one()
        if run['payload_hash'] != batch.payload_hash or run['expected_records'] != len(batch.rows):
            raise IngestionError('Run ID already belongs to a different upload.', 'run_conflict', 409)
        if run['status'] == 'published':
            db.rollback()  # Release the lock without changing published history.
            return {'status': 'success', 'run_id': str(batch.run_id),
                    'inserted_records': 0, 'total_records': len(batch.rows), 'replayed': True}
        claimed = True
        phase = 'write_failed'
        db.execute(INSERT_PREDICTIONS, [row | {'run_id': str(batch.run_id)} for row in batch.rows])
        actual = db.execute(text("""
            SELECT count(*) FROM public.daily_grid_predictions WHERE ingestion_run_id = :run_id
        """), params).scalar_one()
        if actual != len(batch.rows):
            raise RuntimeError('Record count mismatch')
        phase = 'publish_failed'
        result = db.execute(text("""
            UPDATE public.prediction_ingestion_runs
            SET status = 'published', published_records = :expected_records,
                failure_code = NULL, updated_at = clock_timestamp(), published_at = clock_timestamp()
            WHERE id = :run_id AND status IN ('pending', 'failed') AND payload_hash = :payload_hash
        """), params)
        if result.rowcount != 1:
            raise RuntimeError('Publication state mismatch')
        phase = 'commit_unknown'
        db.commit()  # All rows and publication become visible together.
    except Exception as error:
        try:
            db.rollback()
        except Exception:
            raise IngestionError('Database rollback unconfirmed; reconcile the same run ID before retrying.',
                                 run_id=batch.run_id, failure_code=phase) from None
        if claimed:
            try:
                # After an ambiguous commit, never overwrite a committed success.
                # This UPDATE also serializes with another caller's retry.
                db.execute(text("""
                    UPDATE public.prediction_ingestion_runs
                    SET status = 'failed', failure_code = :failure_code, updated_at = clock_timestamp()
                    WHERE id = :run_id AND status <> 'published' AND payload_hash = :payload_hash
                """), params | {'failure_code': phase})
                db.commit()
            except Exception:
                try:
                    db.rollback()
                except Exception:
                    pass
                raise IngestionError('Ingestion failed; run status is unconfirmed. Reconcile the same run ID before retrying.',
                                     run_id=batch.run_id, failure_code=phase) from None
        if isinstance(error, IngestionError):
            error.run_id = str(batch.run_id)
            raise error from None
        raise IngestionError('Database ingestion failed. Reconcile or retry the same run ID; no success was reported.',
                             run_id=batch.run_id, failure_code=phase) from None
    return {'status': 'success', 'run_id': str(batch.run_id),
            'inserted_records': len(batch.rows), 'total_records': len(batch.rows), 'replayed': False}


def get_ingestion_run(db, run_id: UUID) -> dict:
    try:
        row = db.execute(text("""
            SELECT id AS run_id, status, expected_records, published_records,
                   failure_code, created_at, updated_at, published_at, geometry_adapter
            FROM public.prediction_ingestion_runs WHERE id = :run_id
        """), {'run_id': str(run_id)}).mappings().one_or_none()
    except Exception:
        raise IngestionError('Ingestion status unavailable.') from None
    if row is None:
        raise IngestionError('Ingestion run not found.', 'run_not_found', 404)
    return dict(row)
