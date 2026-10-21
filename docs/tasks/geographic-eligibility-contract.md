# SON-04 / GEO-01 and GEO-02: backend checks, activation pending

Selected by Son on October 18, 2026. Implementation may use labeled fixtures;
real geographic enforcement remains inactive pending verified data/rules and
integration. Entry-point wiring is now implemented behind a server setting;
the setting remains off. No fixture is installed as real marine coverage.

## Prepared storage and authority

Migration `09_geographic_eligibility.sql` is prepared only, not applied. It adds:

- `geographic_dataset_versions`: explicitly sourced/versioned access-area or
  restriction-catalog MultiPolygons, authority, source hash, policy version,
  review provenance and a bounded validity period. Reviewed versions are frozen;
  withdrawal is allowed, while revisions require a new version.
- `geographic_exclusion_zones`: effective-dated exclusion polygons inside a
  catalog's declared coverage. Reviewed zones cannot be overwritten or removed.
  Parent locks serialize zone changes with dataset approval.
- `geographic_access_grants`: backend-verified profile access linking specific
  area/catalog versions, validity, verifying actor and revocation time.

Tables use RLS and backend-only privileges; anonymous/authenticated clients have
no read/write access. The service role can select/insert/update, not delete.
The decision function is backend-only and uses caller privileges. It requires
existing service-side access to `public.users`; it grants no new user-table access.
There is no automatic seed/import, migration runner, activation or public grant API.

The migration also revokes client SELECT on prediction rows and client execution
of the known legacy nearest-hotspot RPC, preserving backend access and all rows.
Coordinate direct Supabase consumers before applying. Other deployed views/RPCs
still require inspection; this prepared migration is not proof that every deployed
direct-read surface has been closed.

Approval is a recorded server decision, not automated verification of authority.
An approved restriction catalog must additionally attest `coverage_complete=true`
before it can support clearance **within its declared coverage only**. The default
is false. Empty or partially collected catalogs do not imply no restrictions.
Known effective exclusions still deny within an approved/current incomplete
catalog; incomplete coverage blocks clearance rather than erasing known exclusions.

## Shared point decision

`checkGeographicEligibility(db, serverProfileId, lat, lon)` calls
`public.parola_geographic_eligibility` using the database statement time. It does
not accept a client region/tier or client-selected clock as authorization.
The caller must resolve profile identity through server authentication first.
UUID syntax alone never establishes ownership or access.

| Result | Conditions |
| --- | --- |
| `allowed / allowed` | Active profile/current verified grant; approved/current area and matching-policy catalog; complete restriction coverage; target strictly inside both; no active linked exclusion. |
| `denied / restricted_area` | Active linked exclusion covers the point, including its boundary. It takes precedence over otherwise allowed areas or missing area data. |
| `denied / outside_permitted_area` | Current approved granted areas exist, but none covers the target. |
| `unavailable / boundary_policy_unresolved` | Target lies on a permitted-area boundary without another applicable interior grant; withhold until the boundary policy is agreed. |
| `unavailable / access_unverified` | No current grant for the active profile, including revocation/inactive account cases. |
| `unavailable / geographic_data_unavailable` | Missing schema/storage, unapproved/withdrawn/expired data, incomplete catalog, policy mismatch or uncovered location. |
| `unavailable / invalid_coordinates` | Missing/nonfinite/out-of-range target or invalid `(0,0)` pair. |

Intervals are start-inclusive/end-exclusive; revocation applies at its timestamp.
Dataset validity and zone effective dates are separate. Withdrawn/expired catalogs
cannot establish current restrictions or clearance. A catalog is applicable through
its server grant, not merely because its polygon overlaps. This foundation does
not claim all national restrictions have been acquired or encoded.

These are withholding rules for an inactive implementation, not approval of legal
exact-boundary semantics. No GT thresholds, vessel classifications, commercial
radii, FMA/EEZ entitlements or authoritative boundaries are inferred.
Home ports are not rejected just because they are on shore; checks apply to targets.

## Prediction integration and operating modes

`loadPredictions(..., { geographicProfileId: serverProfileId, ... })` selects a
separate geographic SQL path. It uses the same date/habitat selection, then
evaluates candidate targets before ranking, counts and limiting. An excluded
nearer target cannot crowd out an allowed farther target. Pelagic and demersal
remain independent; a denied/unavailable model is never replaced with the other.

The response adds `selection.geography`: `not_evaluated`, `filtered`, `partial`
or `unavailable`, plus counts of denied/unavailable candidates before limiting.
Empty inputs remain unavailable. Geographic success does not change
`operational_eligible=false`; run/safety/other release checks remain required.
Missing migration or failed restricted queries never retry unrestricted.

`PAROLA_GEOGRAPHIC_ENFORCEMENT_ENABLED=false` preserves the existing anonymous
preview when `PAROLA_AUTH_MODE=demo`; it reports geography `not_evaluated` and
does not reference migration 09. Live prediction reads return 503 while the
enforcement setting is inactive, rather than serve unrestricted data as live.
Invalid setting values also fail unavailable. No ignored local setting was changed.

When enforcement is enabled, Next.js nearest reads resolve the existing signed
demo cookie or verified Auth session, then read the **persisted profile ID**.
That ID can differ from the Auth ID after account linking. Inactive/missing
profiles fail. Request `user_id`, tier or region values cannot supply authority.
No new login/OTP flow is added. Unknown geographic coverage returns 503; partially
covered results contain only allowed targets and explicit partial metadata.

Legacy FastAPI nearest/species reads use the same setting. Enforced requests
require the existing server-only `X-API-Key` and a trusted proxy assertion in
`X-Parola-Profile-Id`. Browser callers must use the authenticated Next.js API;
the shared secret must never be shipped to a browser. A public `user_id` cannot
override the asserted owner. The shared geographic function filters before
limits; unknown coverage returns 503 rather than an empty successful list.

## SMS and export entry points

Live `/api/sms/send` fishing guidance requires `advisory_id`, without client
message/category overrides. The server reads a current **unsent** persisted
advisory joined to its target and recipient, rechecks recipient consent/actor
eligibility and geographic access, then renders target coordinates from storage.
Unrelated, stale, already-sent or suppressed records fail before the sender.
The route reuses the durable routine job/attempt claim: a pending due eligible
job and the existing scheduler/delivery/live settings are required. A profile/day
claim precedes the provider call, geographic access is rechecked after claiming,
and submitted or unknown outcomes are recorded. Repeated requests cannot send
again through the same claimed job. Ambiguous sends are held for reconciliation.
The existing `NORMAL` check is retained; it does not prove fresh safety inputs
or scientific run validity. Those release gates remain separate requirements.

Free-form live weather/emergency/port warnings require operator authentication;
they do not become geographically approved fishing guidance. Their delivery is
independent of fishing-area coverage, so missing marine boundaries do not block
operator warnings. User-authored free-form live messages are rejected. Demo
messages remain simulated, and the provider service forces mock mode whenever
Auth or SMS mode is explicitly `demo`, including after a runtime mock toggle.
No paid send was performed or activated. Real PostgreSQL concurrency, operator
reconciliation, provider receipts and fresh safety validation remain separate
SON-02/03 integration checks. Migration 09 does not install migrations 07/08 or
activate the existing scheduler/delivery settings needed by this route.

`GET /api/advisories/export` provides a basic GeoJSON export of the current stored
prediction response, using the same query parameters and guarded nearest handler
in-process, without an HTTP/provider call. It requires an authenticated persisted
account, preserves longitude/latitude order and both habitats, refuses partial/
unknown geographic coverage and carries unverified/non-operational metadata.
Only `filtered` geography is accepted, except for explicit demo preview labeled
`export_mode=demo_preview`. Missing/unknown geography is rejected. Live reads
require activated enforcement; all exports remain scientifically unverified.
It is not a commercial Geo-Pack, forecast, entitlement system or device import
certification. Tier's existing local sample-download UI is unchanged; frontend
wiring to this endpoint remains a Tier handoff.

## Verification and remaining work

Focused tests check decision preservation, malformed identity/coordinates,
storage failures, inconsistent decisions and no unrestricted fallback. Local
in-memory PostgreSQL fixtures execute the migration, triggers, privileges and
geographic query with rectangular geometry/clock substitutes. They cover effective
closures, boundary withholding, owner isolation, revocation/expiry, incomplete
coverage, version freezing and filtering before limits for each habitat and both.
They do not validate PostGIS topology, holes, real sources, deployed schema or
concurrent sessions. The local fixture passes 47 checks, including denial of the
known raw client prediction/RPC paths. The full network-denied suite passes 618
tests across 43 files; 50 Python API/schema tests also pass. Entry-point tests
cover server profile resolution, unknown coverage, trusted proxy identity,
export labeling, repeat-send prevention and demo provider guards. Full TypeScript,
tracked/changed-file secret scans and whitespace checks pass. Final independent
spec/standards reviews found no remaining blocker in this inactive implementation.
See [Son's log](son.md).

Before activation, Son must obtain/review authoritative versioned marine and
restriction coverage; record D05/D08 and approved account/vessel scope rules;
verify the migration and spatial/concurrency/privilege behavior in an approved
disposable PostGIS database; verify the implemented API/SMS/export checks with
real authorized inputs and the remaining run/safety gates; and explicitly
coordinate activation. Public preview is not a
substitute for those operational entry points. GEO-03 recommendation accounting,
ocean-mask approval and scientific run validity remain separate work.

Tier can continue frontend work independently; future UI integration consumes
actual allowed/denied/unavailable results without granting access through selectors.
No paid provider, live SMS, production SQL, AWS action, dependency install or
remote setting change was used for this implementation.
