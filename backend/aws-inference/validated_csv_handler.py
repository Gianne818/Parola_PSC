"""Score dated, hashed real inputs with the existing deployed pelagic model.

This is the one-time real-input scoring entrypoint. It never generates features,
substitutes historical inputs for today, publishes SMS, or invents clusters.
Missing daily inputs fail visibly. An input-generation job is still needed to
supply subsequent dates; a previous day's output is never re-dated.
"""

from datetime import datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path
from uuid import uuid4
from zoneinfo import ZoneInfo

import boto3
import lightgbm as lgb
import numpy as np
import pandas as pd

FEATURES = [
    'thetao', 'zos', 'uo', 'vo', 'chl', 'sst_frontal_gradient',
    'chl_frontal_gradient', 'sst_anomaly', 'month', 'chl_sst_ratio',
]
BOUNDS = ['cell_west', 'cell_south', 'cell_east', 'cell_north']
MODEL_KEY = 'models/parola_pelagic_model_v2.txt'
MINIMUM_SCORE = 0.50


def manila_day(now=None):
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        raise ValueError('An aware generation timestamp is required')
    return now.astimezone(ZoneInfo('Asia/Manila')).date().isoformat()


def load_real_inputs(client, bucket, day):
    prefix = f'inputs/real-pelagic/{day}'
    manifest_bytes = client.get_object(Bucket=bucket, Key=prefix+'/manifest.json')['Body'].read()
    manifest = json.loads(manifest_bytes)
    if (manifest.get('schema_version') != 1
            or manifest.get('prediction_date') != day
            or manifest.get('input_kind') != 'copernicus_analysis_forecast'
            or manifest.get('features') != FEATURES
            or not manifest.get('source_lineage')
            or manifest.get('baseline_period') != ['2015-01-01', '2025-12-31']
            or manifest.get('baseline_month') != int(day[5:7])):
        raise ValueError('A dated real-input manifest matching the model is required')
    raw = client.get_object(Bucket=bucket, Key=prefix+'/features.csv')['Body'].read()
    if hashlib.sha256(raw).hexdigest() != manifest.get('input_sha256'):
        raise ValueError('Real-input CSV hash does not match its manifest')
    frame = pd.read_csv(io.BytesIO(raw), dtype={'detection_date': str})
    required = ['detection_date', 'grid_lat', 'grid_lon', *FEATURES, *BOUNDS]
    if not set(required).issubset(frame.columns) or frame.empty or len(frame) != manifest.get('row_count'):
        raise ValueError('Real-input CSV has missing columns or an unexpected row count')
    if not frame.detection_date.eq(day).all() or not frame.month.eq(int(day[5:7])).all():
        raise ValueError('Input rows do not match the requested Manila prediction day')
    numeric = frame[['grid_lat', 'grid_lon', *FEATURES, *BOUNDS]]
    if not np.isfinite(numeric.to_numpy(dtype=float)).all():
        raise ValueError('Incomplete/nonfinite real input values cannot be scored')
    if (not frame.grid_lat.between(-90, 90).all()
            or not frame.grid_lon.between(-180, 180).all()
            or not (frame.cell_west < frame.grid_lon).all()
            or not (frame.cell_east > frame.grid_lon).all()
            or not (frame.cell_south < frame.grid_lat).all()
            or not (frame.cell_north > frame.grid_lat).all()
            or frame.duplicated(['grid_lat', 'grid_lon']).any()):
        raise ValueError('Source coordinates and cells must be valid and unique')
    return frame, manifest


def score(frame, model):
    if model.feature_name() != FEATURES:
        raise ValueError('Trained model feature order differs from prepared inputs')
    probabilities = np.asarray(model.predict(frame[FEATURES]), dtype=float)
    if (probabilities.shape != (len(frame),) or not np.isfinite(probabilities).all()
            or (probabilities < 0).any() or (probabilities > 1).any()):
        raise ValueError('Model returned invalid scores')
    output = frame.copy()
    output['catch_probability'] = probabilities
    output = output[output.catch_probability >= MINIMUM_SCORE].copy()
    output.sort_values(['catch_probability', 'grid_lat', 'grid_lon'],
                       ascending=[False, True, True], inplace=True)
    output['global_rank'] = range(1, len(output)+1)
    output['dbscan_cluster_id'] = -1  # Clustering is not performed by this run.
    output['model_type'] = 'pelagic'
    output['safety_status'] = 'UNKNOWN'  # Environmental score is not a safety clearance.
    return output


def handler(event, context):
    bucket = os.environ.get('MODEL_BUCKET_NAME')
    if not bucket:
        raise ValueError('MODEL_BUCKET_NAME is required')
    day = manila_day()
    client = boto3.client('s3')
    frame, manifest = load_real_inputs(client, bucket, day)
    model_bytes = client.get_object(Bucket=bucket, Key=MODEL_KEY)['Body'].read()
    model_digest = hashlib.sha256(model_bytes).hexdigest()
    if model_digest != manifest.get('model_sha256'):
        raise ValueError('Deployed model differs from the input manifest model')
    model_path = Path('/tmp/parola-real-pelagic-model.txt')
    model_path.write_bytes(model_bytes)
    output = score(frame, lgb.Booster(model_file=str(model_path)))
    run_id = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+uuid4().hex[:12]
    output_key = f'inference-runs/pelagic/{day}/{run_id}/predictions.csv'
    csv_bytes = output.to_csv(index=False).encode('utf-8')
    report = {
        'run_id': run_id, 'prediction_date': day, 'model_type': 'pelagic',
        'input_rows': len(frame), 'total_hotspots': len(output), 'minimum_score': MINIMUM_SCORE,
        'additional_hotspots_below_60': int((output.catch_probability < 0.60).sum()),
        'model_key': MODEL_KEY, 'model_sha256': model_digest,
        'input_manifest_key': f'inputs/real-pelagic/{day}/manifest.json',
        'input_sha256': manifest['input_sha256'], 'output_key': output_key,
        'output_sha256': hashlib.sha256(csv_bytes).hexdigest(),
        'generated_at_utc': datetime.now(timezone.utc).isoformat(),
        'database_publication': 'pending', 'clustering': 'not_performed',
        'safety_status': 'UNKNOWN', 'input_kind': manifest['input_kind'],
        'limitations': manifest.get('limitations', []),
    }
    client.put_object(Bucket=bucket, Key=output_key, Body=csv_bytes, ContentType='text/csv')
    client.put_object(Bucket=bucket, Key=output_key.rsplit('/', 1)[0]+'/manifest.json',
                      Body=json.dumps(report, allow_nan=False).encode('utf-8'), ContentType='application/json')
    return {'statusCode': 200, 'body': json.dumps(report, allow_nan=False)}
