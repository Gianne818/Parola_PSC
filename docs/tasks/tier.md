# Tier's six work packages

Owner: **Tier only**. Updated October 17, 2026. [Hub](../../fixplan.md) | [Shared rules](shared.md) | [Historical checklist/progress](tier-history.md)

## Start here

- Use identity explicitly stated in this chat; otherwise ask **Who are you working as: Tier, Son, or Toby?** and wait.
- Select one package or requested portion. A legacy ID selects only its mapped portion. For general continue requests, propose a ready owned portion and establish selection before coding.
- Read current code first and reuse completed work. This branch includes PR #14 merge `50ac338` and preserves PR #2 frontend work; other branch-only work remains historical/recoverable.
- Missing producer runtime does not block owned fixture-tested implementation. Record the exact integration need; never edit another owner to unblock yourself.
- Preserve branded screens, onboarding/navigation, habitats and the [PR #14 authentication baseline](shared.md#preservation-and-authentication-baseline). A task is not permission to redesign auth.
- Use `codex/tier/<package>` branches and focused PRs. A package can span several PRs. No installs, paid services, real SMS or deployments without explicit authorization.

## Allowed files

**UI:** app/** except app/api/**; components/**, hooks/**, context/**, public/** and UI tests.
**CLIENT:** owned services/utils, lib/frontend/**, dashboard/updates helpers and tests; exact exceptions in shared rules. Frontend-local models/types/adapters are Tier-owned. Shared API schemas, configuration and dependencies remain Son-owned.

## Packages

All packages remain unchecked: reorganization is not implementation evidence. **Member delivery** and **integrated acceptance** are tracked separately. Original priorities, acceptance criteria and concept-note evidence remain binding in the references. Acceptance scenarios can use isolated fixtures for owned delivery; real account/database/provider/model behavior belongs to integrated acceptance. State what was actually checked. Each package includes its own accessibility where applicable; no package waits for TIER-06 common practices.

<a id="tier-01"></a>
### TIER-01: Account, onboarding and settings

- [ ] **TIER-01 | P0 | Delivery: independent selected frontend portions complete | Integration: pending runtime/manual acceptance**
- **Covers:** [REG-01-TIER](tier-history.md#reg-01-tier), [REG-02-TIER](tier-history.md#reg-02-tier).
- **Allowed files:** UI, CLIENT above, limited by the exact shared ownership map.
- **Work:** Preserve branded registration/sign-in and the agreed demo OTP journey. Complete home-port, weekday/time, habitat, language and settings forms with honest draft/save/error states.
- **Start / prerequisites:** Existing UI/responses now; isolated editor work needs no new backend. C03 applies only to new persisted fields or changed authority.
- **Acceptance:** Registration → onboarding → dashboard; password-only later sign-in; logout/reload; approved weekday limits including sixth-day errors; port edits retain habitat/settings.
- **Integration handoff:** SON-01: canonical profile/preferences, authority, consent and persistence. Preserve PR #14, do not rebuild auth.

<a id="tier-02"></a>
### TIER-02: Dashboard, maps and prediction presentation

- [ ] **TIER-02 | P0 | Delivery: independent frontend portions complete | Integration: pending contract/runtime/manual acceptance**
- **Covers:** [DATA-01-TIER](tier-history.md#data-01-tier), [DATA-02-TIER](tier-history.md#data-02-tier), [DATA-03-TIER](tier-history.md#data-03-tier), [DATA-04-TIER](tier-history.md#data-04-tier), [MAP-01-TIER](tier-history.md#map-01-tier), [MAP-02-TIER](tier-history.md#map-02-tier), [MAP-03-TIER](tier-history.md#map-03-tier), [OPS-01-TIER](tier-history.md#ops-01-tier), [GEO-03-TIER](tier-history.md#geo-03-tier).
- **Allowed files:** UI, CLIENT above, limited by the exact shared ownership map.
- **Work:** Complete map/dashboard controls, coordinate validation, habitat/species selection, dates, provenance, quality/coverage and loading/empty/error states. Unsupported fields stay unavailable.
- **Start / prerequisites:** Use current responses and frontend-local adapters now; fixtures cover missing states. Scientific validity and operational ranking stay external.
- **Acceptance:** Malformed targets rejected; pelagic/demersal/both retained; retrieval/generation/validity distinct; missing depth/features stay unknown; no fabricated replacement targets.
- **Integration handoff:** SON-04 / TOBY-01,02,03,05: validated runs, masking, features, ranking and distribution (C01/C06).

<a id="tier-03"></a>
### TIER-03: Safety, alerts and messaging status

- [ ] **TIER-03 | P0 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [SAFE-01-TIER](tier-history.md#safe-01-tier), [SAFE-02-TIER](tier-history.md#safe-02-tier), [SAFE-03-TIER](tier-history.md#safe-03-tier), [SMS-01-TIER](tier-history.md#sms-01-tier), [SMS-02-TIER](tier-history.md#sms-02-tier), [SMS-03-TIER](tier-history.md#sms-03-tier).
- **Allowed files:** UI, CLIENT above, limited by the exact shared ownership map.
- **Work:** Present warning sources/times, unavailable safety, routine versus any-day critical alerts, delivery stages and segment/cost explanations. Consume authoritative decisions.
- **Start / prerequisites:** Existing responses and isolated display fixtures now; live SMS is unnecessary for frontend completion. No invented safety thresholds.
- **Acceptance:** Hazard/unknown states suppress fishing guidance; valid official warnings survive weather outages; queued is not delivered; off-schedule alerts remain separate.
- **Integration handoff:** SON-02,03 / TOBY-04: safety/warning applicability, schedule, receipt/cost states (C02/C04).

<a id="tier-04"></a>
### TIER-04: Catch reporting and assisted-entry screens

- [ ] **TIER-04 | P1 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [REPORT-01-TIER](tier-history.md#report-01-tier), [REPORT-02-TIER](tier-history.md#report-02-tier).
- **Allowed files:** UI, CLIENT above, limited by the exact shared ownership map.
- **Work:** Build voluntary trip date, approximate area/optional GPS, species, weight including zero, effort, review/correction and allowed/denied assisted states.
- **Start / prerequisites:** Forms and fixture checks now; unresolved units/permissions stay pending. Connect real submission only through available agreed endpoints.
- **Acceptance:** Zero catch accepted; negative/invalid values rejected; GPS optional; failed submission preserves draft without saved claim; unauthorized helpers cannot act.
- **Integration handoff:** SON-05 / TOBY-06: persistence/review/assistance, units and reviewed-data eligibility (C05/C08).

<a id="tier-05"></a>
### TIER-05: Vessel, geographic-access and export screens

- [ ] **TIER-05 | P0 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [GEO-01-TIER](tier-history.md#geo-01-tier), [GEO-02-TIER](tier-history.md#geo-02-tier), [ENT-01-TIER](tier-history.md#ent-01-tier), [ENT-02-TIER](tier-history.md#ent-02-tier).
- **Allowed files:** UI, CLIENT above, limited by the exact shared ownership map.
- **Work:** Build vessel/plan/zone/access and export request/status views with denied, unavailable, quota and expiry states. Separate product restrictions from verified legal requirements.
- **Start / prerequisites:** Current capability responses and isolated future-state fixtures now; no payments, live unlocking or dataset invention.
- **Acceptance:** Unknown entitlement stays unavailable; quota/zone/expiry errors clear; no unsupported forecast/device claim; server authorization still required.
- **Integration handoff:** SON-04,06 / TOBY-06: scope, verified vessels, entitlements, locks, quotas and real artifacts (C06/C07).

<a id="tier-06"></a>
### TIER-06: Public information, accessibility, languages and privacy presentation

- [ ] **TIER-06 | P1 | Delivery: needs verification | Integration: needs verification**
- **Covers:** [UI-01-TIER](tier-history.md#ui-01-tier), [UI-02-TIER](tier-history.md#ui-02-tier), [PRIV-01-TIER](tier-history.md#priv-01-tier), [EVAL-01-TIER](tier-history.md#eval-01-tier).
- **Allowed files:** UI, CLIENT above, limited by the exact shared ownership map.
- **Work:** Maintain truthful landing/pricing/guides, reusable accessible interactions, regional copy and privacy/evaluation presentation. Other packages own their screen-specific accessibility.
- **Start / prerequisites:** Existing behavior/copy can be reviewed now. Pilot language approval and measured outcomes remain separate evidence.
- **Acceptance:** Keyboard/focus/errors, mobile and 200% zoom checked; record speech/device/language manual checks; no unverified savings/accuracy/live claims or private catch locations.
- **Integration handoff:** SON-01,05,06 / TOBY-06: permissions, capabilities and de-identified measured outcomes (C08); terminology reviewers.

## Existing progress and next selection

- PR #2 contains independent truthful-copy, coordinate, fabrication-removal, provenance/safety-display and automated accessibility portions. Keep these; do not reassign them from scratch.
- Manual accessibility/translation acceptance and live integration were not established by isolated checks. Inspect remaining selected work before implementation.
- Later REG-01/REG-02/restoration batches are recoverable history, not assumed present here. Six pre-existing untracked restoration files remain untouched.
- Suggested next independent selection: remaining TIER-06 review or a missing TIER-04 form portion. TIER-01 does not authorize rebuilding authentication.

## Legacy lookup and deferred work

Each original assignment maps once below. Historical labels do not establish current completion; full criteria/logs remain in the archive and [detailed proposal](../reference/fixplan-detail.md).

| Original assignment / anchor | Current package or disposition | Historical priority / status |
| --- | --- | --- |
| <a id="reg-01-tier"></a>[REG-01-TIER](tier-history.md#reg-01-tier) | [TIER-01](#tier-01) | P1 / Partial |
| <a id="reg-02-tier"></a>[REG-02-TIER](tier-history.md#reg-02-tier) | [TIER-01](#tier-01) | P0 / Partial |
| <a id="sms-01-tier"></a>[SMS-01-TIER](tier-history.md#sms-01-tier) | [TIER-03](#tier-03) | P1 / Partial |
| <a id="sms-02-tier"></a>[SMS-02-TIER](tier-history.md#sms-02-tier) | [TIER-03](#tier-03) | P0 / Partial |
| <a id="sms-03-tier"></a>[SMS-03-TIER](tier-history.md#sms-03-tier) | [TIER-03](#tier-03) | P1 / Partial |
| <a id="safe-01-tier"></a>[SAFE-01-TIER](tier-history.md#safe-01-tier) | [TIER-03](#tier-03) | P0 / Partial |
| <a id="safe-02-tier"></a>[SAFE-02-TIER](tier-history.md#safe-02-tier) | [TIER-03](#tier-03) | P0 / Partial |
| <a id="safe-03-tier"></a>[SAFE-03-TIER](tier-history.md#safe-03-tier) | [TIER-03](#tier-03) | P0 / Partial |
| <a id="data-01-tier"></a>[DATA-01-TIER](tier-history.md#data-01-tier) | [TIER-02](#tier-02) | P0 / Planned |
| <a id="data-02-tier"></a>[DATA-02-TIER](tier-history.md#data-02-tier) | [TIER-02](#tier-02) | P0 / Planned |
| <a id="data-03-tier"></a>[DATA-03-TIER](tier-history.md#data-03-tier) | [TIER-02](#tier-02) | P0 / Planned |
| <a id="data-04-tier"></a>[DATA-04-TIER](tier-history.md#data-04-tier) | [TIER-02](#tier-02) | P1 / Planned |
| <a id="map-01-tier"></a>[MAP-01-TIER](tier-history.md#map-01-tier) | [TIER-02](#tier-02) | P0 / Partial |
| <a id="map-02-tier"></a>[MAP-02-TIER](tier-history.md#map-02-tier) | [TIER-02](#tier-02) | P1 / Partial |
| <a id="map-03-tier"></a>[MAP-03-TIER](tier-history.md#map-03-tier) | [TIER-02](#tier-02) | P1 / Partial |
| <a id="ops-01-tier"></a>[OPS-01-TIER](tier-history.md#ops-01-tier) | [TIER-02](#tier-02) | P1 / Partial |
| <a id="report-01-tier"></a>[REPORT-01-TIER](tier-history.md#report-01-tier) | [TIER-04](#tier-04) | P1 / Planned |
| <a id="report-02-tier"></a>[REPORT-02-TIER](tier-history.md#report-02-tier) | [TIER-04](#tier-04) | P1 / Planned |
| <a id="eval-01-tier"></a>[EVAL-01-TIER](tier-history.md#eval-01-tier) | [TIER-06](#tier-06) | P1 / Planned |
| <a id="geo-01-tier"></a>[GEO-01-TIER](tier-history.md#geo-01-tier) | [TIER-05](#tier-05) | P0 / Planned |
| <a id="geo-02-tier"></a>[GEO-02-TIER](tier-history.md#geo-02-tier) | [TIER-05](#tier-05) | P1 / Planned |
| <a id="geo-03-tier"></a>[GEO-03-TIER](tier-history.md#geo-03-tier) | [TIER-02](#tier-02) | P1 / Planned |
| <a id="ent-01-tier"></a>[ENT-01-TIER](tier-history.md#ent-01-tier) | [TIER-05](#tier-05) | P2 / Planned |
| <a id="ent-02-tier"></a>[ENT-02-TIER](tier-history.md#ent-02-tier) | [TIER-05](#tier-05) | P2 / Partial |
| <a id="road-01-tier"></a>[ROAD-01-TIER](tier-history.md#road-01-tier) | Deferred; separate prioritization required | P2 / Deferred |
| <a id="ui-01-tier"></a>[UI-01-TIER](tier-history.md#ui-01-tier) | [TIER-06](#tier-06) | P1 / Partial |
| <a id="ui-02-tier"></a>[UI-02-TIER](tier-history.md#ui-02-tier) | [TIER-06](#tier-06) | P1 / Partial |
| <a id="priv-01-tier"></a>[PRIV-01-TIER](tier-history.md#priv-01-tier) | [TIER-06](#tier-06) | P1 / Partial |
| <a id="ux-01-tier"></a>[UX-01-TIER](tier-history.md#ux-01-tier) | Deferred; separate prioritization required | P2 / Deferred |
| <a id="leg-02-tier"></a>[LEG-02-TIER](tier-history.md#leg-02-tier) | Deferred; separate prioritization required | P2 / Deferred |

## Delivery log and integration handoffs

Log selected portions with package/legacy IDs, changed files, automated/manual evidence, remaining work and PR. Mark only proven-complete member delivery; integration may stay pending. Never mark another owner complete.

### TIER-01 / REG-01-TIER, REG-02-TIER — October 17, 2026

Selected frontend portions only. Review branch: `codex/tier/tier-01`, based on refreshed `origin/main` at PR #14 merge `50ac338`. Tier authorized committing, pushing and opening a draft PR into main; merge remains unauthorized. TIER-02 and unrelated uncommitted work remain in the original checkout, outside this PR.

**Integrated baseline:** Fetched `origin/main`, inspected PR #14 head `3b847152721aa30163f000f269627598674d1d4d`, and fast-forwarded to its merge `50ac338` without a merge commit. This supersedes the older PR #2-only checkout notes. All six pre-existing modified documents and six untracked restoration files were backed up and hash-verified. The sole overlap, `docs/tasks/son.md`, was resolved with explicit user approval: keep the compact plan and append the remote notes/checklist verbatim. Other original files were preserved; the untracked restoration files remain unused and unchanged.

- [x] **Frontend delivery: profile/preferences portion.** Settings now edits 0–5 distinct weekdays, Manila time (retaining existing seconds), message language and pelagic/demersal/both. Sixth-day attempts are rejected visibly; zero days pauses routine messages only. Draft, saving, confirmed, unavailable, discard, reload and recoverable failure states are separate. Device readability remains immediate and separate from message language. English fallback/unreviewed translations, critical-warning independence and lack of SMS enrollment/delivery confirmation are explicit.
- [x] **Frontend delivery: home-port/readback portion.** Server account ID, habitat and regional location are hydrated. Writes consume actual server readback; port-only payloads omit unrelated fields. Failed saves preserve drafts; malformed acknowledgements cannot claim success. Duplicate requests and stale/cross-account acknowledgements cannot apply. Missing schedules stay unavailable and unsupported habitats never default to `both`. Device-cache failure after a confirmed port save is reported as a cache issue.
- **Reused:** PR #14's branded auth screens, 1–6 digit demo code without OTP/provider calls, password sign-in and cookie-based account restoration; PR #2 onboarding, dashboard/navigation and accessibility. No auth screen, normal route replacement, API, shared type, dependency, configuration or migration was implemented in this frontend portion.
- **Application files:** `app/settings/page.tsx`, `components/settings/AdvisoryPreferencesEditor.tsx`, `components/settings/preferences.module.css`, `components/onboarding/HomePortOnboarding.tsx`, `context/AppContext.tsx`, `lib/frontend/profile-client.ts`.
- **Checks/files:** `tests/frontend/profile-client.test.ts`, `tests/frontend/browser/tier-01-fixture.tsx`, `tests/frontend/browser/tier-01-checks.mjs`, plus `--tier-01` in the existing browser runner. Earlier isolated checks passed; the exact PR checkout was rechecked as recorded below. Offline Chromium: 30 TIER-01 named checks; existing regression suite: 85 named checks plus 39 forward/reverse Tab assertions. Real provider/settings/onboarding run against in-memory owner responses; external services, map loading and Next routing are isolated. Cases cover sixth-day rejection, keyboard focus, failed save/retry, duplicate submission, pause, port/preference retention, provider remount, malformed/unknown responses, cache failure, desktop/390px/320px and enlarged root-text/zoom-equivalent viewports. These do not prove real Next routing or authentication/database integration.
- **PR verification:** Full checkout TypeScript (`tsc --noEmit --incremental false`) passes with no exclusions or diagnostics. Scoped ESLint on all changed TS/TSX/MJS files reports zero errors and one existing `react-hooks/exhaustive-deps` cleanup warning in `AppContext.tsx`. Whitespace check passes. Offline Chrome 155: 30 TIER-01 checks; 85 existing regression checks plus 39 forward/reverse Tab assertions. Initial sandbox Chrome startup failed in Crashpad; the same guarded runner passed with process execution approval and removed its temporary profiles. No dependencies installed. No production build or live Next-route/database test was run. Unit-test commands/results are recorded in the PR preparation entry below.
- **Remaining:** Real registration → demo code → onboarding → dashboard → sign-out → password sign-in → dashboard; real database save/readback/reload and demo/live authorization; actual browser 200% zoom, screen-reader speech, human touch/visual and pilot-language review. No live SMS, database operations, installs, paid services or deployments. Commit/push/draft-PR publication is authorized for this review batch only. Successful synthetic responses exist only in tests. Full TIER-01 remains unchecked; scoped frontend completion is separate from parent/integrated acceptance.

| From package / portion | Producer → consumer | Missing interface and example | Integration status / evidence |
| --- | --- | --- | --- |
| TIER-01 / REG-01-TIER, REG-02-TIER | SON-01 → Tier | C03 profile/preferences interface is available in PR #14 and `advisory-preferences-contract.md`; no new wire contract is needed. Remaining evidence: authenticated zero/five-day save/readback, seconds/language/all habitats retained after port-only updates and reload, 401/403/503/config/migration failures remain errors, and real cookie registration/password/login/logout account ownership. | Pending runtime; isolated frontend checks pass. Consolidates the earlier REG-01 C03 profile handoff. No database/provider or real Next-route operations were run. |

Historical requests remain preserved in the archive. Add each still-applicable interface here once with its producer/consumer and acceptance evidence. Do not copy blanket gates onto every package.

### TIER-01 draft-PR preparation — October 17, 2026

- **Separation:** Created isolated checkout `scratch/tier-01-review` on the existing `codex/tier/tier-01` branch. Copied the ten application/test files from the hash-recorded pre-TIER-02 snapshot; curated this log from `origin/main` plus the TIER-01 entry. Shared browser runner contains only its TIER-01 extension. The original 36 changed/untracked files were backed up and hash-recorded before preparation; their bytes are preserved. No TIER-02 dashboard/map/adapter changes, unused auth-restoration files, shared rules, Son/Toby logs, root configuration or dependency manifests are included.
- **Focused tests:** 92 tests pass in 10 suites: `tests/frontend/{profile-client,coordinates,accessibility,claims,provenance,map-presentation,weather-presentation}.test.ts`, `app/onboarding/home-port.test.ts`, `lib/frontend/registration-client.test.ts` and `lib/advisory-preferences.test.ts`. Registration tests use mocked fetch, explicitly covering 1–6 digit demo codes with no OTP call; existing password-only sign-in paths and API/auth files are unchanged. All 92 passed in this isolated checkout.
- **Checks:** From this checkout, run the installed Vitest CLI on those ten suites with `--maxWorkers=1`; TypeScript CLI with `--noEmit --incremental false`; ESLint on changed TS/TSX/MJS; `node tests/frontend/browser/run.mjs --tier-01`; `node tests/frontend/browser/run.mjs`; and `git diff --check`. Installed packages resolve from the parent workspace; no install, copied environment or dependency change is required.
- **Deployment inspection:** Refreshed `origin/main` contains active `.github/workflows/deploy.yml`, triggered by a push to `main`, with a GitHub Pages deployment job. A merge into main therefore triggers that deployment workflow; build/deployment success is not established. Draft creation and this branch push do not match that Pages trigger. CI runs on pushes/PRs. No deployment configuration changed; external hosting hooks could not be inspected with the available GitHub permission.
- **Review requirements:** Keep the PR draft until human visual/touch, true browser 200% zoom, screen-reader speech and terminology review are completed, and SON-01 runtime evidence confirms authenticated profile persistence/ownership/error handling and the full PR #14 registration/onboarding/password-sign-in/logout journey. Missing demo-session configuration remains a real server error, never a frontend success. This PR completes selected frontend delivery; it does not certify integrated or manual acceptance.

### TIER-02 / DATA-01–04-TIER, MAP-01–03-TIER, OPS-01-TIER, GEO-03-TIER — October 17, 2026

Tier selected TIER-02 after accepting TIER-01's selected frontend delivery. Review branch: `codex/tier/tier-02`, fast-forwarded in a clean isolated checkout to fetched `origin/main` at `94ffdb1` after verifying PR #15 is merged. PR #14 and TIER-01 are inherited from main; they are not part of this PR diff. Commit/push/draft-PR publication is authorized; merge/deployment is not. Stop for review before TIER-03.

**Preservation and batch separation:** All 22 pre-existing modified/untracked files were copied byte-for-byte with SHA256 hashes and a baseline diff to the external `tier-02-baseline` directory beside the earlier preservation snapshot. TIER-01 production files and the six pre-existing auth-restoration files remain unchanged. Only the browser runner and this Tier log intentionally overlap that baseline; their TIER-02-only delta is recorded separately. No staging, discarding or resetting. Son/Toby-owned files retain their starting bytes. The full working-tree diff includes earlier work and must not be treated as the TIER-02 batch. A documentation-write encoding failure was recovered from the exact baseline before applying this log.

- [x] **Frontend delivery: controls and recoverable states (MAP-01/02/03, OPS-01).** Reused branded workspace, port/region framing, navigation, coordinate guards, weather presentation and pelagic/demersal/both semantics. Added returned-record date filtering consistently across list/map, unknown-date choice, accessible refresh in map/list/detail views, date-bearing active filters and future/earlier/today distinctions. Load more stays bounded to the returned list. Invalid saved ports cannot create a replacement map reference. Loading and failed refreshes stay visible with retained details. Unsupported/ambiguous species and catalog outages use existing API codes, retain requested filters and offer explicit recovery; failed species queries never silently become successful general-area responses. Existing fish choices are labelled requests rather than a verified catalog. Narrow/short-viewport filters scroll with Escape focus restoration.
- [x] **Frontend delivery: adapter/coverage/evidence (DATA-01/02/03/04, MAP-01/02/03, OPS-01, GEO-03).** Reject empty/nonfinite identifiers and malformed/out-of-extent coordinates, omit invalid scores, retain latest duplicates while preserving server order across distinct locations, and reject contradictory count/cap metadata. Coverage distinguishes displayed/returned/server-eligible counts, invalid/duplicate omissions, caps and unavailable counts on failure. No replacement targets. Details preserve actual numeric SST/chlorophyll including zero and supplied source/provenance/cluster identifiers; missing units, depth, species presence, VIIRS age/coverage/classification, ocean-mask quality, observations, generation, validity, run/version/health and score calibration remain unavailable/unverified. Historical nighttime activity is possible supporting evidence, never catch/species ground truth. Current nearest ordering is explained; unsupported highest-score/combined ranking and next-best rotation stay unavailable. No operational ranking, marine permission, scientific threshold or safety decision invented.
- **Application files:** `app/dashboard/page.tsx`; `components/dashboard/DashboardMap.tsx`, `DashboardWorkspace.tsx`, `FishingAreas.tsx`, `PredictionCoverage.tsx` (new), `PredictionProvenance.tsx`, `dashboard.module.css`, `use-dashboard-data.ts`; `lib/dashboard.ts`, `lib/frontend/prediction-presentation.ts` (new); `services/dashboardService.ts`.
- **Test files:** `tests/frontend/prediction-presentation.test.ts` (new), `tests/frontend/browser/tier-02-fixture.tsx` (new), `tier-02-checks.mjs` (new), and the TIER-02-only extension to `tests/frontend/browser/run.mjs`. Fixtures stay under tests. Normal dashboard/map routes still use real services. Authentication and TIER-01 production files were not edited.
- **Automated evidence:** PR checkout: 142 tests in 13 suites pass (the original 86 in 11 suites plus existing registration-client/advisory-preferences regression suites), including adapter/provenance/coordinates/map/weather and TIER-01 profile/onboarding/accessibility regression checks. Offline Chrome 155.0.8059.82: 33 TIER-02 named checks; 30 existing TIER-01 checks; 85 existing browser regression checks plus 39 forward/reverse Tab assertions. TIER-02 exercises the real dashboard page, hooks, adapter, CSS and Leaflet against in-memory responses, with synthetic context/Next routing, deny proxy/DNS, deny-by-default interception and CSP. Cases cover unsupported/catalog errors, delayed obsolete responses, failed refresh with selected details, malformed/empty results, date/map parity, measured zero, all habitats, capped load-more, invalid-port recovery, desktop/tablet/390px/320px and enlarged text/expanded filters. Sandbox Chrome initially failed in Crashpad; the same guarded runner passed with process execution approval. Task-created profiles were removed; no provider/database/SMS operation or retained browser artifact.
- **Type/lint:** Full isolated PR checkout TypeScript (`tsc --noEmit --incremental false`) passes without file exclusions. Scoped ESLint on every changed TS/TSX/MJS file and whitespace checks pass without errors or warnings. Incompatible untracked restoration files and nested checkouts remain preserved in the original workspace, outside this PR. No dependency/configuration changes or installs.
- **Manual review:** Run `node tests/frontend/browser/run.mjs --tier-02 --manual` for the network-blocked synthetic preview. Choose a labelled fixture response, then Refresh areas; inspect date/habitat/species, provenance, empty/failure recovery and map/list fallback. Press Enter in the terminal for cleanup. Human visual/touch review, true browser 200% zoom, screen-reader speech and pilot terminology approval remain pending; viewport/root-text checks do not prove these. New explanations explicitly use English fallback. Real Next route/auth/account and backend/model integration remain unverified and need a separately authorized integration environment.

| From package / portion | Producer → consumer | Exact missing interface/evidence | Integration status |
| --- | --- | --- | --- |
| TIER-02 / DATA-01–04, MAP-01, OPS-01 | SON-04 with TOBY-01/02/03 → Tier | Existing nearest response has legacy source/record date/features but lacks validated ocean eligibility, input observation/generation/validity, run/model/source versions, run health/publication, feature units/quality and VIIRS age/coverage/classification. Supply agreed success/partial/failed/unsupported examples; a cluster ID alone cannot establish history. Consolidates earlier C01 provenance/mask/feature requests. | Pending contract/runtime; absence/legacy/invalid states tested independently. |
| TIER-02 / MAP-03, DATA-03 | SON-04 with Toby → Tier | Existing endpoint resolves aliases and emits `species_unsupported` / `species_catalog_unavailable`, but no frontend-readable canonical catalog endpoint is available. Supply identifiers/display names/habitat support and validated species/HSI/depth with units/provenance. Static UI names can be rejected; no invented catalog/HSI fallback. Consolidates MAP-03 species/depth handoff. | Existing failure codes consumed; canonical selection/scientific adjustment pending. |
| TIER-02 / MAP-02, GEO-03 | SON-04 with TOBY-05 → Tier | C06 approved ranking modes and selection/alternative/rotation reasons/version with eligible/capped/unsupported/empty examples are absent. Current response supports nearest display and bounded expansion only. Do not infer pressure, legal scope or replacement targets from counts. | Pending contract/runtime; frontend unavailable/empty/capped states complete. |

No TIER-03 work, installs, paid services, live SMS, database operations or deployments. Commit/push/draft-PR publication is authorized only for this reviewed TIER-02 batch. Scoped frontend delivery is complete; full package integration/manual acceptance remains open.


### TIER-02 draft-PR preparation — October 17, 2026

- **Baseline and preservation:** GitHub confirms [TIER-01 PR #15](https://github.com/Gianne818/Parola_PSC/pull/15) merged at `94ffdb1`. Fetched main and fast-forwarded the clean `scratch/tier-02-review` checkout on `codex/tier/tier-02` before copying the 15 intended application/test files. Appended only this package's log to main's Tier document, preserving the merged TIER-01 log. No integration conflicts occurred. Original mixed working tree is retained on `codex/tier/tier-02-preserved`; all 36 original modified/untracked files remain byte-identical to their backed-up SHA256 manifest. No reset, discard, unrelated staging or shared-owner edits.
- **Review scope:** 16 files total, as listed above including this Tier log. The main-targeted diff has no TIER-01 production changes, auth screens/APIs, shared schemas, root config, dependencies or Son/Toby document changes. Shared browser runner adds only TIER-02 selection/checks on top of merged TIER-01.
- **Actual checks:** Installed Vitest CLI with `--maxWorkers=1`: `tests/frontend/{prediction-presentation,coordinates,provenance,map-presentation,weather-presentation,profile-client,accessibility,claims}.test.ts`, `tests/dashboardService.test.ts`, `lib/dashboard.test.ts`, `app/onboarding/home-port.test.ts`, `lib/frontend/registration-client.test.ts`, `lib/advisory-preferences.test.ts` — all 142 tests / 13 suites pass. Full TypeScript no-emit passes; scoped ESLint is clean. Browser runner: `--tier-02` (33), `--tier-01` (30), default (85 plus 39 Tab assertions), all pass with blocked network and test-only responses. No production build or live Next/backend/model/database run was performed.
- **Deployment inspection:** Current `origin/main` retains active `.github/workflows/deploy.yml` triggered by pushes to `main` with a GitHub Pages deployment job. A merge into main triggers that workflow; build/deployment success is unverified. This branch push/draft PR does not match the Pages trigger. CI runs on pushes and PRs. Deployment configuration is unchanged; external hosting hooks remain unverified.
- **Acceptance:** Independent frontend delivery complete. Missing Son/Toby interfaces are recorded once above. Human visual/touch review, true browser 200% zoom, screen-reader speech, terminology approval and separately authorized real-route/backend/model integration remain pending. Do not treat fixtures as live scientific or operational evidence. Stop for review before TIER-03; no merge or deployment is authorized.
