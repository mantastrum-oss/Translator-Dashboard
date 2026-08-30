from datetime import datetime, timezone
from zoneinfo import ZoneInfo


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def month_bounds_utc(month: str, tz: str) -> tuple[datetime, datetime]:
    year, month_num = month.split("-")
    y = int(year)
    m = int(month_num)

    tzinfo = ZoneInfo(tz)
    local_start = datetime(y, m, 1, 0, 0, 0, tzinfo=tzinfo)
    if m == 12:
        local_end = datetime(y + 1, 1, 1, 0, 0, 0, tzinfo=tzinfo)
    else:
        local_end = datetime(y, m + 1, 1, 0, 0, 0, tzinfo=tzinfo)

    return local_start.astimezone(timezone.utc), local_end.astimezone(timezone.utc)
