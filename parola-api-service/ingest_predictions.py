"""Validated CSV ingestion. Importing this module never opens a database."""
import csv
import sys
import argparse
from pathlib import Path
from uuid import UUID
from calendar_dates import manila_today, parse_prediction_date
from schemas import DailyGridPredictionItem
from prediction_ingestion import IngestionError, ingest_predictions, prepare_batch


def read_predictions(csv_path: str, prediction_date):
    try:
        day = manila_today() if prediction_date is None else parse_prediction_date(prediction_date)
    except ValueError:
        raise IngestionError('Invalid prediction date; use YYYY-MM-DD.') from None
    items = []
    row_number = 1
    try:
        with Path(csv_path).open(encoding='utf-8-sig', newline='') as source:
            reader = csv.DictReader(source, strict=True)
            fields = reader.fieldnames or []
            if len(fields) != len(set(fields)) or not {'grid_lat', 'grid_lon', 'catch_probability'}.issubset(fields):
                raise IngestionError('CSV requires unique grid_lat, grid_lon and catch_probability columns.')
            for row_number, row in enumerate(reader, start=2):
                if None in row or any(value is None for value in row.values()):
                    raise ValueError('Invalid row width')
                items.append(DailyGridPredictionItem(
                    prediction_date=day, lat=float(row['grid_lat']), lon=float(row['grid_lon']),
                    catch_probability=float(row['catch_probability']),
                    dbscan_cluster_id=int(row.get('global_rank', '-1')),
                    sst=float(row['thetao']) if row.get('thetao', '').strip() else None,
                    chl_a=float(row['chl']) if row.get('chl', '').strip() else None,
                    model_type=row.get('model_type', 'pelagic'),
                ))
                if len(items) > 10000:
                    raise IngestionError('Use 1–10000 prediction records.', 'invalid_batch', 422)
    except IngestionError:
        raise
    except (OSError, UnicodeError, csv.Error, ValueError):
        raise IngestionError(f'Invalid CSV input at row {row_number}; check the file, numeric fields and coordinate ranges.') from None
    if not items:
        raise IngestionError('CSV contains no prediction records.')
    return items


def ingest_csv(csv_path: str, prediction_date: str | None = None, *, run_id: UUID | None = None, session_factory=None) -> int:
    # Validate every record before creating a session or issuing a write.
    items = read_predictions(csv_path, prediction_date)
    batch = prepare_batch(items, run_id)
    print(f'Ingestion run ID: {batch.run_id}. Retain this ID to reconcile an interrupted upload.')
    if session_factory is None:
        try:
            from database import SessionLocal
            session_factory = SessionLocal
        except Exception:
            raise IngestionError('Database configuration unavailable; check the backend configuration and dependencies.') from None
    db = None
    try:
        db = session_factory()
        result = ingest_predictions(db, items, batch.run_id)
    except IngestionError:
        raise
    except Exception:
        raise IngestionError('Database session unavailable; no success was reported.') from None
    finally:
        if db is not None:
            try:
                db.close()
            except Exception:
                raise IngestionError('Database session cleanup failed. Verify transaction state before retrying.') from None
    if result['replayed']:
        print(f"Run already published; inserted 0 additional records ({result['total_records']} total).")
    else:
        print(f'Successfully ingested {len(items)} prediction records for date {items[0].prediction_date.isoformat()} into Supabase PostGIS.')
    return result['inserted_records']


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description='Validated, retry-safe prediction ingestion (requires migration 05).')
    parser.add_argument('path', nargs='?', default='parola_daily_advisories.csv')
    parser.add_argument('day', nargs='?', help='YYYY-MM-DD (default: Manila today)')
    parser.add_argument('--run-id', type=UUID, help='Stable upload UUID; reuse it for retries')
    args = parser.parse_args(sys.argv[1:] if argv is None else argv)
    try:
        ingest_csv(args.path, args.day, run_id=args.run_id)
    except IngestionError as error:
        print(f'Error: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
