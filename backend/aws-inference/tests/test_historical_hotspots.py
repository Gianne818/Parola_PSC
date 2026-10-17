import hashlib
import io
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import historical_hotspots as module
from validated_csv_handler import score
from test_validated_csv_handler import Model, Storage


class HistoricalSupportChecks(unittest.TestCase):
    def setUp(self):
        self.clusters = pd.DataFrame({'cluster_id': [7], 'latitude': [10.],
                                      'longitude': [123.], 'sampled_records': [15]})
        self.raw = self.clusters.to_csv(index=False).encode()
        self.manifest = {'schema_version': 1, 'method': module.METHOD,
                         'parameters': module.PARAMETERS, 'historical_period': ['2015-01-01', '2025-12-31'],
                         'source': {'parquet_sha256': 'fixture-only'}, 'cluster_count': 1,
                         'clusters_sha256': module.sha256(self.raw)}

    def test_nearby_support_filters_without_moving_coordinates_or_changing_scores(self):
        frame = Storage().frame
        candidates = score(frame, Model([0.5, 0.55, 0.8]))
        output = module.corroborate(candidates, self.clusters)
        self.assertEqual(output.catch_probability.tolist(), [0.55, 0.5])
        self.assertEqual(output.grid_lon.tolist(), [123.083333, 123.])
        self.assertEqual(output.global_rank.tolist(), [1, 2])
        self.assertEqual(output.historical_cluster_id.tolist(), [7, 7])
        self.assertEqual(set(output.dbscan_cluster_id), {-1})
        self.assertTrue(output.is_historical_hotspot.all())
        self.assertLess(output.km_to_nearest_hotspot.max(), 15)

    def test_no_local_support_does_not_manufacture_a_prediction(self):
        candidates = score(Storage().frame, Model([0.5, 0.55, 0.8]))
        distant = self.clusters.assign(longitude=130.)
        self.assertTrue(module.corroborate(candidates, distant).empty)

    def test_invalid_reference_parameters_hash_or_support_fail_closed(self):
        for manifest in [dict(self.manifest, parameters={}),
                         dict(self.manifest, clusters_sha256='changed'),
                         dict(self.manifest, source={})]:
            with self.assertRaises(ValueError):
                module.load_reference(self.raw, manifest)
        raw = self.clusters.assign(sampled_records=14).to_csv(index=False).encode()
        with self.assertRaisesRegex(ValueError, 'support'):
            module.load_reference(raw, dict(self.manifest, clusters_sha256=module.sha256(raw)))

    def storage(self):
        source_raw = score(Storage().frame, Model([0.5, 0.55, 0.8])).to_csv(index=False).encode()
        source = {'prediction_date': '2026-10-17', 'model_sha256': 'model',
                  'input_sha256': 'inputs', 'minimum_score': 0.5,
                  'clustering': 'not_performed', 'database_publication': 'pending',
                  'output_key': 'source.csv', 'output_sha256': module.sha256(source_raw)}
        manifest = dict(self.manifest, clusters_key='clusters.csv')
        reference_raw = json.dumps(manifest).encode()
        files = {'source.json': json.dumps(source).encode(), 'source.csv': source_raw,
                 'reference.json': reference_raw, 'clusters.csv': self.raw}
        class Client:
            def get_object(self, Bucket, Key):
                return {'Body': io.BytesIO(files[Key])}
        output_raw = module.corroborate(pd.read_csv(io.BytesIO(source_raw)), self.clusters).to_csv(index=False).encode()
        report = {'clustering': module.METHOD, 'prediction_date': '2026-10-17',
                  'model_sha256': 'model', 'input_sha256': 'inputs',
                  'source_scoring_manifest_key': 'source.json', 'total_hotspots': 2,
                  'output_sha256': module.sha256(output_raw),
                  'historical_support': {'manifest_key': 'reference.json',
                                         'manifest_sha256': module.sha256(reference_raw)}}
        return Client(), files, source, report, output_raw

    def test_independent_reselection_verifies_aws_lineage(self):
        client, _, _, report, raw = self.storage()
        with patch('validated_csv_handler.manila_day', return_value='2026-10-17'):
            self.assertEqual(len(module.verify_filtered_run(client, 'fixture', report, raw)), 2)

    def test_changed_scores_cannot_be_published_even_with_a_matching_new_output_hash(self):
        client, _, _, report, raw = self.storage()
        frame = pd.read_csv(io.BytesIO(raw))
        frame.loc[0, 'catch_probability'] = 0.99
        changed = frame.to_csv(index=False).encode()
        report['output_sha256'] = module.sha256(changed)
        with patch('validated_csv_handler.manila_day', return_value='2026-10-17'):
            with self.assertRaisesRegex(ValueError, 'selection differs'):
                module.verify_filtered_run(client, 'fixture', report, changed)

    def test_old_day_or_withdrawn_scoring_run_cannot_be_used(self):
        client, files, source, report, raw = self.storage()
        with patch('validated_csv_handler.manila_day', return_value='2026-10-18'):
            with self.assertRaises(ValueError):
                module.verify_filtered_run(client, 'fixture', report, raw)
        source['database_publication'] = {'status': 'withdrawn'}
        files['source.json'] = json.dumps(source).encode()
        with patch('validated_csv_handler.manila_day', return_value='2026-10-17'):
            with self.assertRaisesRegex(ValueError, 'withdrawn'):
                module.verify_filtered_run(client, 'fixture', report, raw)


if __name__ == '__main__':
    unittest.main()
