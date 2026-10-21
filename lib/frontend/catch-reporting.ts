// Frontend view models and an injectable UI boundary, not an approved API schema.
// SON-05 must supply the production transport; TOBY-06 must approve units/meaning.
export interface ReportUnits { weight: string; effort: string }
export interface TripDraft {
  date: string; area: string; species: string; weight: string; effort: string;
  latitude: string; longitude: string; correctionReason: string;
}
export interface TripData {
  date: string; area: string; species: string; weight: number; effort: number;
  gps: { latitude: number; longitude: number } | null; units: ReportUnits;
}
export type ReviewState = 'pending' | 'flagged' | 'reviewed';
export interface CatchReport {
  id: string; fisherId: string; enteredBy: string; revision: string;
  state: ReviewState; reviewNote: string | null; canCorrect: boolean; trip: TripData;
}
export interface ReportSubject { id: string; label: string }
export interface ReportingContext {
  actorId: string; self: ReportSubject; canCreate: boolean;
  assistance: 'allowed' | 'denied' | 'unavailable';
  permittedFishers: ReportSubject[]; units: ReportUnits | null; reports: CatchReport[];
}
export interface ReportCommand {
  actorId: string; fisherId: string; requestId: string; trip: TripData;
  correction: { reportId: string; revision: string; reason: string } | null;
}
export interface ReportingPort {
  load: (actorId: string) => Promise<unknown>;
  submit: (command: ReportCommand) => Promise<unknown>;
}
export type DraftErrors = Partial<Record<keyof TripDraft | 'units', string>>;

export const REPORTING_UNAVAILABLE = 'Report saving and history are unavailable. Your draft has not been submitted.';
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
export const validUnits = (value: unknown): value is ReportUnits => object(value) && text(value.weight) && text(value.effort);

export function blankTrip(): TripDraft {
  return { date: '', area: '', species: '', weight: '', effort: '', latitude: '', longitude: '', correctionReason: '' };
}
function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value.slice(0, 4) !== '0000'
    && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
}
function decimal(value: string): number | null {
  return /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value.trim()) && Number.isFinite(Number(value)) ? Number(value) : null;
}
function coordinate(value: string, limit: number) {
  return /^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value.trim()) && Number.isFinite(Number(value)) && Math.abs(Number(value)) <= limit;
}
export function validateTrip(draft: TripDraft, units: ReportUnits | null, correction = false): DraftErrors {
  const errors: DraftErrors = {};
  try { if (!validDate(draft.date)) errors.date = 'Enter a valid trip date.'; }
  catch { errors.date = 'Enter a valid trip date.'; }
  if (!draft.area.trim()) errors.area = 'Describe the approximate fishing area.';
  if (!validUnits(units)) errors.units = 'Weight and effort units are unavailable. This draft cannot be submitted.';
  const weight = decimal(draft.weight);
  if (weight === null) errors.weight = 'Enter a nonnegative weight, including 0 for no catch.';
  if (weight !== 0 && !draft.species.trim()) errors.species = 'Enter the reported species.';
  if (decimal(draft.effort) === null) errors.effort = 'Enter a nonnegative effort value in the displayed unit.';
  if (draft.latitude.trim() || draft.longitude.trim()) {
    if (!coordinate(draft.latitude, 90)) errors.latitude = 'Enter a latitude from −90 to 90, or remove both coordinates.';
    if (!coordinate(draft.longitude, 180)) errors.longitude = 'Enter a longitude from −180 to 180, or remove both coordinates.';
  }
  if (correction && !draft.correctionReason.trim()) errors.correctionReason = 'Explain what needs correcting.';
  return errors;
}
export function tripFromDraft(draft: TripDraft, units: ReportUnits): TripData {
  if (Object.keys(validateTrip(draft, units)).length) throw new Error('Check the highlighted trip fields.');
  return { date: draft.date, area: draft.area.trim(), species: draft.species.trim(), weight: Number(draft.weight), effort: Number(draft.effort),
    gps: draft.latitude.trim() || draft.longitude.trim() ? { latitude: Number(draft.latitude), longitude: Number(draft.longitude) } : null,
    units: { ...units } };
}
export function draftFromReport(report: CatchReport): TripDraft {
  return { ...blankTrip(), date: report.trip.date, area: report.trip.area, species: report.trip.species,
    weight: String(report.trip.weight), effort: String(report.trip.effort),
    latitude: report.trip.gps ? String(report.trip.gps.latitude) : '', longitude: report.trip.gps ? String(report.trip.gps.longitude) : '' };
}
export function permittedSubjects(context: ReportingContext): ReportSubject[] {
  return [context.self, ...(context.assistance === 'allowed' ? context.permittedFishers : [])];
}
function readReport(value: unknown): CatchReport {
  if (!object(value) || !text(value.id) || !text(value.fisherId) || !text(value.enteredBy) || !text(value.revision)
    || !['pending', 'flagged', 'reviewed'].includes(String(value.state)) || typeof value.canCorrect !== 'boolean'
    || !(value.reviewNote === null || typeof value.reviewNote === 'string') || !object(value.trip)) throw new Error('Report details could not be confirmed.');
  const trip = value.trip;
  if (!text(trip.date) || !text(trip.area) || typeof trip.species !== 'string' || !finite(trip.weight) || !finite(trip.effort)
    || !validUnits(trip.units) || !(trip.gps === null || (object(trip.gps) && finite(trip.gps.latitude) && finite(trip.gps.longitude)))) {
    throw new Error('Report values could not be confirmed.');
  }
  const report = value as unknown as CatchReport;
  if (Object.keys(validateTrip(draftFromReport(report), report.trip.units)).length) throw new Error('Report values could not be confirmed.');
  return report;
}
export function readReportingContext(value: unknown, actorId: string): ReportingContext {
  const subject = (item: unknown): item is ReportSubject => object(item) && text(item.id) && text(item.label);
  if (!text(actorId) || !object(value) || value.actorId !== actorId || !subject(value.self) || value.self.id !== actorId
    || typeof value.canCreate !== 'boolean' || !['allowed', 'denied', 'unavailable'].includes(String(value.assistance))
    || !Array.isArray(value.permittedFishers) || !value.permittedFishers.every(subject)
    || !(value.units === null || validUnits(value.units)) || !Array.isArray(value.reports)) throw new Error('Reporting access could not be confirmed.');
  const context = value as unknown as ReportingContext;
  const subjects = permittedSubjects(context).map(item => item.id);
  if (new Set(subjects).size !== subjects.length) throw new Error('Reporting access could not be confirmed.');
  const reports = context.reports.map(readReport);
  if (reports.some(report => !subjects.includes(report.fisherId)) || new Set(reports.map(report => report.id)).size !== reports.length) {
    throw new Error('Report history is outside the confirmed account scope.');
  }
  return { ...context, reports };
}
export function assertReportAction(context: ReportingContext, fisherId: string, correction: CatchReport | null) {
  if (!permittedSubjects(context).some(subject => subject.id === fisherId)) throw new Error('You do not have reporting access for this fisher.');
  if (correction) {
    const saved = context.reports.find(report => report.id === correction.id && report.fisherId === fisherId);
    if (!saved?.canCorrect || saved.revision !== correction.revision) throw new Error('Correction access is unavailable. Reload report history.');
  } else if (!context.canCreate) throw new Error('You do not have permission to submit reports.');
}
function sameTrip(left: TripData, right: TripData) {
  return left.date === right.date && left.area === right.area && left.species === right.species && left.weight === right.weight
    && left.effort === right.effort && left.units.weight === right.units.weight && left.units.effort === right.units.effort
    && left.gps?.latitude === right.gps?.latitude && left.gps?.longitude === right.gps?.longitude;
}
export function confirmedReport(value: unknown, command: ReportCommand): CatchReport {
  if (!object(value) || value.requestId !== command.requestId) throw new Error('The submission could not be confirmed. Your draft has been kept.');
  const report = readReport(value.report);
  if (report.fisherId !== command.fisherId || report.enteredBy !== command.actorId || !sameTrip(report.trip, command.trip)
    || (command.correction && (report.id !== command.correction.reportId || report.revision === command.correction.revision))) {
    throw new Error('The submission response did not match this draft. Your draft has been kept.');
  }
  return report;
}
