import { describe, expect, it } from 'vitest';
import { assertReportAction, blankTrip, confirmedReport, draftFromReport, permittedSubjects, readReportingContext,
  tripFromDraft, validateTrip, type CatchReport, type ReportCommand, type ReportingContext, type TripDraft } from '@/lib/frontend/catch-reporting';

// Provisional test units only. No shared/API/scientific contract is established here.
const units = { weight: 'kg (fixture)', effort: 'hours at sea (fixture)' };
const draft: TripDraft = { ...blankTrip(), date: '2026-10-20', area: 'Approximate bay', species: 'Sardine', weight: '2.5', effort: '3' };
const trip = tripFromDraft(draft, units);
const report: CatchReport = { id: 'r1', fisherId: 'owner', enteredBy: 'owner', revision: '1', state: 'pending', reviewNote: null, canCorrect: true, trip };
const context: ReportingContext = { actorId: 'owner', self: { id: 'owner', label: 'Owner' }, canCreate: true,
  assistance: 'denied', permittedFishers: [], units, reports: [report] };
const command: ReportCommand = { actorId: 'owner', fisherId: 'owner', requestId: 'request-1', trip, correction: null };

describe('voluntary report validation and value preservation', () => {
  it('keeps zero catch and no GPS as legitimate data', () => {
    const zero = { ...draft, weight: '0', species: '' };
    expect(validateTrip(zero, units)).toEqual({});
    expect(tripFromDraft(zero, units)).toMatchObject({ weight: 0, species: '', gps: null, effort: 3, units });
  });
  it.each(['', '-1', 'NaN', 'Infinity', '1e3', '1,5', ' '])('rejects invalid weight/effort %j', value => {
    expect(validateTrip({ ...draft, weight: value, effort: value }, units)).toHaveProperty('weight');
    expect(validateTrip({ ...draft, weight: value, effort: value }, units)).toHaveProperty('effort');
  });
  it.each(['2026-02-29', '2026-13-01', '0000-01-01', 'not-a-date'])('rejects impossible trip date %s', date => {
    expect(validateTrip({ ...draft, date }, units)).toHaveProperty('date');
  });
  it('accepts leap dates and decimal values without converting units', () => {
    expect(validateTrip({ ...draft, date: '2024-02-29', weight: '.5', effort: '0' }, units)).toEqual({});
    expect(tripFromDraft({ ...draft, weight: '.5', effort: '0' }, units)).toMatchObject({ weight: .5, effort: 0, units });
  });
  it('requires area and positive-catch species', () => {
    expect(validateTrip({ ...draft, area: ' ', species: '' }, units)).toMatchObject({ area: expect.any(String), species: expect.any(String) });
  });
  it('does not assume production units', () => {
    expect(validateTrip(draft, null)).toHaveProperty('units');
    expect(validateTrip(draft, { weight: '', effort: 'hours' })).toHaveProperty('units');
  });
  it('requires complete optional coordinates and preserves valid zero/boundary coordinates', () => {
    expect(validateTrip({ ...draft, latitude: '10', longitude: '' }, units)).toHaveProperty('longitude');
    expect(validateTrip({ ...draft, latitude: '91', longitude: '181' }, units)).toHaveProperty('latitude');
    expect(tripFromDraft({ ...draft, latitude: '0', longitude: '-180' }, units).gps).toEqual({ latitude: 0, longitude: -180 });
  });
  it('requires a correction explanation and restores exact report values', () => {
    expect(validateTrip(draft, units, true)).toHaveProperty('correctionReason');
    expect(validateTrip({ ...draft, correctionReason: 'Corrected measured weight' }, units, true)).toEqual({});
    expect(tripFromDraft(draftFromReport(report), report.trip.units)).toEqual(report.trip);
  });
});

describe('account-scoped report presentation', () => {
  it('does not grant assistance through a populated subject list alone', () => {
    const denied = { ...context, permittedFishers: [{ id: 'other', label: 'Other' }] };
    expect(permittedSubjects(denied)).toEqual([context.self]);
    expect(() => assertReportAction(denied, 'other', null)).toThrow(/access/);
  });
  it('permits only explicitly scoped assistance subjects', () => {
    const allowed: ReportingContext = { ...context, assistance: 'allowed', permittedFishers: [{ id: 'permitted', label: 'Permitted' }] };
    expect(() => assertReportAction(allowed, 'permitted', null)).not.toThrow();
    expect(() => assertReportAction(allowed, 'unrelated', null)).toThrow();
  });
  it('checks explicit create and correction capabilities independently', () => {
    const noCreate = { ...context, canCreate: false };
    expect(() => assertReportAction(noCreate, 'owner', null)).toThrow(/permission/);
    expect(() => assertReportAction(noCreate, 'owner', report)).not.toThrow();
    expect(() => assertReportAction({ ...context, reports: [{ ...report, canCorrect: false }] }, 'owner', report)).toThrow(/Correction/);
    expect(() => assertReportAction(context, 'owner', { ...report, revision: 'old' })).toThrow(/Correction/);
    expect(() => assertReportAction(context, 'owner', { ...report, id: 'unrelated' })).toThrow(/Correction/);
  });
  it('accepts distinct pending, flagged and reviewed outcomes without promoting them', () => {
    for (const state of ['pending', 'flagged', 'reviewed'] as const) {
      expect(readReportingContext({ ...context, reports: [{ ...report, state }] }, 'owner').reports[0].state).toBe(state);
    }
  });
  it.each([
    { ...context, actorId: 'wrong' }, { ...context, self: { id: 'wrong', label: 'Wrong' } },
    { ...context, reports: [{ ...report, fisherId: 'unrelated' }] },
    { ...context, reports: [report, report] }, { ...context, units: { weight: '', effort: '' } },
    { ...context, reports: [{ ...report, state: 'eligible' }] }, { ...context, reports: [{ ...report, trip: { ...trip, weight: -1 } }] },
    { ...context, reports: [{ ...report, trip: { ...trip, gps: {} } }] },
  ])('fails closed for malformed/cross-account history %#', value => {
    expect(() => readReportingContext(value, 'owner')).toThrow();
  });
});

describe('save acknowledgement matching', () => {
  it('accepts only a matching complete acknowledgement', () => {
    expect(confirmedReport({ requestId: command.requestId, report }, command)).toEqual(report);
  });
  it.each([{}, { success: true }, { requestId: 'wrong', report },
    { requestId: command.requestId, report: { ...report, id: '' } },
    { requestId: command.requestId, report: { ...report, fisherId: 'other' } },
    { requestId: command.requestId, report: { ...report, enteredBy: 'other' } },
    { requestId: command.requestId, report: { ...report, trip: { ...trip, weight: 3 } } },
    { requestId: command.requestId, report: { ...report, trip: { ...trip, units: { ...units, effort: 'changed unit' } } } },
  ])('never claims a save from malformed/mismatched response %#', response => {
    expect(() => confirmedReport(response, command)).toThrow();
    expect(draft.weight).toBe('2.5');
  });
  it('requires the same report ID and a new revision for a correction', () => {
    const correction = { ...command, correction: { reportId: report.id, revision: report.revision, reason: 'Measured again' } };
    expect(() => confirmedReport({ requestId: command.requestId, report }, correction)).toThrow();
    expect(() => confirmedReport({ requestId: command.requestId, report: { ...report, id: 'different', revision: '2' } }, correction)).toThrow();
    expect(confirmedReport({ requestId: command.requestId, report: { ...report, revision: '2', state: 'flagged' } }, correction).state).toBe('flagged');
  });
});
