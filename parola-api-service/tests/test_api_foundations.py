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
from prediction_ingestion import IngestionError, prepare_batch


def successful_ingestion(db, items):
    batch = prepare_batch(items)
    db.execute.side_effect = [Mock(), Mock(mappings=lambda: Mock(one=lambda: {
        'payload_hash': batch.payload_hash, 'status': 'pending', 'expected_records': len(items),
    })), Mock(), Mock(scalar_one=lambda: len(items)), Mock(rowcount=1)]


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

    def test_valid_input_is_published_atomically_with_correct_coordinate_order(self):
        self.write('1,14.1,122.9,0.8,28,0.4\n2,0,0,0.7,,\n')
        successful_ingestion(self.db, self.loader.read_predictions(str(self.csv), '2026-10-17'))
        with contextlib.redirect_stdout(io.StringIO()) as output:
            count = self.loader.ingest_csv(str(self.csv), '2026-10-17', session_factory=self.factory)
        self.assertEqual(count, 2)
        self.assertEqual(self.db.commit.call_count, 2)  # identity, then complete publication
        self.db.rollback.assert_not_called()
        values = self.db.execute.call_args_list[2].args[1]
        self.assertEqual((values[1]['lat'], values[1]['lon'], values[1]['prediction_date']), (14.1, 122.9, '2026-10-17'))
        self.assertIsNone(values[0]['sst'])
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
        successful_ingestion(self.db, self.loader.read_predictions(str(self.csv), '2026-10-17'))
        with patch.object(self.loader, 'manila_today', return_value=date(2026, 10, 17)), contextlib.redirect_stdout(io.StringIO()):
            self.loader.ingest_csv(str(self.csv), session_factory=self.factory)
        self.assertEqual(self.db.execute.call_args_list[2].args[1][0]['prediction_date'], '2026-10-17')

    def test_csv_supports_each_habitat_and_both_without_substitution(self):
        for habitats in [('pelagic',), ('demersal',), ('pelagic', 'demersal')]:
            self.csv.write_text('grid_lat,grid_lon,catch_probability,model_type\n' +
                                ''.join(f'14,122,0.8,{habitat}\n' for habitat in habitats), encoding='utf-8')
            items = self.loader.read_predictions(str(self.csv), '2026-10-17')
            self.assertEqual([item.model_type for item in items], list(habitats))
            with patch.object(self.loader, 'ingest_predictions', return_value={
                    'inserted_records': 0, 'total_records': len(items), 'replayed': True}) as service:
                with contextlib.redirect_stdout(io.StringIO()) as output:
                    self.assertEqual(self.loader.ingest_csv(str(self.csv), '2026-10-17', session_factory=self.factory), 0)
                self.assertIn('already published', output.getvalue())
                self.assertEqual(service.call_args.args[2], prepare_batch(items).run_id)

    def test_duplicate_csv_cells_never_open_database(self):
        self.write('1,14,122,0.8,,\n2,14,122,0.9,,\n')
        with self.assertRaises(IngestionError) as raised:
            self.loader.ingest_csv(str(self.csv), '2026-10-17', session_factory=self.factory)
        self.assertEqual(raised.exception.code, 'duplicate_cell')
        self.factory.assert_not_called()

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

    def request(self, path, query='', body=None, headers=None):
        # In-process ASGI, no HTTP client package, sockets or app startup events.
        payload = json.dumps(body).encode() if body is not None else b''
        scope = {'type': 'http', 'asgi': {'version': '3.0'}, 'http_version': '1.1',
                 'method': 'POST' if body is not None else 'GET', 'scheme': 'http',
                 'path': path, 'raw_path': path.encode(), 'query_string': query.encode(),
                 'headers': [(b'content-type', b'application/json')] + [(key.lower().encode(), value.encode()) for key, value in (headers or {}).items()],
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

    def test_live_reads_cannot_bypass_inactive_geographic_enforcement(self):
        with patch.dict('os.environ', {'PAROLA_AUTH_MODE': 'live', 'PAROLA_GEOGRAPHIC_ENFORCEMENT_ENABLED': 'false'}):
            for path, query in [('/api/advisories/nearest', 'lat=14&lon=123'), ('/api/predictions/species', 'species=Tamban')]:
                status, data = self.request(path, query)
                self.assertEqual(status, 503)
                self.assertEqual(data['detail']['code'], 'geographic_enforcement_inactive')
        self.db.execute.assert_not_called()

    def test_enforced_nearest_uses_trusted_proxy_identity_and_filters_before_limit(self):
        owner = '11111111-1111-4111-8111-111111111111'
        self.db.execute.return_value.scalar_one.return_value = 0
        with patch.dict('os.environ', {'PAROLA_GEOGRAPHIC_ENFORCEMENT_ENABLED': 'true', 'PAROLA_API_KEY': 'fixture-only-key'}):
            status, _ = self.request('/api/advisories/nearest', 'lat=14&lon=123', headers={
                'x-api-key': 'fixture-only-key', 'x-parola-profile-id': owner})
        self.assertEqual(status, 200)
        statement, values = self.db.execute.call_args.args
        self.assertEqual(values['geo_profile_id'], owner)
        self.assertLess(str(statement).index('parola_geographic_eligibility'), str(statement).index('LIMIT'))

    def test_enforced_reads_reject_public_user_id_as_authority(self):
        with patch.dict('os.environ', {'PAROLA_GEOGRAPHIC_ENFORCEMENT_ENABLED': 'true', 'PAROLA_API_KEY': 'fixture-only-key'}):
            status, _ = self.request('/api/advisories/nearest', 'lat=14&lon=123&user_id=11111111-1111-4111-8111-111111111111')
        self.assertEqual(status, 401)
        self.db.execute.assert_not_called()

    def test_enforced_reads_do_not_return_empty_success_for_unknown_coverage(self):
        self.db.execute.return_value.scalar_one.return_value = 1
        with patch.dict('os.environ', {'PAROLA_GEOGRAPHIC_ENFORCEMENT_ENABLED': 'true', 'PAROLA_API_KEY': 'fixture-only-key'}):
            status, data = self.request('/api/advisories/nearest', 'lat=14&lon=123', headers={
                'x-api-key': 'fixture-only-key', 'x-parola-profile-id': '11111111-1111-4111-8111-111111111111'})
        self.assertEqual(status, 503)
        self.assertEqual(data['detail']['code'], 'geographic_data_unavailable')

    def test_enforced_reads_reject_a_different_profile_in_public_query(self):
        with patch.dict('os.environ', {'PAROLA_GEOGRAPHIC_ENFORCEMENT_ENABLED': 'true', 'PAROLA_API_KEY': 'fixture-only-key'}):
            status, _ = self.request('/api/advisories/nearest', 'user_id=22222222-2222-4222-8222-222222222222', headers={
                'x-api-key': 'fixture-only-key', 'x-parola-profile-id': '11111111-1111-4111-8111-111111111111'})
        self.assertEqual(status, 403)
        self.db.execute.assert_not_called()

    def test_species_endpoint_uses_same_geographic_authority_and_habitat(self):
        self.db.execute.return_value.scalar_one.return_value = 0
        self.db.execute.return_value.fetchone.return_value = None
        owner = '11111111-1111-4111-8111-111111111111'
        with patch.dict('os.environ', {'PAROLA_GEOGRAPHIC_ENFORCEMENT_ENABLED': 'true', 'PAROLA_API_KEY': 'fixture-only-key'}), \
                patch.object(self.api, 'find_species_profile', return_value={'category': 'demersal', 'species_name': 'Fixture'}):
            status, data = self.request('/api/predictions/species', 'species=Fixture', headers={
                'x-api-key': 'fixture-only-key', 'x-parola-profile-id': owner})
        self.assertEqual((status, data), (200, []))
        statement, values = self.db.execute.call_args.args
        self.assertEqual((values['geo_profile_id'], values['habitat']), (owner, 'demersal'))
        self.assertIn('parola_geographic_eligibility', str(statement))

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
        successful_ingestion(self.db, [DailyGridPredictionItem(**item) for item in payload['predictions']])
        status, data = self.request('/api/predictions/ingest', body=payload)
        self.assertEqual((status, data['inserted_records']), (201, 2))
        rows = self.db.execute.call_args_list[2].args[1]
        self.assertEqual([row['model_type'] for row in rows], ['demersal', 'pelagic'])
        self.assertEqual((rows[0]['lon'], rows[0]['lat']), (122.9, 14.1))
        self.assertEqual(self.db.commit.call_count, 2)

    def test_ingestion_replay_returns_200_and_preserves_run_identity(self):
        identity = '524ee50a-4ebd-4b06-a129-d6bedfbe0884'
        result = {'status': 'success', 'run_id': identity, 'inserted_records': 0, 'replayed': True, 'total_records': 1}
        with patch.object(self.api, 'ingest_predictions', return_value=result) as service:
            status, data = self.request('/api/predictions/ingest', body={'run_id': identity, 'predictions': [
                {'lat': 14, 'lon': 122, 'prediction_date': '2026-10-17', 'catch_probability': 0.8}]})
        self.assertEqual((status, data), (200, result))
        self.assertEqual(str(service.call_args.args[2]), identity)

    def test_ingestion_errors_use_stable_codes_and_safe_messages(self):
        body = {'predictions': [{'lat': 14, 'lon': 122, 'prediction_date': '2026-10-17', 'catch_probability': 0.8}]}
        for code, expected in [('run_conflict', 409), ('ingestion_unavailable', 503)]:
            with patch.object(self.api, 'ingest_predictions', side_effect=IngestionError('Safe message.', code, expected)):
                status, data = self.request('/api/predictions/ingest', body=body)
            self.assertEqual((status, data['detail']['code']), (expected, code))

    def test_database_failure_returns_generated_run_id_for_status_lookup(self):
        item = {'lat': 14, 'lon': 122, 'prediction_date': '2026-10-17', 'catch_probability': 0.8}
        batch = prepare_batch([DailyGridPredictionItem(**item)])
        self.db.execute.side_effect = RuntimeError('private-driver-credentials')
        status, data = self.request('/api/predictions/ingest', body={'predictions': [item]})
        self.assertEqual(status, 503)
        self.assertEqual(data['detail']['run_id'], str(batch.run_id))
        self.assertEqual(data['detail']['failure_code'], 'claim_failed')
        self.assertNotIn('private-driver', json.dumps(data))

    def test_missing_key_cannot_ingest_or_read_run_status(self):
        self.api.app.dependency_overrides.pop(self.api.require_api_key)
        with patch.dict('os.environ', {'PAROLA_API_KEY': 'fixture-only-key'}):
            status, _ = self.request('/api/predictions/runs/524ee50a-4ebd-4b06-a129-d6bedfbe0884')
            self.assertEqual(status, 401)
            status, _ = self.request('/api/predictions/ingest', body={'predictions': []})
            self.assertEqual(status, 401)
        self.db.execute.assert_not_called()

    def test_protected_status_returns_failure_without_database_details(self):
        record = {'run_id': '524ee50a-4ebd-4b06-a129-d6bedfbe0884', 'status': 'failed', 'failure_code': 'write_failed'}
        self.db.execute.return_value.mappings.return_value.one_or_none.return_value = record
        status, data = self.request('/api/predictions/runs/' + record['run_id'])
        self.assertEqual((status, data), (200, record))

    def test_duplicate_empty_and_invalid_habitat_batches_fail_without_writes(self):
        item = {'lat': 14, 'lon': 122, 'prediction_date': '2026-10-17', 'catch_probability': 0.8}
        for rows in [[], [item, item], [item | {'model_type': 'both'}], [item | {'catch_probability': 1.1}]]:
            status, _ = self.request('/api/predictions/ingest', body={'predictions': rows})
            self.assertEqual(status, 422)
        self.db.execute.assert_not_called()

    def test_real_cli_missing_file_exits_nonzero_without_database_setup(self):
        script = Path(__file__).resolve().parents[1] / 'ingest_predictions.py'
        result = subprocess.run([sys.executable, str(script), str(script.parent / 'missing-unit-fixture.csv')],
                                capture_output=True, text=True, timeout=15)
        self.assertEqual(result.returncode, 1)
        self.assertIn('Invalid CSV input', result.stderr)
        self.assertNotIn('Traceback', result.stderr)


if __name__ == '__main__':
    unittest.main()
