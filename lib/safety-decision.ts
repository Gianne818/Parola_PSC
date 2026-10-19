/** Backend-only combination of previously validated, area-specific safety evidence. */
export type SafetyEvidenceKind = 'wind' | 'waves' | 'official_warning';
export type SafetyEvidence = {
  kind: SafetyEvidenceKind;
  state: 'hazard' | 'clear' | 'unknown';
  unit: 'knots' | 'm' | 'bulletin';
  areaId: string;
  source: string;
  issuedAt: string;
  validUntil: string;
  quality: 'validated' | 'unverified';
  vesselClass: string | null;
  ruleVersion: string | null;
};

export type SafetyDecision = {
  status: 'NORMAL' | 'SUPPRESSED_WEATHER_HAZARD' | 'UNKNOWN';
  reason: 'known_applicable_hazard' | 'complete_validated_evidence' | 'safety_data_unavailable';
  actionable: boolean;
  ruleVersion: string | null;
};

const expectedUnits: Record<SafetyEvidenceKind, SafetyEvidence['unit']> = {
  wind: 'knots', waves: 'm', official_warning: 'bulletin',
};
const requiredKinds: SafetyEvidenceKind[] = ['wind', 'waves', 'official_warning'];
const timestampPattern = /^(\d{4}-\d\d-\d\d)T(\d\d):(\d\d):(\d\d)(?:\.\d+)?(?:Z|[+-](\d\d):(\d\d))$/;

function timestamp(value: unknown): number {
  if (typeof value !== 'string') return NaN;
  const parts = timestampPattern.exec(value);
  if (!parts || parts[1].startsWith('0000') || Number(parts[2]) > 23
    || Number(parts[3]) > 59 || Number(parts[4]) > 59
    || Number(parts[5] ?? 0) > 23 || Number(parts[6] ?? 0) > 59) return NaN;
  const day = new Date(`${parts[1]}T00:00:00Z`);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== parts[1]) return NaN;
  return Date.parse(value);
}

function applicable(item: SafetyEvidence, areaId: string, now: number): boolean {
  if (!item || !requiredKinds.includes(item.kind) || item.unit !== expectedUnits[item.kind]
    || item.quality !== 'validated' || item.areaId !== areaId
    || typeof item.source !== 'string' || !item.source.trim()) return false;
  const issuedAt = timestamp(item.issuedAt);
  const validUntil = timestamp(item.validUntil);
  return Number.isFinite(issuedAt) && Number.isFinite(validUntil)
    && issuedAt <= now && now < validUntil && issuedAt < validUntil;
}

/** A known applicable hazard wins over unrelated missing evidence. Clearance needs every source. */
export function decideSafety(input: {
  areaId: string | null;
  vesselClass: string | null;
  approvedRuleVersion: string | null;
  now: Date;
  evidence: readonly SafetyEvidence[];
}): SafetyDecision {
  const unknown: SafetyDecision = {
    status: 'UNKNOWN', reason: 'safety_data_unavailable', actionable: false,
    ruleVersion: null,
  };
  const now = input.now instanceof Date ? input.now.getTime() : NaN;
  if (typeof input.areaId !== 'string' || !input.areaId.trim()
    || !Number.isFinite(now) || !Array.isArray(input.evidence)) return unknown;
  const vesselClass = typeof input.vesselClass === 'string' ? input.vesselClass.trim() : '';
  const ruleVersion = typeof input.approvedRuleVersion === 'string' ? input.approvedRuleVersion.trim() : '';
  const local = input.evidence.filter(item => !item || typeof item.areaId !== 'string' || item.areaId === input.areaId);
  const current = local.filter(item => applicable(item, input.areaId!, now));
  const matchesContext = (item: SafetyEvidence) => Boolean(vesselClass && ruleVersion
    && item.vesselClass === vesselClass && item.ruleVersion === ruleVersion);
  // A validated warning can explicitly apply to every vessel without numeric rule metadata.
  const hazard = current.find(item => item.state === 'hazard' && (matchesContext(item)
    || (item.kind === 'official_warning' && (item.vesselClass === null
      || Boolean(vesselClass && item.vesselClass === vesselClass)))));
  if (hazard) {
    return { status: 'SUPPRESSED_WEATHER_HAZARD', reason: 'known_applicable_hazard',
      actionable: false, ruleVersion: matchesContext(hazard) ? ruleVersion : null };
  }
  // Unresolved local records must not disappear into an otherwise clear result.
  if (current.length !== local.length || !current.every(matchesContext)) return unknown;
  if (!requiredKinds.every(kind => {
    const observations = current.filter(item => item.kind === kind);
    return observations.length > 0 && observations.every(item => item.state === 'clear');
  })) return unknown;
  return { status: 'NORMAL', reason: 'complete_validated_evidence', actionable: true,
    ruleVersion };
}
