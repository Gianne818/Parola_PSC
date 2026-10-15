# REG-02-SON registration contract proposal

Status: **Draft, not an approved C03/D02 contract.** Son selected REG-02-SON in this chat. Live verification, consent persistence and assisted access remain pending; this document does not enable them.

## Existing behavior and independent hardening

- The public registration route creates a profile through direct PostgreSQL or FastAPI. It does not prove phone ownership or collect messaging consent.
- FastAPI password login returns a profile, not a Supabase JWT. The current UI stores a separate local login flag and supports offline registration; neither grants server access.
- Protected Next.js profile operations validate a Supabase JWT. Ownership must use Auth's confirmed phone, never caller-editable `user_metadata.phone_number`. The existing admin bypass remains unchanged; it is not an approved assisted-enrollment workflow.
- Invalid coordinate types and invalid clock times must fail before persistence. An outdated schema must not silently remove a supplied password and create an account anyway.

## Decisions requested from Son

1. **Verification route:** Supabase SMS OTP (recommended because protected routes already use Supabase JWTs), an iPROG code/session implementation, or pending registration with live verification deferred. Provider configuration/capability and real verification evidence are required before live enrollment.
2. **Assistance:** keep helper access disabled (recommended initially), or specify the permitted helper roles, enrollment/edit scope, consent authority and revocation behavior. No user-supplied actor ID or role establishes authority.

Do not treat these recommendations as approval. Selected-day scheduling/defaults remain REG-01/D01; no changes to them are proposed here.

## Proposed behavior to agree with Tier

- Account creation and live SMS eligibility are separate. A registration response alone must never imply verified contact, messaging consent or successful SMS delivery.
- A hardcoded preview code, local storage and generated licence IDs cannot establish live verification or credentials.
- Contact verification must be server-validated and bound to the exact phone and authenticated actor. Expired, reused, mismatched and rejected verification attempts must fail without changing ownership.
- Store explicit messaging consent separately from account creation and optional sponsor consent, with the accepted version, timestamp and actor; agree the exact fields and revocation contract before migration.
- Legacy accounts have unknown verification/consent unless evidence exists. Do not manufacture confirmation or consent when migrating them.
- Helper operations must check persisted, current scope for the specific fisher and operation and record both identities. Until the scope/process is agreed, no helper endpoint is added.
- Agreed responses should distinguish pending registration, verified contact, consent status, unauthorized access, duplicate account and unavailable service. Return no passwords or verification codes.

## Tier handoff

`REG-02-SON | Tier | components/auth/AuthPage.tsx, context/AppContext.tsx, utils/auth-fetch.ts | replace demo verification with the agreed route; establish the actual server session; collect explicit consent; treat offline registration as an unsaved draft and surface persistence failures | blocks end-to-end live registration | requested, awaiting C03/D02 agreement`

The current client can still display a local success after a backend error. Son has not edited Tier-owned files. The six-character UI password rule and eight-character FastAPI rule also need agreement before client/backend alignment; no new policy is silently chosen here.

## Acceptance checks

- Confirmed owner can access their profile; another owner, metadata-only claim, unconfirmed contact and malformed matching-suffix phone cannot.
- Supplied credentials are not discarded on an old schema; invalid input is rejected before a write.
- Once the live contract is approved: demo/unverified/no-consent contacts cannot enter live dispatch; scoped helpers are attributable and revoked/unrelated helpers fail.

REG-02-SON remains incomplete until its agreed verification/consent/assistance implementation and integration evidence are present.
