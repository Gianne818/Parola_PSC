import importlib
import sys
from pathlib import Path

import httpx

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))


def test_chunk_records_splits_large_payloads():
    database = importlib.import_module("database")

    records = list(range(10))
    chunks = database.chunk_records(records, batch_size=3)

    assert chunks == [list(range(0, 3)), list(range(3, 6)), list(range(6, 9)), list(range(9, 10))]


def test_save_records_returns_partial_on_transient_http_error(monkeypatch):
    database = importlib.import_module("database")

    class FakeQuery:
        def upsert(self, batch, on_conflict=None):
            return self

        def execute(self):
            raise httpx.ReadError("temporary network issue")

    class FakeSupabase:
        def table(self, name):
            return FakeQuery()

    monkeypatch.setattr(database, "supabase", FakeSupabase())

    result = database.save_records(
        "test_table",
        [{"latitude": 1, "longitude": 2, "observation_time": "2026-01-01T00:00:00"}],
    )

    assert result["status"] == "partial"
    assert result["error_type"] == "ReadError"
