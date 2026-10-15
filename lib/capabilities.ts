export const CAPABILITY_IDS = ['phone_registration', 'advisory_preferences', 'regional_language', 'species_environment', 'routine_sms', 'critical_alerts', 'trip_reports', 'assisted_registration', 'geopacks', 'satellite'] as const;

export interface CapabilityRecord {
  capability_id: string;
  status: 'planned' | 'implemented' | 'verified' | 'unavailable';
  summary: string;
  evidence_reference: string | null;
  verified_at: string | Date | null;
  valid_until: string | Date | null;
}

export function capabilityStatus(row: CapabilityRecord, now = new Date()) {
  const verified = row.verified_at ? new Date(row.verified_at).getTime() : NaN;
  const expiry = row.valid_until ? new Date(row.valid_until).getTime() : NaN;
  const ready = row.status === 'verified' && typeof row.evidence_reference === 'string'
    && row.evidence_reference.trim().length > 0 && verified <= now.getTime() && expiry > now.getTime() && expiry > verified;
  return { id: row.capability_id, status: row.status === 'verified' && !ready ? 'unavailable' : row.status,
    ready, summary: row.summary, evidence_recorded: Boolean(row.evidence_reference),
    verified_at: Number.isFinite(verified) ? new Date(verified).toISOString() : null,
    valid_until: Number.isFinite(expiry) ? new Date(expiry).toISOString() : null };
}
