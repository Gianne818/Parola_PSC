"""Coordinate/date/CSV checks with fake sessions; no real database or network."""
import asyncio
import contextlib
import importlib.util
import json
import subprocess
import types
import importlib
import io
import sys
import tempfile
import unittest
from datetime import date, datetime, timezone
from pathlib import Path
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pydantic import ValidationError
from schemas import DailyGridPredictionItem


class PredictionCoordinateTests(unittest.TestCase):
    def test_rejects_out_of_range_nonfinite_and_swapped_coordinates(self):
        for fields in ({'lat': 91}, {'lat': -91}, {'lon': 181}, {'lon': -181},
                       {'lat': float('nan')}, {'lon': float('inf')}, {'lat': True},
                       {'lat': '14.1'}, {'lat': 122.9, 'lon': 14.1}):
            with self.subTest(fields=fields), self.assertRaises(ValidationError):
                DailyGridPredictionItem(prediction_date='2026-10-17', catch_probability=0.8,
                                        **({'lat': 14.1, 'lon': 122.9} | fields))

    def test_accepts_numeric_zero_and_both_habitats_without_a_land_rule(self):
        for model in ('pelagic', 'demersal'):
            item = DailyGridPredictionItem(prediction_date='2026-10-17', lat=0, lon=0,
                                           model_type=model, catch_probability=0.8)
            self.assertEqual((item.lat, item.lon), (0.0, 0.0))
            self.assertEqual(item.model_type, model)

    def test_rejects_ambiguous_invalid_or_timestamp_dates(self):
        for value in ('17/10/2026', '2026-02-30', '20261017', '2026-10-17T00:00:00Z', 1792195200, None):
            with self.subTest(value=value), self.assertRaises(ValidationError):
                DailyGridPredictionItem(prediction_date=value, lat=14.1, lon=122.9, catch_probability=0.8)


class ManilaCalendarTests(unittest.TestCase):
    def test_midnight_uses_manila_even_when_server_date_is_still_yesterday(self):
        from calendar_dates import manila_today
        self.assertEqual(manila_today(datetime(2026, 10, 16, 15, 59, tzinfo=timezone.utc)), date(2026, 10, 16))
        self.assertEqual(manila_today(datetime(2026, 10, 16, 16, 0, tzinfo=timezone.utc)), date(2026, 10, 17))
        self.assertEqual(manila_today(datetime(2026, 10, 16, 23, 59, tzinfo=timezone.utc)), date(2026, 10, 17))

    def test_naive_clock_input_is_rejected(self):
        from calendar_dates import manila_today
        with self.assertRaises(ValueError):
            manila_today(datetime(2026, 10, 17))


class CsvIngestionTests(unittest.TestCase):
    def setUp(self):
        self.loader = importlib.import_module('ingest_predictions')
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.csv = Path(self.temp.name) / 'predictions.csv'
        self.db = Mock()
        self.factory = Mock(return_value=self.db)

    def write(self, rows):
        self.csv.write_text('global_rank,grid_lat,grid_lon,catch_probability,thetao,chl\n' + rows, encoding='utf-8')

    def test_valid_input_is_committed_once_with_correct_coordinate_order(self):
        self.write('1,14.1,122.9,0.8,28,0.4\n2,0,0,0.7,,\n')
        with contextlib.redirect_stdout(io.StringIO()) as output:
            count = self.loader.ingest_csv(str(self.csv), '2026-10-17', session_factory=self.factory)
        self.assertEqual(count, 2)
        self.db.commit.assert_called_once()
        self.db.rollback.assert_not_called()
        values = self.db.execute.call_args_list[0].args[1]
        self.assertEqual((values['lat'], values['lon'], values['p_date']), (14.1, 122.9, date(2026, 10, 17)))
        self.assertIsNone(self.db.execute.call_args_list[1].args[1]['sst'])
        self.assertIn('Successfully ingested 2', output.getvalue())
        self.db.close.assert_called_once()

    def test_invalid_later_row_never_opens_or_writes_database(self):
        for row in ('2,122.9,14.1,0.7,,\n', '2,nan,122.9,0.7,,\n', '2,14.1,inf,0.7,,\n'):
            self.write('1,14.1,122.9,0.8,,\n' + row)
            with self.subTest(row=row), self.assertRaises(self.loader.IngestionError):
                self.loader.ingest_csv(str(self.csv), '2026-10-17', session_factory=self.factory)
            self.factory.assert_not_called()

    def test_missing_columns_empty_file_and_invalid_date_fail_before_database(self):
        for content, value in [('grid_lat,grid_lon\n14,122\n', '2026-10-17'),
                               ('global_rank,grid_lat,grid_lon,catch_probability\n', '2026-10-17'),
                               ('global_rank,grid_lat,grid_lon,catch_probability\n1,14,122,0.8\n', '2026-02-30')]:
            self.csv.write_text(content, encoding='utf-8')
            with self.subTest(content=content), self.assertRaises(self.loader.IngestionError):
                self.loader.ingest_csv(str(self.csv), value, session_factory=self.factory)
            self.factory.assert_not_called()

    def test_default_date_is_shared_manila_date(self):
        self.write('1,14.1,122.9,0.8,,\n')
        with patch.object(self.loader, 'manila_today', return_value=date(2026, 10, 17)), contextlib.redirect_stdout(io.StringIO()):
            self.loader.ingest_csv(str(self.csv), session_factory=self.factory)
        self.assertEqual(self.db.execute.call_args.args[1]['p_date'], date(2026, 10, 17))

    def test_execute_or_commit_failure_rolls_back_closes_and_never_reports_success(self):
        self.write('1,14.1,122.9,0.8,,\n')
        for operation in ('execute', 'commit'):
            self.db.reset_mock(side_effect=True)
            getattr(self.db, operation).side_effect = RuntimeError('postgresql://private-secret@db')
            with self.subTest(operation=operation), contextlib.redirect_stdout(io.StringIO()) as output:
                with self.assertRaises(self.loader.IngestionError) as raised:
                    self.loader.ingest_csv(str(self.csv), '2026-10-17', session_factory=self.factory)
                self.assertNotIn('private-secret', str(raised.exception))
                self.assertNotIn('Successfully', output.getvalue())
            self.db.rollback.assert_called_once()
            self.db.close.assert_called_once()

    def test_cli_failure_has_nonzero_exit_and_redacted_stderr(self):
        with patch.object(self.loader, 'ingest_csv', side_effect=self.loader.IngestionError('Invalid CSV input.')):
            with contextlib.redirect_stderr(io.StringIO()) as error:
                self.assertEqual(self.loader.main(['fixture.csv']), 1)
            self.assertIn('Invalid CSV input', error.getvalue())

    def test_missing_file_never_opens_database(self):
        with self.assertRaises(self.loader.IngestionError):
            self.loader.ingest_csv(str(self.csv), session_factory=self.factory)
        self.factory.assert_not_called()


class ApiWiringTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        database = types.ModuleType('database')
        database.get_db = lambda: None
        models = types.ModuleType('models')
        models.DailyGridPrediction = lambda **values: types.SimpleNamespace(**values)
        path = Path(__file__).resolve().parents[1] / 'main.py'
        spec = importlib.util.spec_from_file_location('foundations_api_under_test', path)
        cls.api = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, {'database': database, 'models': models}):
            spec.loader.exec_module(cls.api)
        cls.database = database

    def setUp(self):
        self.db = Mock()
        self.db.execute.return_value.fetchall.return_value = []
        self.api.app.dependency_overrides[self.database.get_db] = lambda: self.db
        self.api.app.dependency_overrides[self.api.require_api_key] = lambda: 'fixture-key'
        self.addCleanup(self.api.app.dependency_overrides.clear)

    def request(self, path, query='', body=None):
        # In-process ASGI, no HTTP client package, sockets or app startup events.
        payload = json.dumps(body).encode() if body is not None else b''
        scope = {'type': 'http', 'asgi': {'version': '3.0'}, 'http_version': '1.1',
                 'method': 'POST' if body is not None else 'GET', 'scheme': 'http',
                 'path': path, 'raw_path': path.encode(), 'query_string': query.encode(),
                 'headers': [(b'content-type', b'application/json')],
                 'server': ('fixture', 80), 'client': ('fixture', 123), 'root_path': ''}
        messages = []
        async def receive():
            return {'type': 'http.request', 'body': payload, 'more_body': False}
        async def send(message):
            messages.append(message)
        asyncio.run(self.api.app(scope, receive, send))
        status = next(item['status'] for item in messages if item['type'] == 'http.response.start')
        data = json.loads(b''.join(item.get('body', b'') for item in messages if item['type'] == 'http.response.body'))
        return status, data

    def test_nearest_default_uses_manila_day_in_actual_request(self):
        from calendar_dates import MANILA
        clock = datetime(2026, 10, 16, 16, 1, tzinfo=timezone.utc)
        with patch('calendar_dates.datetime') as datetime_mock:
            datetime_mock.now.return_value = clock
            status, data = self.request('/api/advisories/nearest', 'lat=14.1&lon=122.9')
        self.assertEqual(status, 200)
        self.assertEqual(data['prediction_date'], '2026-10-17')
        self.assertEqual(self.db.execute.call_args.args[1]['p_date'], clock.astimezone(MANILA).date())

    def test_explicit_prediction_day_is_not_shifted(self):
        status, data = self.request('/api/advisories/nearest', 'lat=14.1&lon=122.9&prediction_date=2026-10-15')
        self.assertEqual((status, data['prediction_date']), (200, '2026-10-15'))

    def test_species_empty_catalog_date_fallback_uses_manila(self):
        self.db.execute.return_value.fetchone.return_value = None
        with patch.object(self.api, 'find_species_profile', return_value={'category': 'demersal', 'species_name': 'Fixture'}), patch('calendar_dates.datetime') as datetime_mock:
            datetime_mock.now.return_value = datetime(2026, 10, 16, 16, 1, tzinfo=timezone.utc)
            status, data = self.request('/api/predictions/species', 'species=Fixture')
        self.assertEqual((status, data), (200, []))
        self.assertEqual(self.db.execute.call_args.args[1]['p_date'], date(2026, 10, 17))
        self.assertEqual(self.db.execute.call_args.args[1]['habitat'], 'demersal')

    def test_invalid_ingestion_is_422_before_any_write(self):
        for change in ({'lat': 122.9}, {'lon': 181}, {'lat': '14.1'}, {'prediction_date': '2026-02-30'}):
            item = {'lat': 14.1, 'lon': 122.9, 'prediction_date': '2026-10-17', 'catch_probability': 0.8} | change
            with self.subTest(change=change):
                status, _ = self.request('/api/predictions/ingest', body={'predictions': [item]})
                self.assertEqual(status, 422)
                self.db.add.assert_not_called()
                self.db.commit.assert_not_called()

    def test_both_habitats_still_ingest_and_keep_lon_lat_geometry_order(self):
        payload = {'predictions': [{'lat': 14.1, 'lon': 122.9, 'prediction_date': '2026-10-17', 'catch_probability': 0.8, 'model_type': model}
                                    for model in ('pelagic', 'demersal')]}
        status, data = self.request('/api/predictions/ingest', body=payload)
        self.assertEqual((status, data['inserted_records']), (201, 2))
        rows = [call.args[0] for call in self.db.add.call_args_list]
        self.assertEqual([row.model_type for row in rows], ['pelagic', 'demersal'])
        point, srid = list(rows[0].centroid_geom.clauses)
        self.assertEqual([value.value for value in point.clauses], [122.9, 14.1])
        self.assertEqual(srid.value, 4326)
        self.db.commit.assert_called_once()

    def test_real_cli_missing_file_exits_nonzero_without_database_setup(self):
        script = Path(__file__).resolve().parents[1] / 'ingest_predictions.py'
        result = subprocess.run([sys.executable, str(script), str(script.parent / 'missing-unit-fixture.csv')],
                                capture_output=True, text=True, timeout=15)
        self.assertEqual(result.returncode, 1)
        self.assertIn('Invalid CSV input', result.stderr)
        self.assertNotIn('Traceback', result.stderr)


if __name__ == '__main__':
    unittest.main()
