import sys
import os
import pandas as pd
from datetime import date
from sqlalchemy import text
from database import SessionLocal

def ingest_csv(csv_path: str, prediction_date: str = None):
    if not os.path.exists(csv_path):
        print(f"Error: File {csv_path} not found.")
        sys.exit(1)

    p_date = prediction_date or date.today().isoformat()
    df = pd.read_csv(csv_path)

    db = SessionLocal()
    try:
        count = 0
        for _, row in df.iterrows():
            lat = row['grid_lat']
            lon = row['grid_lon']
            prob = row['catch_probability']
            sst = row.get('thetao', None)
            chl = row.get('chl', None)
            cluster_id = int(row.get('global_rank', -1))

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
            db.execute(query, {
                "p_date": p_date,
                "lat": lat,
                "lon": lon,
                "prob": prob,
                "cluster_id": cluster_id,
                "sst": sst,
                "chl": chl
            })
            count += 1
        db.commit()
        print(f"Successfully ingested {count} prediction records for date {p_date} into Supabase PostGIS.")
    except Exception as e:
        db.rollback()
        print(f"Error during ingestion: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "parola_daily_advisories.csv"
    date_arg = sys.argv[2] if len(sys.argv) > 2 else None
    ingest_csv(path, date_arg)
