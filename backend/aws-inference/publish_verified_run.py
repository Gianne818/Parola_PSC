"""Publish a verified AWS pelagic result to the existing PostGIS table.

No schema changes, synthetic rows, weather decisions or SMS dispatches. Existing
rows for the selected day are accepted only if they exactly match this result;
otherwise publication stops rather than replacing another producer's work.
"""

import argparse
from datetime import datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path

import boto3
import numpy as np
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

from validated_csv_handler import FEATURES, load_real_inputs, manila_day
from historical_hotspots import verify_filtered_run


def validate_output(raw, report, inputs):
    if hashlib.sha256(raw).hexdigest() != report['output_sha256']:
        raise ValueError('AWS output hash does not match its run manifest')
    output = pd.read_csv(io.BytesIO(raw), dtype={'detection_date': str})
    required = ['grid_lat', 'grid_lon', 'catch_probability', 'detection_date',
                'cell_west', 'cell_south', 'cell_east', 'cell_north', *FEATURES]
    if not set(required).issubset(output.columns) or len(output) != report['total_hotspots']:
        raise ValueError('AWS output is incomplete or has the wrong row count')
    if not len(output):
        raise ValueError('Empty run needs an explicit run-status consumer; no stale rows were replaced')
    if (not output.detection_date.eq(report['prediction_date']).all()
            or not np.isfinite(output.catch_probability).all()
            or not output.catch_probability.between(0.5, 1).all()
            or output.duplicated(['grid_lat', 'grid_lon']).any()):
        raise ValueError('AWS scores, dates or unique coordinates are invalid')
    # Confirm every published coordinate/feature/cell still matches the real input.
    fields = ['grid_lat', 'grid_lon', *FEATURES, 'cell_west', 'cell_south', 'cell_east', 'cell_north']
    merged = output[fields].merge(inputs[fields], on=['grid_lat', 'grid_lon'],
                                   suffixes=('_output', '_input'), validate='one_to_one')
    if len(merged) != len(output):
        raise ValueError('An output coordinate was not present in the real source grid')
    for field in fields[2:]:
        if not np.allclose(merged[field+'_output'], merged[field+'_input'], rtol=0, atol=1e-10):
            raise ValueError('An output feature or source-cell boundary changed after scoring')
    return output


def publish(connection, output, day):
    with connection:
        with connection.cursor() as cursor:
            cursor.execute("SET LOCAL statement_timeout='60s'", ())
            cursor.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", ('parola:pelagic:'+day,))
            cursor.execute("SELECT id, ST_Y(centroid_geom), ST_X(centroid_geom), catch_probability, sst, chl_a, ST_XMin(grid_cell_geom), ST_YMin(grid_cell_geom), ST_XMax(grid_cell_geom), ST_YMax(grid_cell_geom) FROM public.daily_grid_predictions WHERE prediction_date=%s AND model_type='pelagic' ORDER BY ST_Y(centroid_geom), ST_X(centroid_geom)", (day,))
            existing = cursor.fetchall()
            expected = output.sort_values(['grid_lat', 'grid_lon'])
            if existing:
                actual = np.asarray([row[1:] for row in existing], dtype=float)
                wanted = expected[['grid_lat', 'grid_lon', 'catch_probability', 'thetao', 'chl',
                                   'cell_west', 'cell_south', 'cell_east', 'cell_north']].to_numpy(dtype=float)
                if actual.shape != wanted.shape or not np.allclose(actual, wanted, rtol=0, atol=1e-10):
                    raise ValueError('Different predictions already exist for today; preserved without modification')
                ids = [row[0] for row in existing]
            else:
                rows = [(day, float(row.cell_west), float(row.cell_south), float(row.cell_east),
                         float(row.cell_north), float(row.grid_lon), float(row.grid_lat),
                         float(row.catch_probability), float(row.thetao), float(row.chl))
                        for row in output.itertuples(index=False)]
                inserted = execute_values(cursor, """
                    INSERT INTO public.daily_grid_predictions
                        (prediction_date, model_type, grid_cell_geom, centroid_geom,
                         catch_probability, dbscan_cluster_id, sst, chl_a)
                    VALUES %s RETURNING id
                    """, rows, template="(%s, 'pelagic', ST_SetSRID(ST_MakeEnvelope(%s,%s,%s,%s),4326), ST_SetSRID(ST_MakePoint(%s,%s),4326), %s, -1, %s, %s)", page_size=1000, fetch=True)
                ids = [row[0] for row in inserted]
            cursor.execute("""SELECT COUNT(*), MIN(catch_probability), MAX(catch_probability),
                COUNT(*) FILTER (WHERE catch_probability>=0.50 AND catch_probability<0.60),
                COUNT(*) FILTER (WHERE NOT ST_Contains(grid_cell_geom,centroid_geom))
                FROM public.daily_grid_predictions WHERE prediction_date=%s AND model_type='pelagic'""", (day,))
            count, minimum, maximum, below_60, invalid_cells = cursor.fetchone()
            if count != len(output) or invalid_cells:
                raise ValueError('PostGIS verification failed; transaction rolled back')
            return {'status': 'verified', 'prediction_date': day, 'model_type': 'pelagic',
                    'rows': count, 'minimum_score': minimum, 'maximum_score': maximum,
                    'additional_hotspots_below_60': below_60, 'prediction_ids': ids}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--bucket', required=True)
    parser.add_argument('--manifest-key', required=True)
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[2]/'.env.local')
    client = boto3.client('s3', region_name='us-east-1')
    report = json.loads(client.get_object(Bucket=args.bucket, Key=args.manifest_key)['Body'].read())
    publication = report.get('database_publication')
    if isinstance(publication, dict) and publication.get('status') == 'withdrawn':
        raise ValueError('Withdrawn runs must not be republished')
    if (report['prediction_date'] != manila_day() or report['model_type'] != 'pelagic'
            or report['minimum_score'] != 0.5 or report['input_kind'] != 'copernicus_analysis_forecast'):
        raise ValueError('Only a real, current Manila-day pelagic run may be published')
    inputs, manifest = load_real_inputs(client, args.bucket, report['prediction_date'])
    if report['input_sha256'] != manifest['input_sha256'] or report['model_sha256'] != manifest['model_sha256']:
        raise ValueError('Scoring and real-input manifests disagree')
    raw = client.get_object(Bucket=args.bucket, Key=report['output_key'])['Body'].read()
    verify_filtered_run(client, args.bucket, report, raw)
    output = validate_output(raw, report, inputs)
    url = os.environ['DATABASE_URL'].replace('?pgbouncer=true', '')
    connection = psycopg2.connect(url, sslmode='require', connect_timeout=15)
    try:
        publication = publish(connection, output, report['prediction_date'])
    finally:
        connection.close()
    report['database_publication'] = publication
    report['database_published_at_utc'] = datetime.now(timezone.utc).isoformat()
    args.report.write_text(json.dumps(report, indent=2, allow_nan=False)+'\n')
    client.put_object(Bucket=args.bucket, Key=args.manifest_key,
                      Body=json.dumps(report, allow_nan=False).encode(), ContentType='application/json')
    print(json.dumps({key: value for key, value in publication.items() if key != 'prediction_ids'}, indent=2))


if __name__ == '__main__':
    main()
