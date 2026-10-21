import importlib.util
import os
from pathlib import Path
import unittest
from unittest.mock import patch

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('run_daily_predictions', ROOT / 'run_daily_predictions.py')
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class DailyPredictionsPipelineChecks(unittest.TestCase):
    def test_daily_prediction_toggle_defaults_to_enabled(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop('PAROLA_ENABLE_DAILY_PREDICTIONS', None)
            self.assertTrue(module.ENABLE_DAILY_PREDICTIONS)
            self.assertTrue(module.is_daily_prediction_enabled())

    def test_daily_prediction_can_be_disabled_via_code_constant(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop('PAROLA_ENABLE_DAILY_PREDICTIONS', None)
            with patch.object(module, 'ENABLE_DAILY_PREDICTIONS', False):
                self.assertFalse(module.is_daily_prediction_enabled())
                self.assertTrue(module.is_daily_prediction_enabled(force=True))
                res = module.run_pipeline(requested_today='2026-10-17')
                self.assertEqual(res['status'], 'skipped')
                self.assertEqual(res['reason'], 'daily_predictions_disabled')
                self.assertEqual(res['date'], '2026-10-17')

    def test_daily_prediction_can_be_disabled_via_env_or_event(self):
        for val in ('false', '0', 'no', 'off', 'disabled', 'FALSE'):
            with self.subTest(val=val), patch.dict(os.environ, {'PAROLA_ENABLE_DAILY_PREDICTIONS': val}):
                self.assertFalse(module.is_daily_prediction_enabled())
                res = module.lambda_handler({'date': '2026-10-17'}, None)
                self.assertEqual(res['status'], 'skipped')
                self.assertEqual(res['reason'], 'daily_predictions_disabled')

        with patch.dict(os.environ, {'PAROLA_ENABLE_DAILY_PREDICTIONS': 'true'}):
            res = module.lambda_handler({'date': '2026-10-17', 'enabled': False}, None)
            self.assertEqual(res['status'], 'skipped')

    def test_clean_database_url_removes_pgbouncer_param_only(self):
        raw = 'postgresql://user:pass@host:5432/postgres?pgbouncer=true&sslmode=require'
        self.assertEqual(
            module.clean_database_url(raw),
            'postgresql://user:pass@host:5432/postgres?sslmode=require',
        )
        raw_single = 'postgresql://user:pass@host:5432/postgres?pgbouncer=true'
        self.assertEqual(
            module.clean_database_url(raw_single),
            'postgresql://user:pass@host:5432/postgres',
        )

    def test_spatial_nms_retains_highest_local_peaks(self):
        df = pd.DataFrame({
            'grid_lat': [10.0, 10.05, 11.0],
            'grid_lon': [123.0, 123.05, 124.0],
            'catch_probability': [0.85, 0.90, 0.70],
        })
        peaks = module.spatial_nms(df, 'grid_lat', 'grid_lon', 'catch_probability', radius_km=16.5)
        self.assertEqual(peaks['catch_probability'].tolist(), [0.90, 0.70])

    def test_minimum_catch_probability_is_25_percent(self):
        self.assertEqual(module.MINIMUM_CATCH_PROBABILITY, 0.25)

    def test_compute_current_vector_cardinal_directions(self):
        # Current flowing North (u=0, v=1)
        speed, heading = module.compute_current_vector(0.0, 1.0)
        self.assertAlmostEqual(speed, 1.0)
        self.assertAlmostEqual(heading, 0.0)

        # Current flowing East (u=1, v=0)
        speed, heading = module.compute_current_vector(1.0, 0.0)
        self.assertAlmostEqual(speed, 1.0)
        self.assertAlmostEqual(heading, 90.0)

        # Current flowing South (u=0, v=-1)
        speed, heading = module.compute_current_vector(0.0, -1.0)
        self.assertAlmostEqual(speed, 1.0)
        self.assertAlmostEqual(heading, 180.0)

        # Current flowing West (u=-1, v=0)
        speed, heading = module.compute_current_vector(-1.0, 0.0)
        self.assertAlmostEqual(speed, 1.0)
        self.assertAlmostEqual(heading, 270.0)

        # Current flowing North-East (u=1, v=1)
        speed, heading = module.compute_current_vector(1.0, 1.0)
        self.assertAlmostEqual(speed, np.sqrt(2.0))
        self.assertAlmostEqual(heading, 45.0)

        # Current flowing North-West (u=-1, v=1)
        speed, heading = module.compute_current_vector(-1.0, 1.0)
        self.assertAlmostEqual(speed, np.sqrt(2.0))
        self.assertAlmostEqual(heading, 315.0)

        # Current flowing South-East (u=1, v=-1)
        speed, heading = module.compute_current_vector(1.0, -1.0)
        self.assertAlmostEqual(speed, np.sqrt(2.0))
        self.assertAlmostEqual(heading, 135.0)

        # Current flowing South-West (u=-1, v=-1)
        speed, heading = module.compute_current_vector(-1.0, -1.0)
        self.assertAlmostEqual(speed, np.sqrt(2.0))
        self.assertAlmostEqual(heading, 225.0)

        # Zero velocity
        speed, heading = module.compute_current_vector(0.0, 0.0)
        self.assertAlmostEqual(speed, 0.0)
        self.assertAlmostEqual(heading, 0.0)


if __name__ == '__main__':
    unittest.main()
