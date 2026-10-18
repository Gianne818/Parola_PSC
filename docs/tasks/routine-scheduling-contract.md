# Routine advisory scheduling: SMS-01 / SON-02

Selected by Son on October 18, 2026. This portion implements planning and a
durable queue definition, independently of frontend work. It does not send SMS.

## Behavior

- Use the database clock and the current Asia/Manila calendar day. A selected
  weekday creates one routine request at the saved local time, including seconds.
  The planner includes that day's occurrence before/at/after its time; being due
  is not authorization to send or replay a message. It never plans previous days.
- Empty weekdays pause routine jobs. Only active profiles that pass the existing
  confirmed-contact/current-consent eligibility function qualify; demo accounts
  never become live recipients. Missing/corrupt preferences fail the operation.
- `(user_id, advisory_date)` is the durable identity. Repeated ticks/restarts use
  an upsert, without changing an unchanged job or creating another daily row.
  Only pending/cancelled rows can be replanned; claimed/submitted/final outcomes
  cannot be reset by a subsequent scheduler tick. `planned`/`due` counts describe
  schedule candidates, not the number of remaining unsent queue rows.
- Reconcile unsent jobs against current preferences on each tick: update time,
  language and habitat; cancel jobs for unselected days, revoked eligibility,
  paused users and previous dates. Resuming reuses the same daily identity.
  A port edit does not copy stale coordinates: jobs store no coordinates at all.
- Preserve pelagic, demersal and both preferences. Language is a saved request,
  not evidence that translations are reviewed. No target, message or delivery
  status is fabricated. Critical alerts use a separate future event flow.

## Backend boundary

`POST /api/sms/schedule` requires the existing server admin key. Its body is
`{}` or `{ "dry_run": true }` by default; unknown fields, recipient IDs and
client-provided clocks are rejected. Preview uses a read-only transaction and
returns counts, dates and `sent: 0`, with no individual accounts or phone numbers.
`changed` and `cancelled` are null during preview because no queue changes occur.

Persistence requires `{ "dry_run": false }` plus **all** of:
`PAROLA_ROUTINE_SCHEDULER_ENABLED=true`, `PAROLA_AUTH_MODE=live`,
`PAROLA_SMS_MODE=live`, `IPROG_MOCK_MODE=false`. The guard is repeated in the
backend service. These are not changed by this implementation; current demo
settings remain intact. Even an enabled planner has no provider/OTP calls.

This background scheduler uses the existing direct PostgreSQL pool, independently
of the account-only HTTPS transport. A blocked PostgreSQL connection yields a
redacted 503; it does not fall back, retry a write or report a successful queue.
Concurrent persistence ticks share a PostgreSQL transaction advisory lock;
cancellation and upsert commit together. A commit failure has an uncertain
outcome; the caller receives an error and no automatic retry occurs.

## Database and activation

Migration `07_routine_advisory_jobs.sql` is **prepared, not applied**. It adds only
the routine queue after migrations 02/03, with a profile/date primary key, a
Manila date/time consistency constraint, due-job index, RLS and backend-only
privileges. Browser roles cannot read or mutate it. No existing user/history is
deleted. No cron, trigger, AWS resource or automatic invocation is installed.

Do not activate operational scheduling until database concurrency/rollback/RLS
checks and the consumer handoff below are accepted. Local mocked checks prove
planner/route behavior, not deployed PostgreSQL constraints or delivery.

## Remaining integration / handoff

The October 18 continuation implements an internal delivery ledger in
`lib/routine-delivery.ts` and prepares migration 08; neither migration has been
applied. Tracking additionally requires `PAROLA_ROUTINE_DELIVERY_ENABLED=true`
and all existing live-mode scheduling guards. It is disabled by default and is
not wired to an endpoint, sender, cron or the legacy incoming-feedback webhook.

Claims use the planner's transaction lock, recheck saved preferences/current
consent/due date, and create one attempt per routine profile/day. Submission is
not delivery. Missing/synthetic provider IDs are rejected, duplicate outcome
records are harmless, and ambiguous outcomes remain unknown without automatic
resend. Crash recovery must not turn a stranded claim into another send; operator
reconciliation and a reviewed retry policy remain required. Confirmed rejection
is also held rather than automatically retried in this first tracking portion.

The receipt function is an internal **already-authenticated input boundary**;
it does not itself validate a gateway signature and must never be exposed by
passing raw request JSON to it. A future adapter must verify the actual provider
signature/replay contract and normalize provider states. Persisted event IDs
deduplicate receipts and reject conflicting reuse; unmatched early receipts are
not marked seen. Delivered outcomes never regress on a delayed failure receipt.
No claim or ledger update authorizes fishing guidance or performs an SMS call.

- **Son / SMS-01, SAFE, MAP/GEO:** before any send, reread current preferences,
  contact/consent/active status, valid run, target/area eligibility and current
  safety. Missing essential inputs remain explicitly unavailable; do not invent
  fishing coordinates or silently substitute habitats.
- **Son / SMS-02 / C04:** wire the ledger to a reviewed sender and authenticated
  callback adapter, add operator reconciliation and the approved retry policy,
  then verify transactional/concurrent behavior in PostgreSQL. Agree current-day
  delivery windows and late-job handling before activation. Job/attempt identity
  alone does not establish exactly-once provider delivery. Critical routing,
  segment/sponsor cost accounting and provider configuration remain separate work.
- **Toby / C01, C02:** validated predictions, source freshness and scientific
  safety evidence remain producer inputs. No thresholds/models were changed.
- **Tier / C04:** future scheduling status must distinguish planned/due from
  submitted/delivered. No frontend changes are required by this portion.

SMS-01 and SON-02 remain partial until the outstanding integration is accepted.

## Local evidence

Tracking continuation: 508 network-denied tests in 38 files passed, followed by
61 focused scheduler/tracking/route checks after final review. These exercise
transactional claim/outcome/receipt behavior with mocked storage, including
duplicate and conflicting receipts, delayed failures, early receipts, unknown
outcomes, synthetic message-ID rejection and redacted/zero-row write failures.
The database migrations and provider authentication adapter remain unverified.

485 network-denied tests across 37 files and full TypeScript passed after this
change. The focused planner/API tests cover Manila midnight/due-time boundaries,
weekday pauses, all habitats, invalid stored input, live-mode guards, admin/input
validation, preview read-only behavior, stable repeated job parameters,
preference changes, cancellation and rollback/release/no-retry failures. Queue
SQL has not been executed against a real database; mocked transaction checks do
not establish deployed uniqueness, RLS or concurrent-session behavior.
