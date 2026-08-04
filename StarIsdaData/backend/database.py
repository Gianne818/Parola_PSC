from supabase import create_client
import os
from dotenv import load_dotenv
import httpx


BATCH_SIZE = 1000
MAX_RETRIES = 3

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)


def chunk_records(records: list, batch_size: int = BATCH_SIZE):
    return [records[index:index + batch_size] for index in range(0, len(records), batch_size)]


def save_records(table_name: str, records: list):
    """
    Insert new observations.
    If the same latitude, longitude, and observation_time already exist,
    update the existing row instead of creating a duplicate.
    """

    if not records:
        return {"status": "skipped", "reason": "empty", "batches": 0}

    last_error = None

    for attempt in range(MAX_RETRIES):
        try:
            for batch in chunk_records(records):
                (
                    supabase
                    .table(table_name)
                    .upsert(
                        batch,
                        on_conflict="latitude,longitude,observation_time"
                    )
                    .execute()
                )
            return {"status": "success", "batches": len(list(chunk_records(records)))}
        except Exception as exc:
            last_error = exc
            if isinstance(exc, (httpx.ReadError, httpx.ConnectError, httpx.TimeoutException)):
                print(f"Transient Supabase error while saving to {table_name}: {exc}")
                continue
            if attempt == MAX_RETRIES - 1:
                raise

    if last_error:
        print(f"Supabase write failed for {table_name}: {last_error}")
        return {
            "status": "partial",
            "error_type": type(last_error).__name__,
            "error": str(last_error),
            "records": len(records),
        }

    return {"status": "success", "batches": len(list(chunk_records(records)))}


def get_records(table_name: str):

    response = (
        supabase
        .table(table_name)
        .select("*")
        .order("observation_time", desc=True)
        .execute()
    )

    return response.data

def get_latest_record(table_name: str):

    response = (
        supabase
        .table(table_name)
        .select("*")
        .order("observation_time", desc=True)
        .limit(1)
        .execute()
    )

    if response.data:
        return response.data[0]

    return None