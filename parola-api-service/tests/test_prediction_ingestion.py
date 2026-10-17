"""Ingestion service boundary checks with mocked database transactions only."""
import sys
import unittest
from pathlib import Path
from unittest.mock import Mock
from uuid import UUID, uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from schemas import DailyGridPredictionItem
from prediction_ingestion import IngestionError, get_ingestion_run, ingest_predictions, prepare_batch


class PredictionIngestionTests(unittest.TestCase):
    def items(self):
        return [DailyGridPredictionItem(prediction_date='2026-10-17', lat=14, lon=122,
                                        catch_probability=0.8, model_type=model)
                for model in ('pelagic', 'demersal')]

    def test_complete_batch_is_published_after_both_habitats_are_inserted(self):
        db = Mock()
        batch = prepare_batch(self.items())
        db.execute.side_effect = [Mock(), Mock(mappings=lambda: Mock(one=lambda: {
            'payload_hash': batch.payload_hash, 'status': 'pending', 'expected_records': 2,
        })), Mock(rowcount=2), Mock(scalar_one=lambda: 2), Mock(rowcount=1)]
        result = ingest_predictions(db, self.items())
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['inserted_records'], 2)
        self.assertEqual(result['run_id'], str(batch.run_id))
        inserted = db.execute.call_args_list[2].args[1]
        self.assertEqual([row['model_type'] for row in inserted], ['demersal', 'pelagic'])
        self.assertEqual((inserted[0]['lon'], inserted[0]['lat']), (122, 14))
        self.assertEqual(db.commit.call_count, 2)
        db.rollback.assert_not_called()

    def run_row(self, batch, state='pending'):
        return Mock(mappings=lambda: Mock(one=lambda: {
            'payload_hash': batch.payload_hash, 'status': state, 'expected_records': len(batch.rows),
        }))

    def test_reordered_upload_and_negative_zero_keep_same_identity(self):
        items = self.items()
        self.assertEqual(prepare_batch(items), prepare_batch(items[::-1]))
        positive = DailyGridPredictionItem(prediction_date='2026-10-17', lat=0, lon=0, catch_probability=0)
        negative = positive.model_copy(update={'lat': -0.0, 'lon': -0.0, 'catch_probability': -0.0})
        self.assertEqual(prepare_batch([positive]).run_id, prepare_batch([negative]).run_id)

    def test_replay_after_restart_writes_no_prediction_rows(self):
        batch = prepare_batch(self.items())
        db = Mock()
        db.execute.side_effect = [Mock(), self.run_row(batch, 'published')]
        result = ingest_predictions(db, self.items()[::-1])
        self.assertTrue(result['replayed'])
        self.assertEqual(result['inserted_records'], 0)
        self.assertEqual(db.execute.call_count, 2)
        db.rollback.assert_called_once()

    def test_changed_payload_cannot_reuse_explicit_run_id(self):
        identity = uuid4()
        batch = prepare_batch(self.items(), identity)
        changed = [self.items()[0].model_copy(update={'catch_probability': 0.7}), self.items()[1]]
        db = Mock()
        db.execute.side_effect = [Mock(), self.run_row(batch)]
        with self.assertRaises(IngestionError) as raised:
            ingest_predictions(db, changed, identity)
        self.assertEqual((raised.exception.code, raised.exception.status_code), ('run_conflict', 409))
        self.assertEqual(db.execute.call_count, 2)

    def test_duplicate_cells_fail_before_database(self):
        db = Mock()
        with self.assertRaises(IngestionError) as raised:
            ingest_predictions(db, [self.items()[0], self.items()[0]])
        self.assertEqual(raised.exception.code, 'duplicate_cell')
        db.execute.assert_not_called()

    def test_partial_write_count_or_publication_failure_rolls_back_and_records_failure(self):
        for point in ('insert', 'count', 'publish'):
            db = Mock()
            batch = prepare_batch(self.items())
            effects = [Mock(), self.run_row(batch)]
            effects += ([RuntimeError('private-driver-credentials')] if point == 'insert' else
                        [Mock(), Mock(scalar_one=lambda: 1)] if point == 'count' else
                        [Mock(), Mock(scalar_one=lambda: 2), Mock(rowcount=0)])
            effects += [Mock(rowcount=1)]
            db.execute.side_effect = effects
            with self.subTest(point=point), self.assertRaises(IngestionError) as raised:
                ingest_predictions(db, self.items())
            self.assertNotIn('private-driver', str(raised.exception))
            db.rollback.assert_called_once()
            self.assertEqual(db.execute.call_args.args[1]['failure_code'],
                             'publish_failed' if point == 'publish' else 'write_failed')

    def test_ambiguous_commit_never_returns_success_or_overwrites_published_status(self):
        db = Mock()
        batch = prepare_batch(self.items())
        db.execute.side_effect = [Mock(), self.run_row(batch), Mock(), Mock(scalar_one=lambda: 2),
                                  Mock(rowcount=1), Mock(rowcount=0)]
        db.commit.side_effect = [None, RuntimeError('lost acknowledgement'), None]
        with self.assertRaises(IngestionError) as raised:
            ingest_predictions(db, self.items())
        self.assertEqual(raised.exception.as_detail()['run_id'], str(batch.run_id))
        self.assertEqual(raised.exception.as_detail()['failure_code'], 'commit_unknown')
        self.assertEqual(db.execute.call_args.args[1]['failure_code'], 'commit_unknown')
        self.assertIn("status <> 'published'", str(db.execute.call_args.args[0]))

    def test_failed_upload_can_retry_same_identity(self):
        db = Mock()
        batch = prepare_batch(self.items())
        db.execute.side_effect = [Mock(), self.run_row(batch, 'failed'), Mock(),
                                  Mock(scalar_one=lambda: 2), Mock(rowcount=1)]
        self.assertFalse(ingest_predictions(db, self.items())['replayed'])

    def test_status_not_found_and_database_failure_are_redacted(self):
        db = Mock()
        db.execute.return_value.mappings.return_value.one_or_none.return_value = None
        with self.assertRaises(IngestionError) as raised:
            get_ingestion_run(db, uuid4())
        self.assertEqual(raised.exception.status_code, 404)
        db.execute.side_effect = RuntimeError('private-driver-credentials')
        with self.assertRaises(IngestionError) as raised:
            get_ingestion_run(db, uuid4())
        self.assertEqual(raised.exception.status_code, 503)
        self.assertNotIn('private-driver', str(raised.exception))


if __name__ == '__main__':
    unittest.main()
