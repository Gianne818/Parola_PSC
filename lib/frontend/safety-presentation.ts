import type { DashboardWeather, WeatherReading } from '@/lib/dashboard';
import { isReadingCurrent } from '@/lib/dashboard';
import { recordTimestamp } from './timestamps';

type Coverage = 'unavailable' | 'retained' | 'undated' | 'expired' | 'outdated' | 'available';

/** Describes supplied evidence; never assigns a sailing clearance or new threshold. */
export function evidenceCoverage(reading: WeatherReading | undefined, now = new Date()): Coverage {
  if (typeof reading?.value !== 'number' || !Number.isFinite(reading.value)) return 'unavailable';
  if (reading.available === false) return 'retained';
  const issued = recordTimestamp(reading.observedAt);
  if (!issued || Date.parse(issued) > now.getTime()) return 'undated';
  const until = recordTimestamp(reading.validUntil);
  if (reading.validUntil && !until) return 'undated';
  if (until && Date.parse(until) < now.getTime()) return 'expired';
  return isReadingCurrent(reading, now) ? 'available' : 'outdated';
}

/** Keep an independently readable hold even when another response field is malformed. */
export function readWeatherEvidence(value: Record<string, unknown>): DashboardWeather {
  const reading = (input: unknown): WeatherReading => {
    const item = input && typeof input === 'object' ? input as Record<string, unknown> : {};
    const valid = typeof item.value === 'number' && Number.isFinite(item.value) && item.value >= 0;
    const source = typeof item.source === 'string' && item.source.trim() ? item.source : null;
    const availability = !valid || !source || (item.available !== undefined && typeof item.available !== 'boolean') ? false : item.available;
    return { value: valid ? item.value as number : null,
      source: source || 'Unavailable', observedAt: recordTimestamp(item.observedAt),
      ...(typeof availability === 'boolean' ? { available: availability } : {}),
      // Preserve a malformed supplied expiry as invalid, so it cannot become an open interval.
      ...(item.validUntil === undefined ? {} : { validUntil: item.validUntil === null ? null : recordTimestamp(item.validUntil) || 'invalid' }) };
  };
  const item = value.hold && typeof value.hold === 'object' ? value.hold as Record<string, unknown> : {};
  return { wind: reading(value.wind), waves: reading(value.waves), temperature: reading(value.temperature), stormSignal: reading(value.stormSignal),
    hold: { available: item.available === true && typeof item.active === 'boolean', active: item.active === true,
      checkedAt: recordTimestamp(item.checkedAt), reason: typeof item.reason === 'string' ? item.reason : null },
    receivedAt: recordTimestamp(value.receivedAt) || '' };
}
