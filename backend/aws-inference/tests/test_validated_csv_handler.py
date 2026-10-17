from datetime import datetime, timezone
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import unittest
from unittest.mock import patch

import numpy as np
import pandas as pd

SPEC = importlib.util.spec_from_file_location('validated_handler', Path(__file__).resolve().parents[1]/'validated_csv_handler.py')
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class Model:
    def __init__(self, scores):
        self.scores = scores

    def feature_name(self):
        return module.FEATURES

    def predict(self, frame):
        return np.asarray(self.scores)


class Storage:
    def __init__(self):
        self.uploads = []
        self.frame = pd.DataFrame({key: [1., 1., 1.] for key in module.FEATURES})
        for key, value in {'month': 10, 'detection_date': '2026-10-17', 'grid_lat': 10.,
                           'cell_south': 9.96, 'cell_north': 10.04}.items():
            self.frame[key] = value
        self.frame['grid_lon'] = [123., 123.083333, 123.166666]
        self.frame['cell_west'] = self.frame.grid_lon-0.04
        self.frame['cell_east'] = self.frame.grid_lon+0.04
        self.csv = self.frame.to_csv(index=False).encode()
        self.model = b'fixture model only'
        self.manifest = {'schema_version': 1, 'prediction_date': '2026-10-17',
                         'input_kind': 'copernicus_analysis_forecast', 'features': module.FEATURES,
                         'source_lineage': {'fixture': True}, 'baseline_period': ['2015-01-01', '2025-12-31'],
                         'baseline_month': 10, 'row_count': 3,
                         'input_sha256': hashlib.sha256(self.csv).hexdigest(),
                         'model_sha256': hashlib.sha256(self.model).hexdigest()}

    def get_object(self, Bucket, Key):
        if Key.endswith('manifest.json'):
            body = json.dumps(self.manifest).encode()
        elif Key.endswith('features.csv'):
            body = self.csv
        elif Key == module.MODEL_KEY:
            body = self.model
        else:
            raise KeyError(Key)
        return {'Body': io.BytesIO(body)}

    def put_object(self, **kwargs):
        self.uploads.append(kwargs)


class ValidatedInferenceChecks(unittest.TestCase):
    def test_manila_day_changes_before_utc_midnight(self):
        self.assertEqual(module.manila_day(datetime(2026, 10, 16, 18, tzinfo=timezone.utc)), '2026-10-17')
        with self.assertRaisesRegex(ValueError, 'aware'):
            module.manila_day(datetime(2026, 10, 17))

    def test_50_percent_is_inclusive_and_higher_scores_are_not_rescaled(self):
        frame = pd.DataFrame({key: np.ones(6) for key in module.FEATURES})
        frame['grid_lat'] = 10.
        frame['grid_lon'] = np.arange(6)+120.
        scores = [0., 0.499999, 0.5, 0.55, 0.6, 1.]
        result = module.score(frame, Model(scores))
        self.assertEqual(result.catch_probability.tolist(), [1., 0.6, 0.55, 0.5])
        self.assertEqual(set(result.dbscan_cluster_id), {-1})
        self.assertEqual(set(result.safety_status), {'UNKNOWN'})
        self.assertEqual(result.global_rank.tolist(), [1, 2, 3, 4])

    def test_nonfinite_or_out_of_range_scores_fail(self):
        frame = Storage().frame
        for scores in ([0.5, np.nan, 0.7], [0.5, -0.1, 0.7], [0.5, 1.1, 0.7], [0.5]):
            with self.subTest(scores=scores), self.assertRaisesRegex(ValueError, 'invalid scores'):
                module.score(frame, Model(scores))

    def test_feature_order_is_verified_against_the_loaded_model(self):
        model = Model([0.5, 0.6, 0.7])
        model.feature_name = lambda: list(reversed(module.FEATURES))
        with self.assertRaisesRegex(ValueError, 'feature order'):
            module.score(Storage().frame, model)

    def test_valid_inputs_preserve_real_coordinates(self):
        storage = Storage()
        frame, _ = module.load_real_inputs(storage, 'fixture', '2026-10-17')
        self.assertEqual(frame.grid_lon.tolist(), storage.frame.grid_lon.tolist())

    def test_manifest_and_csv_date_mismatches_fail(self):
        for change in ['manifest', 'csv']:
            storage = Storage()
            if change == 'manifest':
                storage.manifest['prediction_date'] = '2026-07-10'
            else:
                storage.frame['detection_date'] = '2026-07-10'
                storage.csv = storage.frame.to_csv(index=False).encode()
                storage.manifest['input_sha256'] = hashlib.sha256(storage.csv).hexdigest()
            with self.subTest(change=change), self.assertRaises(ValueError):
                module.load_real_inputs(storage, 'fixture', '2026-10-17')

    def test_csv_hash_detects_changed_input_content(self):
        storage = Storage()
        storage.csv += b'\n'
        with self.assertRaisesRegex(ValueError, 'hash'):
            module.load_real_inputs(storage, 'fixture', '2026-10-17')

    def test_missing_provenance_fails(self):
        storage = Storage()
        storage.manifest['source_lineage'] = {}
        with self.assertRaisesRegex(ValueError, 'real-input manifest'):
            module.load_real_inputs(storage, 'fixture', '2026-10-17')

    def test_model_hash_failure_never_uploads_output(self):
        storage = Storage()
        storage.manifest['model_sha256'] = 'incorrect'
        with patch.object(module.boto3, 'client', return_value=storage), patch.object(module, 'manila_day', return_value='2026-10-17'), patch.dict(os.environ, {'MODEL_BUCKET_NAME': 'fixture'}):
            with self.assertRaisesRegex(ValueError, 'Deployed model differs'):
                module.handler({}, None)
        self.assertEqual(storage.uploads, [])

    def test_success_reports_exact_output_and_keeps_database_publication_pending(self):
        storage = Storage()
        with patch.object(module.boto3, 'client', return_value=storage), patch.object(module.lgb, 'Booster', return_value=Model([0.49, 0.5, 0.55])), patch.object(module, 'manila_day', return_value='2026-10-17'), patch.dict(os.environ, {'MODEL_BUCKET_NAME': 'fixture'}):
            result = module.handler({}, None)
        report = json.loads(result['body'])
        self.assertEqual(report['total_hotspots'], 2)
        self.assertEqual(report['additional_hotspots_below_60'], 2)
        self.assertEqual(report['database_publication'], 'pending')
        self.assertEqual(len(storage.uploads), 2)
        self.assertEqual(report['output_sha256'], hashlib.sha256(storage.uploads[0]['Body']).hexdigest())
        self.assertTrue(storage.uploads[0]['Key'].startswith('inference-runs/pelagic/2026-10-17/'))
        self.assertNotIn('advisories/parola_daily_advisories.csv', [item['Key'] for item in storage.uploads])


if __name__ == '__main__':
    unittest.main()
