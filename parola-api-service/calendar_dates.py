"""Explicit Manila calendar dates for operational prediction inputs."""
import re
from datetime import date, datetime, timedelta, timezone

# Current Philippine operational dates use UTC+08:00, with no DST. A fixed zone
# also works on Windows without adding a timezone-data dependency.
MANILA = timezone(timedelta(hours=8), name='Asia/Manila')


def manila_today(now: datetime | None = None) -> date:
    instant = now if now is not None else datetime.now(timezone.utc)
    if instant.tzinfo is None or instant.utcoffset() is None:
        raise ValueError('An aware timestamp is required.')
    return instant.astimezone(MANILA).date()


def parse_prediction_date(value: object) -> date:
    if type(value) is date:
        return value
    if not isinstance(value, str) or not re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}', value):
        raise ValueError('Use a valid YYYY-MM-DD prediction date.')
    return date.fromisoformat(value)
