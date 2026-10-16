"""Validated CSV ingestion. Importing this module never opens a database."""
import csv
import sys
from pathlib import Path
from sqlalchemy import text
from calendar_dates import manila_today, parse_prediction_date
from schemas import DailyGridPredictionItem


class IngestionError(RuntimeError):
    """An operator-safe error; never includes raw database or CSV contents."""


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
                ))
    except IngestionError:
        raise
    except (OSError, UnicodeError, csv.Error, ValueError):
        raise IngestionError(f'Invalid CSV input at row {row_number}; check the file, numeric fields and coordinate ranges.') from None
    if not items:
        raise IngestionError('CSV contains no prediction records.')
    return items


def ingest_csv(csv_path: str, prediction_date: str | None = None, *, session_factory=None) -> int:
    # Validate every record before creating a session or issuing a write.
    items = read_predictions(csv_path, prediction_date)
    if session_factory is None:
        try:
            from database import SessionLocal
            session_factory = SessionLocal
        except Exception:
            raise IngestionError('Database configuration unavailable; check the backend configuration and dependencies.') from None
    db = None
    try:
        db = session_factory()
        for item in items:
            # Preserve the existing legacy pelagic mapping and cell envelope.
            # Source-cell/run identities and scientific mappings are separate work.
            query = text("""
                INSERT INTO public.daily_grid_predictions (
                    prediction_date, model_type, grid_cell_geom, centroid_geom, catch_probability, dbscan_cluster_id, sst, chl_a, created_at
                ) VALUES (
                    :p_date, 'pelagic',
                    ST_SetSRID(ST_MakeEnvelope(:lon - 0.005, :lat - 0.005, :lon + 0.005, :lat + 0.005), 4326),
                    ST_SetSRID(ST_MakePoint(:lon, :lat), 4326),
                    :prob, :cluster_id, :sst, :chl, NOW()
                )
            """)
            db.execute(query, {'p_date': item.prediction_date, 'lat': item.lat, 'lon': item.lon,
                               'prob': item.catch_probability, 'cluster_id': item.dbscan_cluster_id,
                               'sst': item.sst, 'chl': item.chl_a})
        db.commit()
    except Exception:
        if db is not None:
            try:
                db.rollback()
            except Exception:
                pass  # Preserve the redacted primary failure, not driver details.
        raise IngestionError('Database ingestion failed. Verify transaction state before retrying; no success was reported.') from None
    finally:
        if db is not None:
            try:
                db.close()
            except Exception:
                raise IngestionError('Database session cleanup failed. Verify transaction state before retrying.') from None
    print(f'Successfully ingested {len(items)} prediction records for date {items[0].prediction_date.isoformat()} into Supabase PostGIS.')
    return len(items)


def main(argv=None) -> int:
    args = sys.argv[1:] if argv is None else argv
    path = args[0] if args else 'parola_daily_advisories.csv'
    day = args[1] if len(args) > 1 else None
    try:
        ingest_csv(path, day)
    except IngestionError as error:
        print(f'Error: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
