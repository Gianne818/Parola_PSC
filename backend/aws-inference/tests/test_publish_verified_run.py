import hashlib
import importlib.util
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import publish_verified_run as module
from test_validated_csv_handler import Model, Storage
from validated_csv_handler import score


class Transaction:
    def __init__(self, existing=(), invalid_cells=0):
        self.existing = existing
        self.invalid_cells = invalid_cells
        self.commits = self.rollbacks = 0

    def __enter__(self):
        return self

    def __exit__(self, kind, value, traceback):
        if kind:
            self.rollbacks += 1
        else:
            self.commits += 1

    def cursor(self):
        return Cursor(self)


class Cursor:
    def __init__(self, connection):
        self.connection = connection

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def execute(self, query, parameters):
        if any(word in query.upper() for word in ['DELETE ', 'UPDATE ', 'DROP ', 'TRUNCATE ']):
            raise AssertionError('Publication must preserve existing work')

    def fetchall(self):
        return self.connection.existing

    def fetchone(self):
        return (2, 0.5, 0.55, 2, self.connection.invalid_cells)


class PublicationChecks(unittest.TestCase):
    def setUp(self):
        self.storage = Storage()
        self.output = score(self.storage.frame, Model([0.49, 0.5, 0.55]))
        self.raw = self.output.to_csv(index=False).encode()
        self.report = {'output_sha256': hashlib.sha256(self.raw).hexdigest(),
                       'total_hotspots': 2, 'prediction_date': '2026-10-17'}

    def test_valid_output_preserves_the_exact_real_features_and_cells(self):
        output = module.validate_output(self.raw, self.report, self.storage.frame)
        self.assertEqual(len(output), 2)

    def test_output_cannot_invent_a_coordinate_or_cell_boundary(self):
        for field in ['grid_lon', 'cell_west', 'thetao']:
            output = self.output.copy()
            output.loc[output.index[0], field] += 0.001
            raw = output.to_csv(index=False).encode()
            report = dict(self.report, output_sha256=hashlib.sha256(raw).hexdigest())
            with self.subTest(field=field), self.assertRaises(ValueError):
                module.validate_output(raw, report, self.storage.frame)

    def test_a_fresh_run_commits_only_after_postgis_verification(self):
        connection = Transaction()
        with patch.object(module, 'execute_values', return_value=[(101,), (102,)]) as insert:
            result = module.publish(connection, self.output, '2026-10-17')
        self.assertEqual(connection.commits, 1)
        self.assertEqual(connection.rollbacks, 0)
        self.assertEqual(result['prediction_ids'], [101, 102])
        self.assertEqual(len(insert.call_args.args[2]), 2)

    def test_invalid_stored_cell_rolls_back_the_entire_run(self):
        connection = Transaction(invalid_cells=1)
        with patch.object(module, 'execute_values', return_value=[(101,), (102,)]):
            with self.assertRaisesRegex(ValueError, 'transaction rolled back'):
                module.publish(connection, self.output, '2026-10-17')
        self.assertEqual(connection.commits, 0)
        self.assertEqual(connection.rollbacks, 1)

    def test_different_existing_predictions_are_preserved(self):
        connection = Transaction(existing=[(99, 10., 120., 0.99, 1., 1., 119., 9., 121., 11.)])
        with patch.object(module, 'execute_values') as insert:
            with self.assertRaisesRegex(ValueError, 'preserved without modification'):
                module.publish(connection, self.output, '2026-10-17')
        insert.assert_not_called()
        self.assertEqual(connection.rollbacks, 1)


if __name__ == '__main__':
    unittest.main()
