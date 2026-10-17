import importlib.util
from datetime import date
from pathlib import Path
import unittest

import numpy as np
import pandas as pd
import xarray as xr

SPEC = importlib.util.spec_from_file_location('real_inputs', Path(__file__).resolve().parents[1]/'real_pelagic_inputs.py')
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


def fixture():
    coords = {'time': pd.date_range('2026-10-17', periods=1),
              'latitude': [10.0, 10.083333, 10.166666],
              'longitude': [123.0, 123.083333, 123.166666]}
    field = np.array([[[28., 30., 32.], [29., 31., 33.], [30., 32., 34.]]])
    physics = xr.Dataset({name: (('time', 'latitude', 'longitude'), field.copy() if name == 'thetao' else np.ones((1, 3, 3)))
                          for name in ['thetao', 'zos', 'uo', 'vo']}, coords=coords)
    for name, units in [('thetao', 'degrees_C'), ('zos', 'm'), ('uo', 'm s-1'), ('vo', 'm s-1')]:
        physics[name].attrs['units'] = units
    chlorophyll = xr.Dataset({'chl': (('time', 'latitude', 'longitude'), np.ones((1, 3, 3)))}, coords=coords)
    chlorophyll.chl.attrs['units'] = 'mg m-3'
    baseline = xr.Dataset({'monthly_sst': (('latitude', 'longitude'), np.full((3, 3), 27.)),
                           'sample_count': (('latitude', 'longitude'), np.full((3, 3), 341))},
                          coords={key: coords[key] for key in ['latitude', 'longitude']},
                          attrs={'month': 10, 'period_start': '2015-01-01', 'period_end': '2025-12-31'})
    return physics, chlorophyll, baseline


class RealInputChecks(unittest.TestCase):
    def prepare(self, values):
        return module.prepare_features(*values, date(2026, 10, 17))

    def test_grid_gradients_and_actual_monthly_anomaly_match_training_definition(self):
        frame = self.prepare(fixture())
        self.assertEqual(len(frame), 9)
        np.testing.assert_allclose(frame.sst_frontal_gradient, np.sqrt(5))
        np.testing.assert_allclose(frame.chl_frontal_gradient, 0)
        np.testing.assert_allclose(frame.sst_anomaly, frame.thetao-27)
        np.testing.assert_allclose(frame.chl_sst_ratio, frame.chl/frame.thetao)
        self.assertEqual(set(frame.detection_date), {'2026-10-17'})

    def test_original_dry_cell_stays_excluded_after_nearby_values_are_filled(self):
        values = fixture()
        values[0].thetao.values[0, 1, 1] = np.nan
        frame = self.prepare(values)
        self.assertEqual(len(frame), 8)
        self.assertFalse(((frame.grid_lat == 10.083333) & (frame.grid_lon == 123.083333)).any())

    def test_missing_baseline_cannot_be_replaced_with_a_zero_anomaly(self):
        values = fixture()
        values[2].monthly_sst.values[1, 1] = np.nan
        self.assertEqual(len(self.prepare(values)), 8)

    def test_zero_baseline_support_excludes_even_a_finite_placeholder(self):
        values = fixture()
        values[2].sample_count.values[1, 1] = 0
        self.assertEqual(len(self.prepare(values)), 8)

    def test_old_inputs_cannot_be_relabelled_as_today(self):
        values = fixture()
        values = (values[0].assign_coords(time=pd.date_range('2026-10-16', periods=1)), *values[1:])
        with self.assertRaisesRegex(ValueError, 'complete daily coverage'):
            self.prepare(values)

    def test_wrong_units_fail_instead_of_silently_scoring(self):
        values = fixture()
        values[0].thetao.attrs['units'] = 'K'
        with self.assertRaisesRegex(ValueError, 'units for thetao'):
            self.prepare(values)

    def test_missing_physical_variable_fails(self):
        values = fixture()
        with self.assertRaisesRegex(ValueError, 'actual physical input: uo'):
            self.prepare((values[0].drop_vars('uo'), *values[1:]))

    def test_wrong_baseline_month_fails(self):
        values = fixture()
        values[2].attrs['month'] = 7
        with self.assertRaisesRegex(ValueError, 'prediction month'):
            self.prepare(values)

    def test_float_rounding_can_align_but_geographic_gaps_stay_unknown(self):
        values = fixture()
        small = values[2].assign_coords(longitude=values[2].longitude+0.00002)
        self.assertEqual(len(self.prepare((*values[:2], small))), 9)
        large = values[2].assign_coords(longitude=values[2].longitude+0.001)
        with self.assertRaisesRegex(ValueError, 'No ocean cells'):
            self.prepare((*values[:2], large))

    def test_cell_edges_use_real_source_spacing(self):
        np.testing.assert_allclose(module.cell_edges([1., 2., 4.]), [0.5, 1.5, 3., 5.])
        with self.assertRaisesRegex(ValueError, 'increasing coordinates'):
            module.cell_edges([1., 1.])


if __name__ == '__main__':
    unittest.main()
