import { describe, expect, it } from 'vitest';
import { decideSafety, type SafetyEvidence } from './safety-decision';

const now = new Date('2026-10-19T06:00:00Z');
const evidence: SafetyEvidence[] = [
  { kind: 'wind', state: 'clear', unit: 'knots', areaId: 'area-1', source: 'validated wind',
    issuedAt: '2026-10-19T05:00:00Z', validUntil: '2026-10-19T07:00:00Z', quality: 'validated',
    vesselClass: 'reviewed-small-vessel', ruleVersion: 'reviewed-v1' },
  { kind: 'waves', state: 'clear', unit: 'm', areaId: 'area-1', source: 'validated waves',
    issuedAt: '2026-10-19T05:00:00Z', validUntil: '2026-10-19T07:00:00Z', quality: 'validated',
    vesselClass: 'reviewed-small-vessel', ruleVersion: 'reviewed-v1' },
  { kind: 'official_warning', state: 'clear', unit: 'bulletin', areaId: 'area-1', source: 'validated warning',
    issuedAt: '2026-10-19T05:00:00Z', validUntil: '2026-10-19T07:00:00Z', quality: 'validated',
    vesselClass: 'reviewed-small-vessel', ruleVersion: 'reviewed-v1' },
];
const input = { areaId: 'area-1', vesselClass: 'reviewed-small-vessel', approvedRuleVersion: 'reviewed-v1', now, evidence };

describe('shared safety decision', () => {
  it('clears only complete current validated evidence with a vessel and approved rule', () => {
    expect(decideSafety(input)).toEqual({ status: 'NORMAL', reason: 'complete_validated_evidence',
      actionable: true, ruleVersion: 'reviewed-v1' });
  });
  it('retains a known applicable warning while wind and waves are unavailable', () => {
    expect(decideSafety({ ...input, vesselClass: null, approvedRuleVersion: null,
      evidence: [{ ...evidence[2], state: 'hazard', vesselClass: null, ruleVersion: null }] }).status).toBe('SUPPRESSED_WEATHER_HAZARD');
  });
  it.each(['wind', 'waves', 'official_warning'] as const)('never clears if %s is missing', kind => {
    expect(decideSafety({ ...input, evidence: evidence.filter(item => item.kind !== kind) }).status).toBe('UNKNOWN');
  });
  it('withholds when a source fails, even if another clear record exists', () => {
    expect(decideSafety({ ...input, evidence: [...evidence, { ...evidence[0], state: 'unknown' }] }).status).toBe('UNKNOWN');
  });
  it.each([
    { areaId: 'area-2' }, { validUntil: '2026-10-19T06:00:00Z' },
    { issuedAt: '2026-10-19T07:00:00Z' }, { unit: 'm' as const },
    { quality: 'unverified' as const }, { source: '' },
  ])('does not accept wrong-area, stale or unverified warning evidence %j', change => {
    expect(decideSafety({ ...input, evidence: [...evidence.slice(0, 2), { ...evidence[2], ...change }] }).status).toBe('UNKNOWN');
  });
  it('does not treat an unrelated hazard as a local warning', () => {
    expect(decideSafety({ ...input, evidence: [...evidence, { ...evidence[2], state: 'hazard', areaId: 'area-2' }] }).status).toBe('NORMAL');
  });
  it('withholds clearance without an approved rule, vessel or valid evaluation time', () => {
    for (const change of [{ approvedRuleVersion: null }, { vesselClass: null }, { now: new Date('invalid') }]) {
      expect(decideSafety({ ...input, ...change }).status).toBe('UNKNOWN');
    }
  });
  it('keeps an applicable hazard when another source is stale', () => {
    expect(decideSafety({ ...input, evidence: [{ ...evidence[0], validUntil: '2026-10-19T06:00:00Z' },
      { ...evidence[2], state: 'hazard' }] }).actionable).toBe(false);
  });
  it.each([{ quality: 'unverified' as const }, { unit: 'm' as const }])('withholds when unresolved local evidence accompanies clear records: %j', change => {
    expect(decideSafety({ ...input, evidence: [...evidence, { ...evidence[2], state: 'hazard', ...change }] }).status).toBe('UNKNOWN');
  });
  it('rejects impossible calendar timestamps instead of normalizing them', () => {
    expect(decideSafety({ ...input, now: new Date('2026-03-02T06:00:00Z'), evidence: evidence.map(item => ({
      ...item, issuedAt: '2026-02-30T05:00:00Z', validUntil: '2026-03-02T07:00:00Z',
    })) }).status).toBe('UNKNOWN');
  });
  it.each([{ vesselClass: 'different-vessel' }, { approvedRuleVersion: 'different-rule' }])('does not reuse clear classifications for a different context: %j', change => {
    expect(decideSafety({ ...input, ...change }).status).toBe('UNKNOWN');
  });
  it('does not apply a vessel-specific hazard to a different vessel', () => {
    expect(decideSafety({ ...input, vesselClass: 'different-vessel', evidence: [
      { ...evidence[2], state: 'hazard' },
    ] }).status).toBe('UNKNOWN');
  });
  it('preserves a valid hazard despite another malformed local record', () => {
    expect(decideSafety({ ...input, evidence: [...evidence, { ...evidence[2], state: 'hazard' },
      { ...evidence[0], source: null } as unknown as SafetyEvidence] }).status).toBe('SUPPRESSED_WEATHER_HAZARD');
  });
  it.each(['2026-10-19T24:00:00Z', '2026-10-19T05:00:00', '2026-10-19T05:00:60Z'])('rejects malformed clock timestamps: %s', issuedAt => {
    expect(decideSafety({ ...input, evidence: evidence.map(item => ({ ...item, issuedAt })) }).status).toBe('UNKNOWN');
  });
  it('accepts valid timezone offsets and the inclusive issue boundary', () => {
    expect(decideSafety({ ...input, evidence: evidence.map(item => ({ ...item,
      issuedAt: '2026-10-19T14:00:00+08:00', validUntil: '2026-10-19T15:00:00+08:00',
    })) }).status).toBe('NORMAL');
  });
});
