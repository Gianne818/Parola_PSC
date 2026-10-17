"""Reconstruct the notebook's historical reference and filter a fresh AWS run.

Clusters describe sampled historical boat-presence grid/day records. They are
neither today's fish locations nor calibrated catch observations. Prediction
coordinates remain the original scored environmental cell centers.
"""

import argparse
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path

import numpy as np
import pandas as pd

PARAMETERS = {'eps_radians': 0.001, 'min_samples': 15, 'metric': 'haversine',
              'algorithm': 'ball_tree', 'sample_limit': 100000, 'random_state': 42,
              'maximum_centroid_distance_km': 15.0, 'earth_radius_km': 6371.0}
METHOD = 'historical_dbscan_proximity_filter'


def sha256(raw):
    return hashlib.sha256(raw).hexdigest()


def build_reference(presence, source):
    # This is the filtering variant in zero-based notebook cell 8. Its 80% score
    # floor is replaced at scoring time by the user's requested inclusive 50%.
    from sklearn.cluster import DBSCAN
    import sklearn

    required = ['detection_date', 'grid_lat', 'grid_lon', 'presence', 'boat_count']
    if presence.empty or not set(required).issubset(presence.columns):
        raise ValueError('Historical positive presence data is required')
    dates = pd.to_datetime(presence.detection_date, errors='coerce')
    coords = presence[['grid_lat', 'grid_lon']].to_numpy(dtype=float)
    if (dates.isna().any() or not dates.between('2015-01-01', '2025-12-31').all()
            or not np.isfinite(coords).all() or not presence.presence.eq(1).all()
            or not presence.boat_count.ge(1).all()
            or not presence.grid_lat.between(-90, 90).all()
            or not presence.grid_lon.between(-180, 180).all()):
        raise ValueError('Historical dates, coordinates or positive labels are invalid')
    sampled = (presence.sample(n=PARAMETERS['sample_limit'], random_state=42)
               if len(presence) > PARAMETERS['sample_limit'] else presence).copy()
    # The notebook loads its historical coordinates as float32.
    sampled[['grid_lat', 'grid_lon']] = sampled[['grid_lat', 'grid_lon']].astype(np.float32)
    labels = DBSCAN(eps=0.001, min_samples=15, metric='haversine', algorithm='ball_tree').fit_predict(
        np.radians(sampled[['grid_lat', 'grid_lon']].values))
    sampled['cluster_id'] = labels
    clusters = sampled[sampled.cluster_id >= 0].groupby('cluster_id').agg(
        latitude=('grid_lat', 'mean'), longitude=('grid_lon', 'mean'),
        sampled_records=('grid_lat', 'size')).reset_index()
    if clusters.empty:
        raise ValueError('No historical clusters support a proximity-filtered run')
    raw = clusters.to_csv(index=False).encode()
    manifest = {'schema_version': 1, 'method': METHOD, 'parameters': PARAMETERS,
                'historical_period': ['2015-01-01', '2025-12-31'],
                'source': source, 'source_rows': len(presence), 'sampled_rows': len(sampled),
                'noise_rows': int((labels == -1).sum()), 'cluster_count': len(clusters),
                'clusters_sha256': sha256(raw), 'sklearn_version': sklearn.__version__,
                'generated_at_utc': datetime.now(timezone.utc).isoformat(),
                'limitations': ['reconstructed from surviving gridded presence, not the lost merged CSV',
                                'grid/day boat presence is not a verified catch',
                                'centroid proximity does not establish a navigable water route',
                                'original raw-detection QC fields are absent from this gridded table']}
    return raw, manifest


def load_reference(raw, manifest):
    if (manifest.get('schema_version') != 1 or manifest.get('method') != METHOD
            or manifest.get('parameters') != PARAMETERS
            or manifest.get('historical_period') != ['2015-01-01', '2025-12-31']
            or not manifest.get('source', {}).get('parquet_sha256')
            or sha256(raw) != manifest.get('clusters_sha256')):
        raise ValueError('Historical reference hash, provenance or notebook parameters differ')
    clusters = pd.read_csv(io.BytesIO(raw))
    required = ['cluster_id', 'latitude', 'longitude', 'sampled_records']
    if (not set(required).issubset(clusters.columns) or clusters.empty
            or len(clusters) != manifest.get('cluster_count')):
        raise ValueError('Historical cluster reference is empty or incomplete')
    numeric = clusters[required].to_numpy(dtype=float)
    if (not np.isfinite(numeric).all() or clusters.cluster_id.duplicated().any()
            or not clusters.cluster_id.ge(0).all()
            or not np.equal(clusters.cluster_id, np.floor(clusters.cluster_id)).all()
            or not clusters.sampled_records.ge(PARAMETERS['min_samples']).all()
            or not clusters.latitude.between(-90, 90).all()
            or not clusters.longitude.between(-180, 180).all()):
        raise ValueError('Historical cluster coordinates, identifiers or support are invalid')
    return clusters


def corroborate(candidates, clusters):
    if candidates.empty:
        raise ValueError('No scored candidates to corroborate')
    reference = np.radians(clusters[['latitude', 'longitude']].to_numpy(dtype=float))
    points = np.radians(candidates[['grid_lat', 'grid_lon']].to_numpy(dtype=float))
    nearest, distances = [], []
    for offset in range(0, len(points), 512):
        block = points[offset:offset+512]
        delta_lat = reference[:, 0] - block[:, 0, None]
        delta_lon = reference[:, 1] - block[:, 1, None]
        a = np.sin(delta_lat/2)**2 + np.cos(block[:, 0, None])*np.cos(reference[:, 0])*np.sin(delta_lon/2)**2
        km = 2*PARAMETERS['earth_radius_km']*np.arcsin(np.sqrt(np.clip(a, 0, 1)))
        index = km.argmin(axis=1)
        nearest.extend(clusters.cluster_id.to_numpy()[index])
        distances.extend(km[np.arange(len(block)), index])
    output = candidates.copy()
    output['historical_cluster_id'] = nearest
    output['km_to_nearest_hotspot'] = distances
    output = output[output.km_to_nearest_hotspot <= PARAMETERS['maximum_centroid_distance_km']].copy()
    output['is_historical_hotspot'] = True
    # Historical proximity is not DBSCAN membership of today's prediction grid.
    output['dbscan_cluster_id'] = -1
    output.sort_values(['catch_probability', 'grid_lat', 'grid_lon'],
                       ascending=[False, True, True], inplace=True)
    output['global_rank'] = range(1, len(output)+1)
    return output


def verify_filtered_run(client, bucket, report, raw):
    """Recompute selection from the hashed AWS scorer result before DB writes."""
    from validated_csv_handler import manila_day

    support = report.get('historical_support', {})
    if (report.get('clustering') != METHOD or report.get('prediction_date') != manila_day()
            or not support.get('manifest_key') or not report.get('source_scoring_manifest_key')):
        raise ValueError('A current historical-filtered run with source lineage is required')
    source = json.loads(client.get_object(Bucket=bucket, Key=report['source_scoring_manifest_key'])['Body'].read())
    if (source.get('prediction_date') != report['prediction_date']
            or source.get('model_sha256') != report.get('model_sha256')
            or source.get('input_sha256') != report.get('input_sha256')
            or source.get('minimum_score') != 0.5
            or source.get('clustering') != 'not_performed'
            or source.get('database_publication') != 'pending'):
        raise ValueError('Fresh AWS scoring lineage is invalid or withdrawn')
    original = client.get_object(Bucket=bucket, Key=source['output_key'])['Body'].read()
    if sha256(original) != source['output_sha256']:
        raise ValueError('Source AWS scoring CSV hash differs')
    ref_bytes = client.get_object(Bucket=bucket, Key=support['manifest_key'])['Body'].read()
    if sha256(ref_bytes) != support.get('manifest_sha256'):
        raise ValueError('Historical manifest hash differs')
    ref = json.loads(ref_bytes)
    ref_raw = client.get_object(Bucket=bucket, Key=ref['clusters_key'])['Body'].read()
    clusters = load_reference(ref_raw, ref)
    expected = corroborate(pd.read_csv(io.BytesIO(original)), clusters)
    if expected.empty or expected.to_csv(index=False).encode() != raw:
        raise ValueError('Published selection differs from historical corroboration')
    if sha256(raw) != report.get('output_sha256') or len(expected) != report.get('total_hotspots'):
        raise ValueError('Filtered output manifest differs')
    return expected


def main():
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest='command', required=True)
    build = commands.add_parser('build')
    build.add_argument('--presence-csv', type=Path, required=True)
    build.add_argument('--export-manifest', type=Path, required=True)
    build.add_argument('--directory', type=Path, required=True)
    apply = commands.add_parser('filter')
    apply.add_argument('--bucket', required=True)
    apply.add_argument('--source-manifest-key', required=True)
    apply.add_argument('--historical-manifest-key', required=True)
    apply.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    if args.command == 'build':
        source = json.loads(args.export_manifest.read_text())
        if sha256(args.presence_csv.read_bytes()) != source.get('csv_sha256'):
            raise ValueError('Exported historical presence hash differs')
        raw, manifest = build_reference(pd.read_csv(args.presence_csv), source)
        args.directory.mkdir(parents=True, exist_ok=True)
        (args.directory/'clusters.csv').write_bytes(raw)
        (args.directory/'manifest.json').write_text(json.dumps(manifest, indent=2, allow_nan=False)+'\n')
        print(json.dumps({key: manifest[key] for key in ['source_rows', 'sampled_rows', 'cluster_count', 'noise_rows']}))
        return
    import boto3
    from dotenv import load_dotenv
    from validated_csv_handler import manila_day
    load_dotenv(Path(__file__).resolve().parents[2]/'.env.local')
    client = boto3.client('s3', region_name='us-east-1')
    source = json.loads(client.get_object(Bucket=args.bucket, Key=args.source_manifest_key)['Body'].read())
    original = client.get_object(Bucket=args.bucket, Key=source['output_key'])['Body'].read()
    if source['prediction_date'] != manila_day() or sha256(original) != source['output_sha256']:
        raise ValueError('A verified current-day AWS scoring run is required')
    ref_bytes = client.get_object(Bucket=args.bucket, Key=args.historical_manifest_key)['Body'].read()
    ref = json.loads(ref_bytes)
    clusters = load_reference(client.get_object(Bucket=args.bucket, Key=ref['clusters_key'])['Body'].read(), ref)
    output = corroborate(pd.read_csv(io.BytesIO(original)), clusters)
    if output.empty:
        raise ValueError('No historically supported candidates; do not publish stale substitutes')
    report = dict(source)
    run_id = source['run_id']+'-history'
    output_key = f'inference-runs/pelagic/{source["prediction_date"]}/{run_id}/predictions.csv'
    raw = output.to_csv(index=False).encode()
    report.update(run_id=run_id, output_key=output_key, output_sha256=sha256(raw),
                  source_scoring_manifest_key=args.source_manifest_key, clustering=METHOD,
                  total_hotspots=len(output), scored_candidate_rows=len(pd.read_csv(io.BytesIO(original))),
                  additional_hotspots_below_60=int((output.catch_probability < 0.6).sum()),
                  generated_at_utc=datetime.now(timezone.utc).isoformat(),
                  historical_support={'manifest_key': args.historical_manifest_key,
                                      'manifest_sha256': sha256(ref_bytes), 'parameters': PARAMETERS})
    report['limitations'] = [*source.get('limitations', []), *ref.get('limitations', [])]
    verify_filtered_run(client, args.bucket, report, raw)
    client.put_object(Bucket=args.bucket, Key=output_key, Body=raw, ContentType='text/csv')
    client.put_object(Bucket=args.bucket, Key=output_key.rsplit('/', 1)[0]+'/manifest.json',
                      Body=json.dumps(report, indent=2, allow_nan=False).encode(), ContentType='application/json')
    args.report.write_text(json.dumps(report, indent=2, allow_nan=False)+'\n')
    print(json.dumps({key: report[key] for key in ['run_id', 'scored_candidate_rows', 'total_hotspots',
                                                 'additional_hotspots_below_60', 'output_key']}))


if __name__ == '__main__':
    main()
