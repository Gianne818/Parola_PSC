/** Display parsing only; this does not establish validity or freshness policy. */
function calendarDay(value: string): boolean {
  const day = value.slice(0, 10);
  const parsed = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day;
}

export function recordTimestamp(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && calendarDay(value) && Number.isFinite(Date.parse(value)) ? value : null;
}

export function predictionDay(value: unknown): string | null {
  if (typeof value !== 'string' || !calendarDay(value)) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (!recordTimestamp(value)) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(value));
}
