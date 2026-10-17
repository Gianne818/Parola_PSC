"""Rebuild real pelagic inputs using the original Parola Copernicus notebook.

The notebook's gradients are per grid index, not per kilometre. Preserve that
definition for the existing model. This produces environmental model inputs,
not calibrated catch probabilities or maritime permission.
"""

import argparse
import calendar
from datetime import date, datetime, timezone
import hashlib
import json
import logging
import os
from pathlib import Path
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd
import xarray as xr


FEATURES = [
    'thetao', 'zos', 'uo', 'vo', 'chl', 'sst_frontal_gradient',
    'chl_frontal_gradient', 'sst_anomaly', 'month', 'chl_sst_ratio',
]
FIELDS = ['thetao', 'zos', 'uo', 'vo', 'chl']
BOUNDS = {'minimum_longitude': 116.0, 'maximum_longitude': 131.0,
          'minimum_latitude': 2.0, 'maximum_latitude': 23.0}
HISTORICAL = ('cmems_mod_glo_phy_my_0.083deg_P1D-m', '202311')
SOURCES = {
    'temperature': ('cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m', '202406', ['thetao']),
    'currents': ('cmems_mod_glo_phy-cur_anfc_0.083deg_P1D-m', '202406', ['uo', 'vo']),
    'sea_level': ('cmems_mod_glo_phy_anfc_0.083deg_P1D-m', '202406', ['zos']),
    'chlorophyll': ('cmems_mod_glo_bgc-pft_anfc_0.25deg_P1D-m', '202311', ['chl']),
}


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write_json(path, value):
    Path(path).write_text(json.dumps(value, indent=2, allow_nan=False) + '\n')


def surface(dataset):
    for dimension in ('depth', 'elevation'):
        if dimension in dataset.dims:
            if dataset.sizes[dimension] != 1:
                raise ValueError('Expected exactly one surface layer')
            dataset = dataset.squeeze(dimension, drop=True)
    return dataset.transpose('time', 'latitude', 'longitude')


def validate_times(dataset, start, end):
    actual = pd.DatetimeIndex(dataset.time.values)
    expected = pd.date_range(start, end, freq='D')
    if not actual.equals(expected):
        raise ValueError(f'Expected complete daily coverage from {start} to {end}')


def fetch(path, dataset_id, version, variables, start, end):
    """Cache only complete, hashed requests. No fallback or date substitution."""
    import copernicusmarine

    request = {'dataset_id': dataset_id, 'dataset_version': version,
               'variables': variables, 'start': start, 'end': end, 'bounds': BOUNDS,
               'surface_depth_range_m': [0.0, 1.0] if variables != ['zos'] else None}
    metadata_path = path.with_suffix('.request.json')
    if path.exists() and metadata_path.exists():
        metadata = json.loads(metadata_path.read_text())
        if metadata.get('request') == request and metadata.get('sha256') == sha256(path):
            dataset = xr.load_dataset(path)
            validate_times(dataset, start, end)
            return dataset, metadata
    kwargs = dict(dataset_id=dataset_id, dataset_version=version, variables=variables,
                  start_datetime=start+'T00:00:00', end_datetime=end+'T23:59:59',
                  username=os.environ['COPERNICUS_USERNAME'],
                  password=os.environ['COPERNICUS_PASSWORD'], **BOUNDS)
    if variables != ['zos']:
        kwargs.update(minimum_depth=0.0, maximum_depth=1.0)
    dataset = surface(copernicusmarine.open_dataset(**kwargs)).load()
    validate_times(dataset, start, end)
    dataset.to_netcdf(path)
    metadata = {'request': request, 'sha256': sha256(path),
                'retrieved_at_utc': datetime.now(timezone.utc).isoformat()}
    write_json(metadata_path, metadata)
    return dataset, metadata


def fill_spatial(field, limit):
    return field.interpolate_na(dim='longitude', method='nearest', limit=limit).interpolate_na(
        dim='latitude', method='nearest', limit=limit)


def monthly_baseline(month, directory):
    """Same daily-weighted, filled 2015–2025 monthly mean as notebook cell 11."""
    frames, lineage = [], []
    for year in range(2015, 2026):
        start = f'{year}-{month:02d}-01'
        end = f'{year}-{month:02d}-{calendar.monthrange(year, month)[1]:02d}'
        print(f'Rebuilding baseline: {start} to {end}', flush=True)
        dataset, metadata = fetch(directory/f'historical-thetao-{year}-{month:02d}.nc',
                                  *HISTORICAL, ['thetao'], start, end)
        if dataset.thetao.attrs.get('units') not in {'degrees_C', 'degree_Celsius', 'degC'}:
            raise ValueError('Historical temperature is not documented in degrees Celsius')
        frames.append(fill_spatial(dataset.thetao, 2))
        lineage.append(metadata)
    history = xr.concat(frames, dim='time', join='exact')
    baseline = xr.Dataset({'monthly_sst': history.mean('time', skipna=True),
                           'sample_count': history.count('time')})
    baseline.attrs.update(month=month, period_start='2015-01-01', period_end='2025-12-31',
                          dataset_id=HISTORICAL[0], dataset_version=HISTORICAL[1],
                          fill_method='nearest longitude then latitude, limit=2',
                          reconstruction='original notebook method; original file unavailable')
    path = directory/f'sst-climatology-2015-2025-month-{month:02d}.nc'
    baseline.to_netcdf(path)
    return baseline, path, lineage


def align_baseline(baseline, physics):
    # Archive and forecast grids have float-coordinate rounding differences.
    # Snap only within 0.0001 degrees; never fill a missing climatology with zero.
    return baseline.reindex(latitude=physics.latitude, longitude=physics.longitude,
                            method='nearest', tolerance=0.0001)


def cell_edges(coordinates):
    coordinates = np.asarray(coordinates, dtype=float)
    if len(coordinates) < 2 or not np.isfinite(coordinates).all() or not (np.diff(coordinates) > 0).all():
        raise ValueError('Source grid must have finite increasing coordinates')
    middle = (coordinates[1:] + coordinates[:-1]) / 2
    return np.r_[coordinates[0]-(middle[0]-coordinates[0]), middle,
                 coordinates[-1]+(coordinates[-1]-middle[-1])]


def prepare_features(physics, chlorophyll, baseline, day):
    if (baseline.attrs.get('month') != day.month
            or baseline.attrs.get('period_start') != '2015-01-01'
            or baseline.attrs.get('period_end') != '2025-12-31'):
        raise ValueError('Climatology must match the prediction month and training baseline period')
    for field in ['thetao', 'zos', 'uo', 'vo']:
        if field not in physics:
            raise ValueError(f'Missing actual physical input: {field}')
    if 'chl' not in chlorophyll:
        raise ValueError('Missing actual chlorophyll input')
    for dataset in (physics, chlorophyll):
        validate_times(dataset, day.isoformat(), day.isoformat())
    expected_units = {'thetao': {'degrees_C', 'degree_Celsius', 'degC'}, 'zos': {'m'},
                      'uo': {'m s-1', 'm/s'}, 'vo': {'m s-1', 'm/s'}, 'chl': {'mg m-3', 'mg/m^3'}}
    for field, units in expected_units.items():
        dataset = chlorophyll if field == 'chl' else physics
        if dataset[field].attrs.get('units') not in units:
            raise ValueError(f'Unexpected or missing units for {field}')
    physics = physics.copy(deep=True)
    ocean = np.isfinite(physics.thetao)
    physics['chl'] = chlorophyll.chl.interp(latitude=physics.latitude,
                                           longitude=physics.longitude, method='linear')
    for field in FIELDS:
        physics[field] = fill_spatial(physics[field], 6)
    for field, output in [('thetao', 'sst_frontal_gradient'), ('chl', 'chl_frontal_gradient')]:
        gradient_lat, gradient_lon = np.gradient(physics[field].values, axis=(-2, -1))
        physics[output] = (('time', 'latitude', 'longitude'), np.hypot(gradient_lat, gradient_lon))
    climatology = align_baseline(baseline, physics)
    physics['sst_anomaly'] = physics.thetao-climatology.monthly_sst.where(climatology.sample_count > 0)
    physics['is_ocean'] = ocean
    frame = physics.to_dataframe().reset_index()
    frame = frame[frame.is_ocean].copy()
    frame.rename(columns={'latitude': 'grid_lat', 'longitude': 'grid_lon'}, inplace=True)
    frame['month'] = day.month
    frame['detection_date'] = day.isoformat()
    frame['chl_sst_ratio'] = frame.chl/frame.thetao
    frame = frame[np.isfinite(frame[FEATURES]).all(axis=1)].copy()
    lon_edges, lat_edges = cell_edges(physics.longitude), cell_edges(physics.latitude)
    x = np.searchsorted(physics.longitude.values, frame.grid_lon)
    y = np.searchsorted(physics.latitude.values, frame.grid_lat)
    frame['cell_west'], frame['cell_east'] = lon_edges[x], lon_edges[x+1]
    frame['cell_south'], frame['cell_north'] = lat_edges[y], lat_edges[y+1]
    if frame.empty:
        raise ValueError('No ocean cells have all required real inputs and climatology')
    return frame[['detection_date', 'grid_lat', 'grid_lon', *FEATURES,
                  'cell_west', 'cell_south', 'cell_east', 'cell_north']]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--date', default=datetime.now(ZoneInfo('Asia/Manila')).date().isoformat())
    parser.add_argument('--directory', type=Path, required=True)
    parser.add_argument('--model', type=Path, required=True)
    args = parser.parse_args()
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[2]/'.env.local')
    logging.getLogger('copernicusmarine').setLevel(logging.WARNING)
    day = date.fromisoformat(args.date)
    args.directory.mkdir(parents=True, exist_ok=True)
    baseline, baseline_path, history = monthly_baseline(day.month, args.directory)
    inputs, lineage = {}, {}
    for name, (identifier, version, variables) in SOURCES.items():
        print(f'Downloading actual daily {name}: {day}', flush=True)
        inputs[name], lineage[name] = fetch(args.directory/f'{day}-{name}.nc', identifier,
                                            version, variables, day.isoformat(), day.isoformat())
    physics = xr.merge([inputs[name] for name in ('temperature', 'currents', 'sea_level')], join='exact')
    frame = prepare_features(physics, inputs['chlorophyll'], baseline, day)
    output = args.directory/f'{day}-pelagic-inputs.csv'
    frame.to_csv(output, index=False)
    manifest = {'schema_version': 1, 'prediction_date': day.isoformat(),
                'input_kind': 'copernicus_analysis_forecast', 'input_sha256': sha256(output),
                'model_sha256': sha256(args.model), 'row_count': len(frame), 'features': FEATURES,
                'generated_at_utc': datetime.now(timezone.utc).isoformat(),
                'source_time_utc': str(physics.time.values[0]), 'source_lineage': lineage,
                'baseline_sha256': sha256(baseline_path), 'baseline_lineage': history,
                'baseline_period': ['2015-01-01', '2025-12-31'], 'baseline_month': day.month,
                'gradient_units': 'per source-grid index, matching original training notebook',
                'ocean_mask': 'finite source surface thetao before any interpolation',
                'scope': 'study rectangle; not an authoritative marine jurisdiction boundary',
                'limitations': ['proxy model score; catch probability calibration unverified',
                               'coarse model wet mask is not a navigational coastline',
                               'historical baseline reconstructed; original file unavailable']}
    write_json(output.with_suffix('.manifest.json'), manifest)
    print(json.dumps({'input_csv': str(output), 'rows': len(frame), 'baseline': str(baseline_path)}, indent=2))


if __name__ == '__main__':
    main()
