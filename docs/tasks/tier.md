# Tier's task plan

Owner: **Tier only**. Updated October 15, 2026. [Hub](../../fixplan.md) | [Shared rules, files and gates](shared.md) | [Full reference](../reference/fixplan-detail.md)

## Before coding

- Confirm identity from this chat; otherwise ask "Who are you working as: Tier, Son, or Toby?" and wait. Never infer it from a branch, username or last session.
- Work on one explicitly selected `-TIER` assignment. For a general "continue", propose your next ready assignment and wait for selection. A specific matching assignment in the user's request already establishes the task.
- Only edit owned files listed below and their assigned tests; read other areas for context. Request the owning member's change when a shared dependency is missing. Never finish their portion yourself.
- C01-C08 are interface gates and D01-D10 are unresolved decisions in the shared rules. Pending prerequisites block dependent integration/live behavior; isolated evaluation/tests may proceed only where an assignment explicitly allows it.
- Parent statuses describe existing code, not completion. All boxes remain unchecked. Deferred/superseded items are not the next task without explicit separate prioritization.

## Allowed files

| File group | Allowed scope |
| --- | --- |
| UI | `app/**` except `app/api/**`; `components/**`, `hooks/**`, `context/**`, `public/**`; colocated UI tests. |
| CLIENT | `services/**` except `iprogSmsService.ts`/`smsServiceInstance.ts`; `utils/**` except `spatial.ts`/`hotspotCalculator.ts`; `lib/dashboard.ts`, `lib/updates.ts`, their matching tests, `lib/frontend/**`, `tests/dashboardService.test.ts`, `tests/frontend/**`. |
| DOC | Your checklist/progress/handoff section in this file. Shared types/config/schema/hub/instructions belong to Son; request changes. |

**First candidate:** UI-01-TIER, limited to correcting misleading public/demo copy using existing behavior. Do not claim selected-day scheduling or real exports already work.

## Assignments

### Frontend-independent batch — GitHub review preparation, October 15, 2026

- **Authorized review scope:** Tier requested committing and pushing the existing `codex/tier/frontend-independent` batch and opening/updating a **draft** PR. Tier explicitly selected `main` as the PR target in this chat. No push to `main`, force-push, merge, deployment or new branch is authorized. Historical local-only entries below describe the earlier work, before this publication authorization.
- **Reviewed contents:** Independent portions of UI-01-TIER, UI-02-TIER, MAP-01-TIER, MAP-03-TIER, DATA-02-TIER and SAFE-01/02-TIER; their frontend tests/browser fixture; this task log including the existing REG-01 preparation/handoff. Full assignments remain unchecked. Review found no additional required application fixes. Shared schemas/configuration/dependencies and Son/Toby files are excluded. The pre-existing generated `next-env.d.ts` change is deliberately left unstaged and unchanged.
- **Current local verification:** Consolidated scoped Vitest run passed **62 tests in 12 files**: `node node_modules/vitest/vitest.mjs run --pool=threads --no-file-parallelism tests/frontend tests/dashboardService.test.ts lib/dashboard.test.ts lib/updates.test.ts app/onboarding/home-port.test.ts app/guide/guide-progress.test.ts`. TypeScript `--noEmit --incremental false`, ESLint over all intended changed TS/TSX/MJS files, and whitespace checks passed. The existing offline browser runner passed **85 named checks plus 39 Tab assertions** on Chrome 155.0.8059.79; both external/API canaries rejected requests and its temporary profile was removed. No app server, production build, live provider/API/SMS/database operation, package installation or retained browser artifact was used. This consolidated rerun checks the complete proposed frontend submission; it does not establish full integration or repo-wide backend acceptance.
- **Pending evidence/handoffs:** Human screen-reader speech, actual browser 200% zoom, visual/font/touch-device checks and D10 pilot translation review remain pending as detailed below. Son's C01/C02/C06 numeric/coverage/safety contracts, C03-C05 persisted profile/verification/dispatch/report flows, C07 export entitlements, and C08 privacy/evaluation contracts remain pending where applicable. Toby's source/run/input/provenance, validated features/species and scientific freshness/quality evidence still need agreed producer/API contracts. REG-01 remains preparation only. No backend-dependent assignment or full parent feature is completed by this PR.
- **Base review:** Fetched `origin/main` at `df12a18`, which adds Toby's ocean-mask evaluation on paths outside this batch. The Tier branch remains based on `80b2ad1`; no rebase/merge or changes to that scientific work were performed. Draft publication result and commit/PR identifiers will be reported in chat.

### UI-02-TIER — offline browser/accessibility follow-up, October 15, 2026

**Selection/status:** Tier selected the remaining independent existing-screen verification and frontend-batch regression review. Implemented confirmed UI fixes on the existing `codex/tier/frontend-independent` branch, preserving the earlier batch and REG-01 preparation. The automated offline component-browser portion is completed within the limits below. **Full UI-02 remains partially completed and unchecked**: human screen-reader/visual/true browser-zoom checks, reviewed regional terminology and C03-C05 integration remain pending. No future forms/prototypes or backend-dependent assignments were completed.

**Safe verification setup:** Used installed Chrome **155.0.8059.79**, Node's existing CDP pipe support and installed Vite/React; no browser package installed. `tests/frontend/browser/run.mjs` compiles actual components and CSS in memory, substitutes synthetic context, Next navigation and service mocks, and fulfills only fixture assets from memory. No Next dev server, normal authenticated flow, environment-file loading, API/database/provider/SMS operation or production build started. Before page navigation: deny proxy/DNS settings, deny-by-default CDP request interception, restrictive CSP (including `connect-src 'none'`), service-worker bypass and downloads denied. External and same-origin API canaries both rejected. Leaflet tile requests are blocked, deliberately exercising the failure state. Sample blobs are inspected in memory rather than downloaded. Initial sandbox Chrome launch failed in its crash handler; the local process was run through approved execution outside that process sandbox with all network guards retained. Every task-created temporary profile was removed; no screenshots, recordings, exports, profiles or bundle artifacts retained.

| Verification area | Evidence / result | Remaining limits |
| --- | --- | --- |
| Keyboard/navigation/focus | Actual Chrome key events verified first-focus skip link, main-content focus, visible computed outlines, mobile navigation drawer, background inertness, Escape and trigger restoration; port search ArrowDown/Escape/Enter and clear-selection focus worked. Tablet areas drawer closes with Escape. | Chromium can report `BODY` at its native browser focus boundary; no background control received focus. Fixture Next links/router are mocks; this is not full Next route/auth integration or every navigation path. |
| Sample-export modal | Named modal in accessibility tree; 12 forward and 12 reverse Tab steps exclude background controls, Escape restores exact trigger/body scrolling, short viewport remains scrollable. GPX/KML parse as XML; GeoJSON parses with sample structure; all retain DEMO filename/content/MIME. Cancel during generation and reopen now work. | No actual disk download, device import, entitlement or operational forecast tested or claimed. |
| Toasts | Info/success expose `status` + polite live semantics; error exposes `alert` + assertive semantics in accessibility tree; keyboard dismissal works. | **Spoken announcements are pending**. The accessibility tree cannot establish what a screen reader actually announces, timing, repetition or pronunciation. |
| Responsive/text sizes | DOM layout/visible-control overflow checks at 1280px, 390px, 320px; settings across all four existing languages; home-port editing and sample dialog with root font 16→32px; largest settings text preference; dashboard map/list at 320px including enlarged text. Settings also checked at 640×450, the CSS viewport equivalent of 1280×900 at 200% zoom. | Actual Ctrl+Plus **200% browser zoom**, human clipping/overlap/contrast review, touch devices and production font metrics remain pending. Root-text enlargement and viewport emulation are not evidence of real browser zoom. |
| Port editing / recoverable input | Hydrates the synthetic saved port. Mock failure retains selection, shows error and enables retry; mock success returns to profile route. | No live persistence, contact verification, cross-device reload or server acknowledgement proven; existing C03 optimistic-save concern remains handed off. Device geolocation was not invoked. |
| Map / area states | Real Leaflet with tile access blocked exposes map-error/list fallback/retry. Empty feed remains empty, failed list exposes retry and returns to empty state; mobile Map/Areas switch works. | No real map coverage, geographic eligibility or provider availability established. Prior MAP/DATA/SAFE scientific/server gates remain pending. |
| Existing-language labels | English/Tagalog/Cebuano/Hiligaynon settings selects/options have nonempty associated labels and pass narrow control-width checks. Reused existing copy unchanged. English-only home-port content and sample dialog now declare `lang=en`; translated registration progress declares its actual selected language (`tl`→`fil`). Prior metadata English fallback markers retained. | D10 review still needed: home-port instructions/errors/map text, sample export copy, new provenance/validity/coverage explanations and legacy map text lack reviewed regional coverage. `filterFish` currently repeats “Salain ang isda” in Cebuano/Hiligaynon; pilot reviewers must confirm/correct the terminology. No guessed translation or Bicolano support added. |

**Confirmed fixes only:** Home-port fixed-pixel font sizes did not change when root text doubled; converted to equivalent `rem` sizes (same at 16px root). Its enlarged header overflowed at 320px; header now wraps. Sample-export satellite disclosure overflowed its control under the same conditions; it now stacks/constrains/wraps. Closing during the 600ms export delay still generated a file; cleanup now cancels that timer and resets creation state, including reopening. Added explicit language metadata for known English fallbacks; no safety thresholds, advisory rules, API contracts or save semantics changed.

**Files changed in this follow-up:** `components/onboarding/HomePortOnboarding.tsx`, `components/onboarding/onboarding.module.css`, `components/ui/OfflineGeoPackModal.tsx`; new `tests/frontend/browser/fixture.tsx`, `state.tsx`, `run.mjs`; this document. The fixture controls exist only in test code, never in application routes. Other existing changes preserved.

**Focused checks:** `node tests/frontend/browser/run.mjs` passed **85 named browser checks plus 39 Tab-containment assertions** after fixes, with zero uncaught page/driver exceptions. Focused Vitest: **10 tests / 3 files** (`tests/frontend/accessibility.test.ts`, `app/onboarding/home-port.test.ts`, `tests/frontend/claims.test.ts`) passed. TypeScript `--noEmit --incremental false`, ESLint on the new fixture/runner and modified components, and whitespace checks passed. Did not rerun the earlier 62-test batch suite; no changes to its coordinate/weather/provenance/business-rule implementations. SHA256 comparison confirmed all **45 other previously changed files** unchanged; only the three intentionally extended existing files above changed, alongside the newly modified onboarding CSS and three test files. No staged changes or remaining task-created browser profiles. Harness setup initially needed Windows module-path, Enter-key and React-state-wait corrections; those were test-driver issues, not application defects.

#### Pending manual checks — use the guarded fixture, not the normal app

1. From the repository, run `node tests/frontend/browser/run.mjs --manual` in an interactive terminal. It uses the same in-memory assets/mocks/network guards and opens an isolated visible Chrome window after interception is installed. Confirm both canary PASS lines before interacting. This manual mode is provided but **was not exercised by a human in this review**. Do not start `next dev`, log in, enable network, use real credentials or invoke device location. Use only the labelled **Fixture:** controls; other route transitions are mocked and do not prove application integration.
2. With an already available screen reader, use **Fixture: Settings**, then Tab/Shift+Tab through the skip link, navigation and labelled controls. Confirm names, focus visibility and language pronunciation. At a narrow window, open navigation; verify page controls are unavailable while the modal is open, Escape closes it, and focus returns to its trigger. Check both initial port setup (including translated progress) and **Fixture: Edit port**. Search “Mercedes”, ArrowDown to a result, Escape to search, Enter to choose; enable **Fail mocked port save**, save and confirm the error is announced without losing the selection. This remains mock-only persistence.
3. Use **Fixture: Sample exports**, then **Open sample export**. Confirm the dialog title is spoken; traverse every control forward/backward, Escape, reopen and close by its button. Expand planned-satellite details, select each format, create each sample and close during generation. Blobs remain in memory; no file/device import occurs. Confirm focus returns to the trigger, choices convey selection without color, and no background page control receives focus.
4. Use **Fixture: Information toast** and **Fixture: Error toast**. Confirm the polite versus assertive spoken announcement, no duplicate speech, readable message and named dismiss button. Repeat in each existing language and confirm English fallback passages change pronunciation correctly. Record actual screen reader/browser/version and observed announcements; do not infer success from ARIA attributes.
5. Set browser menu zoom to **200%** (Ctrl+Plus until the menu reports 200%), inspect settings, port setup/edit, map error/list fallback, expanded sample dialog and toasts. Resize the window to narrow/mobile widths; scroll all panels and reach final actions. Check text/control overlap, cropped focus outlines, dialog scrolling and loss of content; inspect with the intended local fonts/device too. Reset zoom afterwards. Screen-reader, human visual and actual zoom results remain pending until performed.
6. Finish by pressing **Enter in the terminal**, allowing browser closure and profile removal; confirm the cleanup message. Do not save screenshots, traces, recordings or profiles. Live route/persistence/dispatch validation needs a separately agreed, fully disconnected integration fixture from Son before any normal app flow can be exercised.

| From assignment | To member | Requested change / evidence | Blocks | Status |
| --- | --- | --- | --- | --- |
| UI-02-TIER browser follow-up | Tier with pilot language/accessibility reviewers (D10) | Perform the pending spoken/visual/actual-zoom steps; review the exact missing regional passages and Cebuano/Hiligaynon filter wording listed above. Record language, browser/assistive technology, outcomes and corrected approved wording. | Full reviewed accessibility/regional-language acceptance. | Pending; recorded locally only. |
| UI-02-TIER browser follow-up | Son (C03-C05) | Supply canonical persistence/validation/status fixtures and a disconnected integration boundary for full route/auth/save/retry verification. Preserve distinct local draft, acknowledged save, verification and dispatch states. Existing REG-01 C03 field/response handoff below remains applicable. | Backend-dependent integration, recoverable server errors and duplicate-safe report/SMS evidence. | Pending; no Son/Toby file edited or service invoked. |

### Selected independent frontend batch — October 15, 2026

Tier explicitly selected, in order: UI-02, MAP-01, MAP-03, DATA-02, SAFE-01/SAFE-02, then remaining UI-01 verification. Scope is confirmed existing-screen/client fixes only; no future-screen prototypes or backend/model/shared-contract implementation. Work locally on `codex/tier/frontend-independent`, preserve the existing UI-01 changes and REG-01 preparation, use existing dependencies and offline/mocked checks, and do not commit/push. Full assignment boxes remain unchecked where acceptance dependencies remain. Per-portion evidence and handoffs are recorded below as work proceeds.

#### UI-02-TIER — independent portion partially completed

- Audited current authentication, port onboarding, settings, dashboard navigation/drawers, sample export and toast code. Existing auth labels/error associations/focus, port search keyboard controls, dashboard skip link and native drawers were already present; preserved them. The unused legacy `Modal`/`Navbar` were not changed.
- Fixed the active sample-export overlay: named native modal dialog provides focus containment/Escape, restores trigger focus and previous body scrolling, scrolls within a short viewport, stacks choices on narrow screens, and exposes selected/expanded state and named choice groups. Existing sample downloads/copy preserved. Added visible global keyboard focus, labelled/announced toasts with bounded mobile width, and browser-relative dashboard base text sizes (same sizes at the normal 16px root).
- Files: `components/ui/OfflineGeoPackModal.tsx`, `components/ui/ToastContainer.tsx`, `app/globals.css`, `utils/fontScale.ts`, `tests/frontend/accessibility.test.ts`.
- Checks: TypeScript no-emit; focused ESLint; 8 existing home-port/guide tests; 3 offline static-render/font checks; whitespace check passed. No browser dependency is installed; native-dialog behavior, screen-reader output and visual text/zoom layouts need manual browser review. Static evidence is not a full accessibility certification.
- Remaining: REG-01/REPORT-01 future forms, C03/C05 error/language persistence and pilot-reviewed D10 terminology/translation coverage. English fallbacks are not claimed as complete regional translations. No future forms or new translations added; full UI-02 stays unchecked.

#### MAP-01-TIER — selected coordinate portion completed; full assignment partial

- Strict client-only finite numeric/range guards now protect dashboard requests/results, nearby-area calculations, Leaflet centers/markers and settings coordinates. Targets reuse the existing display extent; no new geographic policy, ocean mask or permission claim. Shore home ports remain valid. Geocoder decimal strings must parse completely; malformed results are omitted and invalid reverse lookups rejected before fetch.
- Removed raw geometry/direct-Supabase hotspot reads: even the compatibility export calls the existing numeric API. Removed initial/cache/live-failure sample targets from context; malformed/all-invalid API targets enter the existing error state rather than becoming `(0,0)` or samples. Preserved current server ordering/dedup/metadata.
- Files: `lib/frontend/coordinates.ts` (frontend hygiene only), `services/dashboardService.ts`, `services/supabaseHotspotService.ts`, `services/geocodingService.ts`, `lib/dashboard.ts`, `components/features/hotspots/MapInner.tsx`, `context/AppContext.tsx`, `app/settings/page.tsx`, `tests/dashboardService.test.ts`, `tests/frontend/coordinates.test.ts`.
- Checks: TypeScript and focused ESLint passed; 37 mocked/local coordinate, dashboard and home-port tests passed. Initial Vitest fork runs hit sandbox temporary-module ENOENT; rerun with local thread pool passed without changing configuration/dependencies. Invalid requests made zero fetches; geocoder responses were mocked; legacy caller uses only the mocked existing API.
- Handoff MAP-01 → Son (C01/C06): authoritative numeric, validated ocean/coverage/eligibility responses and server-side malformed/swapped geometry tests are still required in API/storage paths. Rectangular client rejection is not authoritative marine validation. SMS/server consistency remains unproven; full assignment unchecked.

#### MAP-03-TIER — selected fabrication-removal portion completed; full assignment partial

- Legacy hotspot consumers now reuse the dashboard adapter. Removed generated species sets, selected-fish prepending, fixed habitat depths, hashed wind/waves/storms and the unused context hotspot fixture array. No replacement species or environmental measurements invented. Existing API `species_hsi_applied` must be strictly `true` or the exact requested species string (current direct-DB route shape); arbitrary truthy strings are rejected. This remains adjustment metadata, not fish presence.
- Legacy map depth/species displays now say unavailable, including removal of the 50m fallback and favorable-conditions fallback sentence. Because Son's shared `Hotspot.depth` is still required numeric, adapter absence uses a private nonfinite sentinel; both legacy depth renderers guard finiteness, and dashboard does not present depth. This is not a new wire value and is not serialized as measured depth.
- Removed operational simulation from `services/weatherService.ts`: independent provider failures/missing fields become null in a client-local nullable view type; zero measurements survive; tide and PAGASA signal are unavailable rather than coordinate hashes. Context starts with unavailable readings. No thresholds or safety decisions changed.
- Files: `services/supabaseHotspotService.ts`, `services/dashboardService.ts`, `services/weatherService.ts`, `context/AppContext.tsx`, both hotspot map components, `tests/frontend/coordinates.test.ts`, `tests/frontend/weatherService.test.ts`.
- Checks: TypeScript and focused ESLint passed; 36 offline mocked tests passed across coordinate/legacy weather/dashboard suites. Fixtures cover unsupported requested fish, missing depth/weather, different coordinates under provider failure, partial readings and measured zeros.
- Handoff MAP-03 → Son (C01/C02, consult Toby): make shared absent depth/weather nullable/optional; supply supported species/alias/adjustment metadata and actual feature/source evidence. Fix backend fixed-depth/unknown-species substitution in owned paths; agree missing versus unsupported responses. Frontend removal cannot prove cross-channel species correctness. Full assignment unchecked.

#### DATA-02-TIER — selected display portion completed; full assignment partial

- Preserve validated original prediction days and record-creation timestamps; record client retrieval separately. Reject impossible/relative/ambiguous dates and normalize timestamp prediction dates to Manila days, without inventing missing dates or inferring generation time from database creation. Prediction details and list explain unverified provenance/validity and missing observation/generation/source/run evidence. Existing sample areas remain explicitly demo.
- Weather banner now calls receipt time “Retrieved,” separately labels last-available readings, and never renders `null PHT`; displayed timestamps include the year. Reading details expose supplied validity endpoints or unavailable, without inventing a freshness interval. Existing notification sample/legacy/event-time distinctions were already present and preserved.
- Files: `lib/frontend/timestamps.ts`, `services/dashboardService.ts`, `lib/dashboard.ts`, `components/dashboard/PredictionProvenance.tsx`, `FishingAreas.tsx`, `DashboardWorkspace.tsx`, `Advisory.tsx`, `ForecastReading.tsx`, `app/alerts/page.tsx`, `tests/frontend/provenance.test.ts` and dashboard service tests. New metadata explanations are explicit English fallbacks (`lang=en`), not claimed reviewed translations.
- Checks: TypeScript and focused ESLint passed; 37 local tests passed across provenance, dashboard service/business rules and updates. Mock clock proves a September prediction stays September after October retrieval; missing dates remain missing and sample status remains visible. Existing hold thresholds/decisions unchanged.
- Handoff DATA-02 → Son/Toby (C01/D08): source/model/run/input versions, actual observation/generation/validity/coverage/quality and failure outcomes are missing from the current feed; Son owns API/shared types, Toby owns producer evidence. No inference/deployment investigation or repair performed; no client label can establish scientific provenance. Full assignment unchecked.

#### SAFE-01-TIER / SAFE-02-TIER — selected presentation portions completed; full assignments partial

- Active advisory, weather detail and area panels preserve actual source names and show supplied forecast/record/validity times, unavailable values and retained versus expired/undated readings. Dated forecasts no longer receive an unqualified “Current” badge. Measured zero remains distinct from missing. Unknown times do not render `null PHT`.
- Added requested point, actual latest response weather/marine grid coordinates and requested hold region, with explicit unknown warning geography/coverage/backup and retained-grid limitations. An API response whose echoed requested location belongs to a different port is rejected; older responses without location retain an explicit unavailable grid/coverage state. No distance threshold or spatial applicability algorithm invented.
- Stopped the context's unlocated newest-Supabase-weather overlay; it cannot represent an arbitrary home port. Removed the false PAGASA refresh attribution and success on missing Open-Meteo readings. Preserved existing hazardous/manual holds, hold thresholds, business rules, warnings and manual SMS behavior; no provider migration/failover/server decisions implemented.
- Files: `components/dashboard/WeatherCoverage.tsx`, `ForecastReading.tsx`, `Advisory.tsx`, `AreaWeather.tsx`, `app/alerts/page.tsx`, `services/dashboardService.ts`, `context/AppContext.tsx`, `tests/frontend/weather-presentation.test.ts`; legacy simulation removal was completed under MAP-03 above.
- Checks: TypeScript and focused ESLint passed; 36 local/mocked presentation, weather-service, dashboard-adapter and safety-business-rule tests passed. Covered missing/zero/retained/expired/undated readings, differing request/grid coordinates, absent holds/coverage and mismatched port responses; existing thresholds/retained hazards remain tested.
- Handoff SAFE-01/02 → Son with Toby (C02/D03): authoritative provider/run/issue/validity/units/quality, validated backup compatibility, per-reading retained source locations, applicable warning geometry/coverage and independent alert evaluation are still needed. Existing unscoped legacy hazardous-record/manual override behavior is preserved conservatively; Son must define applicability and authority rather than Tier inventing rules. English coverage/validity fallback labels need D10 review. Full assignments unchecked.

#### UI-01-TIER — remaining independent review completed; full assignment partial

- Reviewed existing claims-only changes without repeating them. Manual versus planned selected-day/any-day messaging, demo contact step, report availability, provisional enterprise/satellite/device/export claims and sample/legacy update distinctions remain qualified.
- Corrected confirmed stale guide instructions to current Continue/Create account, Confirm home port, Change home port, Filter fish/Areas and Weather by SMS controls; removed instructions for nonexistent expandable species/tide panels and qualified historical depth screenshots. Added explicit device-local/unconfirmed backend-save context to port setup; did not implement persistence/verification/scheduling.
- Removed remaining legacy map claims of live gradients, calibrated catch probability, yield efficiency and certified territorial-water/ECDIS status. Display extent is not fishing permission. Existing map interactions and server selection rules preserved.
- Files: `components/information/guide-data.ts`, `components/features/hotspots/MapComponent.tsx`, `MapInner.tsx`, `components/onboarding/HomePortOnboarding.tsx`, `tests/frontend/claims.test.ts`.
- Checks: TypeScript, focused ESLint and whitespace passed; 16 local static claims/provenance/accessibility/guide/home-port checks passed. A test initially searched the wrong guide property; corrected the test to inspect the actual instruction list, then reran successfully.
- Handoffs: C01-C08 dependent integration, C03 canonical persisted/contact/consent states, C04 dispatch/delivery and D10 reviewed translations/pilot accessibility remain pending with their owners. No unavailable feature represented as operational. Full UI-01 stays unchecked; REG-01 preparation and earlier claims work preserved.

#### Batch verification and file inventory

- Final combined local run: **62 tests passed in 12 files**, using `vitest run --pool=threads --no-file-parallelism tests/frontend tests/dashboardService.test.ts lib/dashboard.test.ts lib/updates.test.ts app/onboarding/home-port.test.ts app/guide/guide-progress.test.ts`. TypeScript `--noEmit --incremental false`, ESLint over all batch TypeScript/TSX files, and `git diff --check` passed. No app/dev server or production build was invoked; no visual/browser/screen-reader execution is claimed.
- Final review additionally guarded malformed stored-port labels/distances and invalid selected targets in the legacy map; filtered nonfinite optional model/SST numbers; checked both through mocked/static rendering. Existing safety threshold/hold functions were not changed.
- Preservation: the 14 earlier UI-01 application files outside the two intentionally extended files (`guide-data.ts`, `OfflineGeoPackModal.tsx`) match their pre-batch SHA256 hashes. Those two were edited on top of the earlier corrections, which remain present. The REG-01 preparation and earlier UI-01 progress/handoffs remain intact. No Son/Toby/shared configuration/dependency file changed; no assignment checkbox checked.
- Remaining manual/product evidence: native-dialog keyboard/focus and screen-reader behavior, 200% text/zoom/mobile visual review, pilot terminology and reviewed translation coverage. Exact independent contract dependencies are recorded per portion above. No optional future-screen prototype was built.
- Local only: no external calls, installs, live SMS, cloud/paid actions, deployments, screenshot/recording/browser-profile artifacts, staging, commits or pushes. Existing runtime provider integrations were inspected/edited without invoking them; verification fetches were mocked.

Files changed **in this batch** (earlier UI-01-only modifications remain separate):

| Area | Files |
| --- | --- |
| Existing screens/style | `app/alerts/page.tsx`, `app/settings/page.tsx`, `app/globals.css`, `utils/fontScale.ts` |
| Dashboard | `components/dashboard/Advisory.tsx`, `AreaWeather.tsx`, `DashboardWorkspace.tsx`, `FishingAreas.tsx`, `ForecastReading.tsx`, new `PredictionProvenance.tsx`, new `WeatherCoverage.tsx` |
| Maps/onboarding/guide | `components/features/hotspots/MapComponent.tsx`, `MapInner.tsx`; `components/onboarding/HomePortOnboarding.tsx`; `components/information/guide-data.ts` |
| Existing shared UI | `components/ui/OfflineGeoPackModal.tsx`, `ToastContainer.tsx` |
| Frontend state/adapters/helpers | `context/AppContext.tsx`; `lib/dashboard.ts`; new `lib/frontend/coordinates.ts`, `timestamps.ts`; `services/dashboardService.ts`, `geocodingService.ts`, `supabaseHotspotService.ts`, `weatherService.ts` |
| Focused tests | `tests/dashboardService.test.ts`; new `tests/frontend/accessibility.test.ts`, `coordinates.test.ts`, `map-presentation.test.ts`, `weatherService.test.ts`, `weather-presentation.test.ts`, `provenance.test.ts`, `claims.test.ts` |
| Coordination | `docs/tasks/tier.md` |

- [ ] <a id="reg-01-tier"></a>**REG-01-TIER | P1 | Partial** - [Persist selected-day preferences.](../reference/fixplan-detail.md#reg-01)
  - **Files:** UI, CLIENT. **Work:** Build weekday/time/habitat/ranking settings and saved schedule; preserve port editing and explain any-day safety alerts.
  - **Needs:** C03; Son profile fields. **Done when:** Five-day/duplicate validation and reload/edit flows agree with persisted values; no guessed enrollment.
  - **October 15, 2026 readiness:** Preparation only; proposed registration/settings flow and detailed C03 request recorded below. Persisted integration is blocked by pending contracts/decisions. No implementation scope selected and no application code changed in this preparation.

- [ ] <a id="reg-02-tier"></a>**REG-02-TIER | P0 | Partial** - [Verify contacts, consent and assisted authority.](../reference/fixplan-detail.md#reg-02)
  - **Files:** UI, CLIENT. **Work:** Replace false verification/licence impressions with honest contact/consent and authorized-assistance flows.
  - **Needs:** C03; Son verification/role outcomes. **Done when:** Demo code never appears to establish live ownership; optional municipal IDs stay optional; denied assistance is clear.

- [ ] <a id="sms-01-tier"></a>**SMS-01-TIER | P1 | Partial** - [Schedule routine advisories durably.](../reference/fixplan-detail.md#sms-01)
  - **Files:** UI, CLIENT. **Work:** Show next selected routine day and last attempt; distinguish preview, acceptance and delivery.
  - **Needs:** C03, C04; Son schedule/status APIs. **Done when:** Non-selected days are explained accurately; receiving SMS requires no portal login.

- [ ] <a id="sms-02-tier"></a>**SMS-02-TIER | P0 | Partial** - [Route critical events independently and track delivery.](../reference/fixplan-detail.md#sms-02)
  - **Files:** UI, CLIENT. **Work:** Display any-day critical events and truthful queued/submitted/delivered/failed/unknown history.
  - **Needs:** C04; Son critical event/status feed. **Done when:** Gateway acceptance is never receipt; non-selected-day alerts remain visible.

- [ ] <a id="sms-03-tier"></a>**SMS-03-TIER | P1 | Partial** - [Govern segments, sponsorship and costs.](../reference/fixplan-detail.md#sms-03)
  - **Files:** UI, CLIENT. **Work:** Expose separate sponsor consent and maintain ad-free critical/enterprise presentation; qualify provider rates.
  - **Needs:** C03, C04. **Done when:** No UI implies guaranteed delivery or contracted rates; consent states are explicit.

- [ ] <a id="safe-01-tier"></a>**SAFE-01-TIER | P0 | Partial** - [Validate weather providers and backup.](../reference/fixplan-detail.md#safe-01)
  - **Files:** UI, CLIENT. **Work:** Show actual provider, validity and unavailable/backup state; remove operational synthetic weather.
  - **Needs:** C02. **Done when:** Open-Meteo is not relabeled NOAA; missing readings never look like zero/safe.

- [ ] <a id="safe-02-tier"></a>**SAFE-02-TIER | P0 | Partial** - [Localize warnings and decouple them from inference.](../reference/fixplan-detail.md#safe-02)
  - **Files:** UI, CLIENT. **Work:** Show checked geography, applicable warning and incomplete coverage without treating absent holds as clearance.
  - **Needs:** C02; Son coverage feed. **Done when:** Cebu readings cannot appear as evidence for another region.

- [ ] <a id="safe-03-tier"></a>**SAFE-03-TIER | P0 | Partial** - [Share deterministic rules and preserve UNKNOWN.](../reference/fixplan-detail.md#safe-03)
  - **Files:** UI, CLIENT. **Work:** Consume authoritative hold/unknown/reason/rule-version states; suppress actionable UI targets instead of only recoloring banners.
  - **Needs:** C02; Son operational decision. **Done when:** Portal status and actionable controls agree with server; missing inputs never display NORMAL.

- [ ] <a id="data-01-tier"></a>**DATA-01-TIER | P0 | Planned** - [Apply a validated ocean mask.](../reference/fixplan-detail.md#data-01)
  - **Files:** UI, CLIENT. **Work:** Omit server-rejected land/invalid targets and keep honest empty states.
  - **Needs:** C01; Son ocean-filtered responses. **Done when:** No fallback land/sample markers; home-port selection remains valid on shore.

- [ ] <a id="data-02-tier"></a>**DATA-02-TIER | P0 | Planned** - [Stop production simulation and record provenance.](../reference/fixplan-detail.md#data-02)
  - **Files:** UI, CLIENT. **Work:** Display observation, prediction validity, generation/fetch times and genuine demo/stale/unavailable distinctions.
  - **Needs:** C01. **Done when:** Old or unverified data never gains a live label or current date from UI fetch time.

- [ ] <a id="data-03-tier"></a>**DATA-03-TIER | P0 | Planned** - [Use real environmental features and calibrated scores.](../reference/fixplan-detail.md#data-03)
  - **Files:** UI, CLIENT. **Work:** Display actual depth/habitat/species support and surface/bottom meanings; unknown is not a measured zero.
  - **Needs:** C01; Son supported feature metadata. **Done when:** No fixed or fabricated depth/species measurement reaches the operational UI.

- [ ] <a id="data-04-tier"></a>**DATA-04-TIER | P1 | Planned** - [Integrate real historical VIIRS DBSCAN.](../reference/fixplan-detail.md#data-04)
  - **Files:** UI, CLIENT. **Work:** Explain historical nighttime vessel activity as supporting evidence with age/coverage, never catch/species ground truth.
  - **Needs:** C01 cluster metadata. **Done when:** Descriptions remain accurate for clustered, noise and no-history areas.

- [ ] <a id="map-01-tier"></a>**MAP-01-TIER | P0 | Partial** - [Normalize coordinates and remove legacy bypasses.](../reference/fixplan-detail.md#map-01)
  - **Files:** UI, CLIENT. **Work:** Unify sanitized map/context/service feeds, reject invalid geometry/coordinates and remove live-failure sample fallbacks.
  - **Needs:** C01; Son numeric coordinate feed. **Done when:** No (0,0)/swapped/malformed targets; legacy direct path cannot bypass server filtering.

- [ ] <a id="map-02-tier"></a>**MAP-02-TIER | P1 | Partial** - [Unify run validity, ranking and bounded payloads.](../reference/fixplan-detail.md#map-02)
  - **Files:** UI, CLIENT. **Work:** Preserve regional dedup/dates/counts; add approved ranking and bounded load-more/empty states.
  - **Needs:** C01, C06; Son selection results. **Done when:** UI reflects correct mode, eligibility, caps and unavailable region without inventing extra coverage.

- [ ] <a id="map-03-tier"></a>**MAP-03-TIER | P1 | Partial** - [Correct species and environment presentation.](../reference/fixplan-detail.md#map-03)
  - **Files:** UI, CLIENT. **Work:** Remove index-based species, prepended selected-species claims, fixed depth and hashed storm/wind/waves.
  - **Needs:** C01, C02; Son supported species contract. **Done when:** Unsupported species is explicit; habitat/HSI/model output remain distinct.

- [ ] <a id="ops-01-tier"></a>**OPS-01-TIER | P1 | Partial** - [Harden dates, ingestion and run visibility.](../reference/fixplan-detail.md#ops-01)
  - **Files:** UI, CLIENT. **Work:** Show run health/coverage/failure notices from server without secrets or successful-looking samples.
  - **Needs:** C01. **Done when:** Refresh time never replaces prediction age; failed runs and missing coverage are understandable.

- [ ] <a id="report-01-tier"></a>**REPORT-01-TIER | P1 | Planned** - [Add structured voluntary trip reports.](../reference/fixplan-detail.md#report-01)
  - **Files:** UI, CLIENT. **Work:** Build voluntary trip form/history including zero catch, approximate area, optional GPS, species/weight/effort and recoverable errors.
  - **Needs:** C03, C05; D09. **Done when:** Zero/no-GPS reports work; failed save is not success and internet-reporting need is clear.

- [ ] <a id="report-02-tier"></a>**REPORT-02-TIER | P1 | Planned** - [Review assisted reports before learning.](../reference/fixplan-detail.md#report-02)
  - **Files:** UI, CLIENT. **Work:** Add scoped acting-for/review status and correction flows; keep feedback optional for advisory reception.
  - **Needs:** C03, C05; Son role/report states. **Done when:** Helpers cannot choose unrelated fishers; pending/flagged/reviewed outcomes are distinct.

- [ ] <a id="eval-01-tier"></a>**EVAL-01-TIER | P1 | Planned** - [Measure outcomes without overstating them.](../reference/fixplan-detail.md#eval-01)
  - **Files:** UI, CLIENT. **Work:** Present scores versus validated metrics, uncertainty/sample size and targets versus actual adoption/fuel results.
  - **Needs:** C08; approved findings. **Done when:** 76% anecdote is not accuracy; search fuel, total fuel, suppression and delivery stay separate.

- [ ] <a id="geo-01-tier"></a>**GEO-01-TIER | P0 | Planned** - [Enforce proposed permitted areas server-side.](../reference/fixplan-detail.md#geo-01)
  - **Files:** UI, CLIENT. **Work:** Show permitted municipal/commercial scope and denial/coverage limitations without treating admin polygons as marine law.
  - **Needs:** C03, C06, C07. **Done when:** Client region/plan controls cannot imply they grant permission or certify legal clearance.

- [ ] <a id="geo-02-tier"></a>**GEO-02-TIER | P1 | Planned** - [Stage authoritative conservation exclusions.](../reference/fixplan-detail.md#geo-02)
  - **Files:** UI, CLIENT. **Work:** Add initial official-verification reminders and clearly qualified validated restriction overlays.
  - **Needs:** C06; Son dataset coverage. **Done when:** No full-compliance claim before authoritative coverage; unavailable is not unrestricted.

- [ ] <a id="geo-03-tier"></a>**GEO-03-TIER | P1 | Planned** - [Distribute recommendations across suitable grounds.](../reference/fixplan-detail.md#geo-03)
  - **Files:** UI, CLIENT. **Work:** Explain next-best alternatives/no suitable target without claiming measured fishing pressure.
  - **Needs:** C06; Son selection reasons. **Done when:** Rotation cannot hide unsafe/out-of-scope fallback or claim biomass/actual vessel activity.

- [ ] <a id="ent-01-tier"></a>**ENT-01-TIER | P2 | Planned** - [Verify vessels and persist entitlements/zone locks.](../reference/fixplan-detail.md#ent-01)
  - **Files:** UI, CLIENT. **Work:** Build verified vessel/operator/plan/scope/zone/expiry presentation; keep Standard free and incomplete purchases honest.
  - **Needs:** C03, C07; Son verification/entitlements. **Done when:** No client local quota/GT is presented as verified; no fake active subscription.

- [ ] <a id="ent-02-tier"></a>**ENT-02-TIER | P2 | Partial** - [Generate real verified Geo-Packs.](../reference/fixplan-detail.md#ent-02)
  - **Files:** UI, CLIENT. **Work:** Replace sample export UI with actual zone/horizon/format/validity and unsupported states, retaining explicit demos until ready.
  - **Needs:** C01, C02, C07; Son export contract. **Done when:** No static coordinates or unsupported future horizon appears as real forecast; actual reset comes from server.

- [ ] <a id="road-01-tier"></a>**ROAD-01-TIER | P2 | Deferred** - [Validate satellite, fleet and institutional capabilities.](../reference/fixplan-detail.md#road-01)
  - **Files:** UI, CLIENT. **Work:** Keep satellite/fleet/institutional experiences planned until separately validated.
  - **Needs:** Deferred; C07/C08 and separate prioritization. **Done when:** No simulated readiness, tracking or contracted revenue claims.

- [ ] <a id="ui-01-tier"></a>**UI-01-TIER | P1 | Partial** - [Align all public and signed-in journeys.](../reference/fixplan-detail.md#ui-01)
  - **Files:** UI, CLIENT. **Work:** Correct landing/pricing/guide/resources/onboarding/dashboard/report/export claims and outbound-only examples; preserve truthful current states.
  - **Needs:** Claims-only correction can start now; feature wiring waits on C01-C08 as relevant. **Done when:** No required inbound commands/1-2-3 replies, unconditional daily promise or unsupported live/accuracy/device/savings claim.
  - **October 15, 2026:** Independent claims-only corrections implemented locally on `codex/tier/ui-01`; see evidence and handoffs below. Remains unchecked: dependent contract integration and full journey verification are not proven by this copy pass.

- [ ] <a id="ui-02-tier"></a>**UI-02-TIER | P1 | Partial** - [Extend accessible regional-language flows.](../reference/fixplan-detail.md#ui-02)
  - **Files:** UI, CLIENT. **Work:** Extend reviewed regional-language, keyboard/screen-reader/mobile, slow-network and recoverable-input flows.
  - **Needs:** C03-C05; D10 with pilot translation review. **Done when:** Clear labels/focus/non-color states; Bicolano pending coverage qualified; no duplicate retry or unsaved-draft success.

- [ ] <a id="priv-01-tier"></a>**PRIV-01-TIER | P1 | Partial** - [Separate identity, reports and delegated access.](../reference/fixplan-detail.md#priv-01)
  - **Files:** UI, CLIENT. **Work:** Explain optional reports, consent, approximate location, assisted roles and reviewed retention honestly.
  - **Needs:** C03, C05, C08; D02/D09. **Done when:** No precise GPS/feedback condition for free SMS; roles and purposes remain understandable.

- [ ] <a id="ux-01-tier"></a>**UX-01-TIER | P2 | Deferred** - [Preserve useful map/trip-planning additions.](../reference/fixplan-detail.md#ux-01)
  - **Files:** UI, CLIENT. **Work:** Later evaluate clearer zones/contours and qualified travel/fuel/forecast controls.
  - **Needs:** Deferred; C01/C06/C07 and separate prioritization. **Done when:** Visible source/uncertainty; estimates are not navigational clearance or measured savings.

- [ ] <a id="leg-02-tier"></a>**LEG-02-TIER | P2 | Deferred** - [Cooperative fuel pooling.](../reference/fixplan-detail.md#leg-02)
  - **Files:** UI, CLIENT. **Work:** Keep fuel-pooling UI outside core pilot; only later replace local samples if separately prioritized.
  - **Needs:** Deferred; separate fuel product authorization and Son contracts. **Done when:** No verified discount/payment/supply claim from local state; no fuel coding now.

## Progress and handoffs

### UI-01-TIER — October 15, 2026, independent claims-only portion

- **Branch/scope:** `codex/tier/ui-01`. Local work using existing dependencies; no commits, pushes, installs, deployments, paid APIs, provider calls or SMS dispatch. The initial working tree was clean. Only Tier UI/copy paths and this task document changed.
- **Completed:** Replaced visible inbound-command demos and printed instructions with outbound examples. Described routine SMS for up to five selected weekdays and separate any-day critical alerts as planned; current manual weather requests remain accurately described. Corrected account-versus-vessel-registration claims, provisional commercial eligibility/pricing, unverified coverage/device imports, fleet/satellite capabilities, funding and model-outcome claims. Qualified resource thresholds as existing app behavior rather than official clearance. Preserved port-editing routes, manual controls, delivery-versus-acceptance wording and sample/freshness/unavailable distinctions.
- **Reporting/export:** The current dashboard has no catch-rating controls or structured trip-report form; guide instructions now describe voluntary reporting as planned, optional and internet-dependent, including zero catch and optional GPS. Existing sample exports still download in all three formats with unchanged example coordinates; their UI, filenames and embedded descriptions now identify demonstrations rather than valid forecasts, verified entitlements or supported device imports. Sample timestamps describe file creation, not forecast validity. Existing screenshot assets remain references with qualified captions.
- **Changed files (17 total):**
  - Pages/metadata: `app/page.tsx`, `app/about/page.tsx`, `app/guide/page.tsx`, `app/pricing/page.tsx`, `app/resources/page.tsx`, `app/layout.tsx`.
  - Information/copy: `components/information/GuideContent.tsx`, `components/information/guide-data.ts`, `components/information/PricingContent.tsx`, `components/information/pricing-data.ts`, `components/resources/resource-copy.ts`, `components/dashboard/dashboard-copy.ts`, `components/application/application-copy.ts`.
  - Demonstrations: `components/landing/ProductPreview.tsx`, `components/ui/GenericWebDisplayAd.tsx`, `components/ui/OfflineGeoPackModal.tsx`.
  - Coordination: `docs/tasks/tier.md`.
- **Local checks:** `tsc --noEmit --incremental false` passed. ESLint checked all 16 changed TS/TSX files with zero issues, including comparison with HEAD. Existing Vitest suites `app/guide/guide-progress.test.ts`, `app/onboarding/home-port.test.ts`, `lib/dashboard.test.ts`, `lib/updates.test.ts`, `tests/dashboardService.test.ts` passed: 5 files / 39 tests; service fetches are mocked. Temporary in-memory checks rendered eight static cases (landing, pricing, guide, about, modal, both ad layouts, resources), inspected all nine lesson records and exercised nine sample downloads (three formats × three horizon labels). No network or SMS calls were made. `git diff --check` passed using the repository's normal line-ending settings.
- **Limits/remaining dependencies:** Static rendering stubbed context, shell and animations; it does not prove browser layout, hydration, live persistence or delivery. No Next build/dev server was started because the existing app can fetch Google fonts, map tiles and provider data. Revised regional copy still needs pilot-language review under D10; no claim of reviewed translation coverage is made. C01-C08 as relevant and D01-D09 remain pending in the shared plan. Full UI-01-TIER acceptance and parent completion remain unproven; no assignment is checked off.

| From assignment | To member | Requested file/contract change | Acceptance/example | Blocks | Status |
| --- | --- | --- | --- | --- | --- |
| UI-01-TIER | Son | Record agreed C03/C04 and D01/D02/D07 outcomes in `docs/tasks/shared.md`, shared types and owned profile/verification/schedule/status APIs. | Representative persisted selected-day/time values, ownership/consent and denial/error states; routine versus any-day critical events; gateway acceptance versus confirmed receipt; registration must not imply automatic enrollment. | Future live schedule, verification and delivery presentation. Manual copy corrections are independent. | Pending; recorded only, no external message sent. |
| UI-01-TIER | Son, consulting Toby for scientific units/eligibility | Agree C05/C08 and D02/D09 report/review/privacy contracts in shared docs/types and Son-owned APIs. | Voluntary zero-catch/no-GPS report, authorized assistant, server-confirmed save/failure, review status and evaluation eligibility; ratings remain distinct from trip records. | Reporting UI integration and claims of submitted reports or calibrated evaluation. | Pending; no report backend or model work implemented. |
| UI-01-TIER | Son, consulting Toby for scientific evidence | Agree C01/C02/C06/C07 and relevant D03-D08 provenance, safety, scope and export/entitlement contracts with examples in shared docs/types and owned APIs. | Actual run/validity/source, unknown/hold coverage, verified marine eligibility and zone reset/expiry; validated artifact horizon/format and device-import evidence before support claims. | Operational prediction/safety/export states and enterprise claims. Demos remain explicitly qualified. | Pending; no shared schema, server policy, data or inference changes made. |

### REG-01-TIER — October 15, 2026, readiness and proposed flow

**Authorization/status:** Tier requested local preparation and a recorded handoff, not implementation. REG-01-TIER remains unchecked. Keep the existing UI-01 changes intact; this preparation changes only `docs/tasks/tier.md` on the existing `codex/tier/ui-01` branch. No new branch, application edits, dependencies, service calls, database access, SMS, commits or pushes. A later selected implementation uses `codex/tier/reg-01` in a suitable separate checkout/branch without moving or staging unrelated changes.

**Readiness:** Ready for review of the flow; not ready for persisted integration or live enrollment. C03 is explicitly pending in the shared plan. REG-02 contact/consent/authority outcomes are prerequisites for enrollment; C04 owns operational next-routine timing. Written agreed fields and representative responses/errors are required before dependent client integration. Contract-approved isolated fixtures can precede runtime availability after Tier selects that scope; they cannot be connected to live guidance or advertised as saved settings.

#### Current local evidence

| Read-only source | Existing behavior / integration gap |
| --- | --- |
| `components/auth/AuthPage.tsx`, `context/AppContext.tsx` | Account/password step, explicitly preview-only code, then account creation and port onboarding. A generated licence and local/offline account fallback are not verification or enrollment evidence. Registration sends a fixed `05:00:00` and default profile/port values; successful registration does not hydrate a canonical returned schedule. Changing verification/assistance behavior belongs to REG-02, not this preparation. |
| `components/onboarding/HomePortOnboarding.tsx`, `components/onboarding/home-port.ts`, `app/profile/page.tsx` | Existing listed/search/pin/location port selection and `/onboarding?from=profile` edit path; `/profile` redirects to `/settings#profile`. Port patch preserves other local profile keys. Region hints are not legal marine permission. Map/geocoding/providers were not invoked. |
| `app/settings/page.tsx`, `context/AppContext.tsx` | Profile/port display, device-local language/font-size preferences and manual-SMS link; no weekday/time/habitat/ranking editor or persisted schedule summary. `speciesPreference` exists locally; language is stored separately in local storage. |
| `context/AppContext.tsx` profile update | Writes local state/storage and shows success before server confirmation; sync always sends `preferred_advisory_time: '05:00:00'`, does not check HTTP success and catches failures. Awaiting `updateProfile` currently cannot prove durable save. A future selected client change must address this explicitly, without broad auth/telemetry refactoring. |
| `types/index.ts`, `services/profileService.ts` | Shared UI `UserProfile` lacks schedule/time/ranking/consent/contact-status fields; local `speciesPreference` is `pelagic / demersal / both`. Separate service profile has optional time and a direct Supabase insert; this is not an agreed C03 read/update contract. Do not add a new persistence bypass. |
| `app/api/users/register/route.ts`, `app/api/users/profile/route.ts`, `app/api/users/by-phone/route.ts`, `app/api/users/login/route.ts` | Existing create/update/read/login paths do not expose the required preference/consent contract. Profile PUT requires phone and coordinates and substitutes time/name/port defaults. Direct register/by-phone DB responses omit coordinates/time; backend response shape differs. Son must unify response paths rather than Tier reconstructing missing values. |
| `parola-api-service/schemas.py`, `parola-api-service/main.py`, `backend/migrations/01_schema.sql` | Time exists in create/storage, with a legacy 05:00 default; `UserResponse` does not return it. Inspected registry schemas lack selected days, persisted language/habitat/ranking, verification and separate consent. This is source inspection, not proof of any deployed schema. |

#### Proposed registration/settings journey (for selection, not implemented)

1. **Account and contact status:** Keep account creation distinct from contact ownership, consent and dispatch eligibility. Continue to identify the current code step as a preview. After a canonical profile read, display Son's actual contact/consent/authority state. Missing or unsupported status means unavailable/incomplete, never verified or enrolled. Real verification, resend and assisted-enrollment controls wait for REG-02/C03 and separate selected scope; do not trigger SMS from this preference flow.
2. **Home port:** Preserve listed-port, search, pin and optional device-location choices and the existing edit/return routes. Show the saved port separately from an edited draft. A shore-based home port is valid input; do not apply a fishing-target ocean mask or treat regional hints as permission. Save only through the agreed profile operation; port-only edits must retain schedule, language, habitat, ranking and consents.
3. **Routine preferences:** Proposed next onboarding step and Settings advisories section share one editor: seven labelled weekday toggles with a selected count, up to five distinct days; advisory local time explicitly labelled Asia/Manila; habitat and ranking choices from the agreed supported values. Reject duplicates/sixth-day payloads rather than silently truncating. Do not preselect days, 04:30/05:00, habitat, ranking or consent. Lower bound, empty selection, pause control, time granularity and required fields wait for Son's decisions. Existing missing values remain visibly unconfigured; unknown enum values are not mapped to a guessed choice.
4. **Language and consent context:** Preserve immediate device readability settings. Explain whether a choice affects portal language, SMS language or both only after C03/D10 agreement. Display distinct routine-messaging, critical-alert and optional sponsor consent/status as agreed; never reuse one checkbox as authority for another purpose. Critical alerts may arrive any day independently of selected routine weekdays; do not promise delivery, automatic activation or safety clearance. Do not add consent editing, assisted authority or report enrollment to REG-01 by implication.
5. **Review and save:** Review the selected days/time/habitat/ranking and port alongside contact/consent eligibility and any known blocking reason. Disable duplicate submits and focus labelled field errors. On acknowledged persistence, replace the saved snapshot with the canonical response; a saved preference alone does not mean dispatch is enabled. No optimistic “saved” toast or activation label from local storage. For timeout/unknown outcome, keep the draft, show that save is unconfirmed, and reconcile with a read before retry under Son's agreed retry/concurrency contract. No silent background enrollment.
6. **Saved schedule and later edits:** Reload the canonical profile after sign-in/refresh; show persisted values plus effective-from timing or pending changes. Show a server-provided next routine occurrence only when C03/C04 supplies its meaning; otherwise “Next routine time unavailable,” not a client-invented date. This is an expected schedule, not proof of a sent/delivered message. Preserve Settings hash links, home-port editing, cancel/back paths and unrelated preferences. Load failure retains an explicitly stale prior snapshot/draft if present, not successful-looking defaults. Departure with unsaved changes must be clear and recoverable; cross-device/draft storage policy remains to agree.

#### C03 handoff: exact information needed from Son

The rows below are the required information checklist, **not an approved JSON schema**. Backticked existing names are current source names; names labelled proposed are discussion handles only. Son must publish exact wire names, types, enums, required/null/omitted semantics, validation bounds and examples in shared docs/types. No new field name, enum, default, endpoint or status code is adopted by this preparation.

| Information / existing or proposed field | Required write/read agreement |
| --- | --- |
| Subject and authority: existing `id`, `phone_number`; proposed actor ID, subject ID, roles, permitted operations, assistance scope and revocation status | Stable subject identity versus editable contact; authenticated actor derived/validated by server, not trusted client role. Self/assisted access boundaries, attribution and denial. `coop_id` or a client-selected fisher must not grant assistance. REG-01 consumes authority; REG-02 owns its broader flow. |
| Profile identity: existing `full_name`, `home_port_name`, `latitude`, `longitude` | Canonical returned name/port and numeric coordinates, valid ranges/order, absent/unconfigured behavior; which fields can be changed together. Do not substitute a default port or (0,0). Identify returned region/province hints, if provided, separately from authorized marine scope. Optional municipal IDs must not become REG-01 requirements; generated `licenseNo` is not verified evidence. |
| Proposed selected weekdays | Exact array element encoding and weekday mapping/order; up to five distinct valid days, duplicate/sixth/out-of-range errors; minimum and zero-day meaning pending D01. Distinguish missing legacy preference, explicit empty selection and any pause state. Return persisted selection on create/read/update/login or an agreed follow-up read. |
| Existing `preferred_advisory_time`; proposed timezone and routine enabled/paused state | Exact local-time format, seconds/granularity/allowed window and Asia/Manila interpretation; timezone returned explicitly or fixed by the written contract. Required versus unset state; no inherited 05:00/04:30 decision. Keep enabled/paused separate from stored preferences and `is_active`. |
| Habitat preference: local `speciesPreference`; proposed persisted habitat field | Confirm supported pelagic/demersal/both meanings, wire enum, unset/unsupported handling and relationship to current local field. A habitat choice is not evidence of supported species, catch probability or suitable coverage. |
| Proposed ranking preference | Supported option identifiers and descriptions; unset/unsupported behavior and persistence. Highest-score/nearest/combined are candidates from D04, not approved enum values or formulas. C06/D04 supplies selection semantics; Tier must not calculate a substitute ranking or silently choose a mode. |
| Proposed persisted language | Exact supported language codes, portal versus SMS scope and fallback; relation to current `en / tl / ceb / hil` device setting; migration and unavailable-language response. Planned Bicolano is not supported by assumption. Font size remains a device preference unless separately agreed. |
| Proposed contact verification status, method, verified timestamp and contact-change effect | Authoritative live versus preview/unverified/pending/failed/revoked/expired outcomes as applicable; exact enum is Son's. What contact change invalidates, whether preferences can be saved while unverified, and safe next action. No code/provider integration inferred from a status field. |
| Proposed separate routine-messaging, critical-alert and sponsor consent records | For each applicable purpose: granted/declined/unset/revoked semantics, policy version, recorded/effective/revoked timestamps and authenticated actor/provenance. Son must decide purpose boundaries and applicable legal/operational handling; no mandatory/default checked consent invented. Sponsor consent does not enable critical ads or establish messaging consent. Reports/GPS are not conditions of free SMS. |
| Proposed enrollment/dispatch eligibility and blocking reasons | Server-derived status distinguishes saved/unconfigured preferences, verification/consent required, paused/ineligible, service unavailable and eligible as applicable. Define whether any save activates enrollment or requires a separate approved action. `is_active`, local auth or HTTP success alone must not imply enrolled/scheduled/delivered. |
| Proposed profile revision, saved timestamp, preference effective-from and migration state | Canonical snapshot/version for stale-edit protection, server time and pending-versus-effective changes; explicit existing-user “needs setup”/migration semantics. Exact conflict/retry mechanism and omitted-versus-null update rules. Unrelated edits must not reset schedule or grant consent. |
| Proposed next routine occurrence, calculation reference and unavailable reason (C03/C04 boundary) | Server date/time with offset/zone or agreed equivalent; whether it reflects old/effective/pending preferences, edit cutoff and eligibility; null/unavailable reason. Son to identify the owning response and C04 dependency. Attempts/delivery history stay SMS-01/02 scope; preference UI does not fabricate them. |

#### Operations, responses and examples Son must supply

| Contract surface | Required canonical response/error examples before dependent integration |
| --- | --- |
| Create and authenticated read | Specify actual routes/methods/authentication and whether login/create returns the snapshot or requires an authenticated read. Same canonical fields across direct-DB and FastAPI fallback paths. Include new incomplete profile, complete saved profile, legacy missing preferences and explicit unknown/unsupported values. Never infer absent preferences from local default profile. |
| Preference update and port-only update | Specify PATCH versus PUT (do not assume a new endpoint), accepted payload fields and preserve/clear semantics. Return acknowledged saved snapshot/revision/effective timing and eligibility; clarify all-or-nothing behavior or explicit partial failure. Provide five-day save and a port-only change retaining days/time/habitat/ranking/language/consents, then the same values on independent read/login. |
| Validation failure | Exact HTTP statuses, stable error codes, field paths and safe user messages for duplicate weekday, sixth day, invalid weekday/time/habitat/ranking/language/coordinates; zero/minimum-day example after D01. No truncation, coercion or partial mutation hidden behind success. Client labels can translate codes rather than parse provider strings. |
| Access/contact/consent denial | Unauthenticated/expired session, wrong subject, denied/revoked helper, unverified contact and missing/revoked consent examples. Explain whether each blocks saving preferences or only enrollment. Do not collapse these into network failure or fall back to an offline “enrolled” account. |
| Concurrency/unavailability | Stale revision/conflict with canonical latest values, rate limit with retry guidance, offline/timeout, temporary backend failure and unsupported/not-yet-migrated contract examples. Agree a duplicate-safe retry/reconciliation mechanism for an ambiguous save; draft remains recoverable and no success is inferred. |
| C04 timing agreement | Selected/non-selected weekday, Manila UTC-midnight boundary, same-day before/after cutoff, no next occurrence and pending edit examples. Critical alerts remain independently eligible on non-selected days. Return a timing/eligibility explanation, not invented delivery confirmation. |

These are requested cases, not claims that the endpoints or response codes exist. Local fixtures/tests may encode them only after agreement. No live verification/provider request is needed to review a written contract.

#### Unresolved decisions and owner boundaries

| Decision | Required answer / block |
| --- | --- |
| D01 — Son with Tier | Minimum weekdays; whether zero pauses; explicit pause/resume semantics; required/default advisory time (legacy 05:00 versus 04:30 copy), valid time increments/window; same-day edit cutoff/effective time; treatment of legacy missing preferences and consent-safe migration. No auto-assigned five days or silent enrollment. Blocks valid form rules, migration presentation and next occurrence. |
| D02 — Son with Tier / REG-02 | Approved real verification/assisted route, self versus assistant allowed operations, revocation, contact-change effects and whether unverified users may store preferences. Decide account creation versus profile completion versus enrollment order and offline/demo separation. Blocks live contact/consent/assisted actions. |
| D04 / C06 — Son with Toby and Tier | Supported ranking modes, combined formula and honest descriptions; C03 storage enum must match operational selection. Blocks ranking activation; no local scientific substitute. |
| D07 / C04 — Son with Tier | Separate purpose consent/sponsor eligibility and provider readiness; distinguish persisted eligibility from operational scheduling. Blocks claims of enrollment/provider availability; no sponsored critical alerts or delivery promises. |
| D10 — Tier with Son/pilot partners | Review weekday/time/habitat/ranking/status labels, regional terminology, supported/fallback language and portal-versus-SMS preference relationship. Son persists approved values; pilot review remains pending. |
| C03 integration choices — Son coordinating Tier | Canonical create/read/update/login shapes; field nullability, unsupported values, partial-update and revision/retry semantics; handling divergent direct-DB/FastAPI responses and server defaults; draft/cache precedence and cross-account isolation. No extra ports/time from local defaults; no backend change by Tier. |

#### Candidate implementation boundary after Tier selects scope

- **Contract-first independent option:** After Son records an agreed C03 contract, Tier can implement an isolated accessible preference editor and mocked behavioral checks without production wiring. Requires explicit Tier selection; not started here. No fixtures with guessed D01/D04 defaults.
- **Persisted integration option:** After the contract and runtime are available, wire the editor into onboarding/settings, hydrate canonical values and acknowledge saves; preserve port-only edits, hash navigation and manual-SMS behavior. Consume verification/consent/authority outcomes; do not build REG-02, SMS dispatch/history, entitlements or ranking science under REG-01.
- **Likely Tier files, subject to selected scope:** `app/settings/page.tsx`; `app/onboarding/page.tsx`; `components/onboarding/HomePortOnboarding.tsx`, `home-port.ts`, `onboarding.module.css`; `components/application/application-copy.ts`, `application.module.css`; `components/auth/auth-copy.ts` only for approved progress/return labels; `context/AppContext.tsx`; `services/profileService.ts` only if chosen as the canonical client adapter; new `components/onboarding/RoutinePreferences.tsx` and its colocated tests if useful; `app/onboarding/home-port.test.ts`; `docs/tasks/tier.md`. Shared `types/index.ts` remains Son's prerequisite. Avoid editing auth verification logic or unrelated context telemetry. This is an estimate, not edit authorization.
- **Future focused checks:** Five unique days round-trip; sixth/duplicate/invalid input rejected; zero-day behavior only after decision; saved time/habitat/ranking/language reload; port-only and readability edits preserve schedule/consent; old/missing/unsupported fields stay honest; failed/ambiguous save never succeeds; conflicts and duplicate retries are recoverable; cross-account cache isolation; unverified/no-consent/denied-helper states never imply enrollment; server timing matches Manila boundaries/cutoff; keyboard/focus/mobile and reviewed language labels. Use mocks with external network disabled, then existing local TypeScript/lint and relevant frontend tests. These checks were planned, not executed in this documentation preparation.

| From assignment | To member | Requested file/contract change | Acceptance/example | Blocks | Status |
| --- | --- | --- | --- | --- | --- |
| REG-01-TIER preparation | Son, consulting Tier; Toby for D04/C06 ranking semantics | Record C03 fields, operations, response/error examples and D01/D02/D07 decisions above in `docs/tasks/shared.md`; coordinate D10 and C04 next occurrence. Update Son-owned `types/index.ts`, `app/api/users/register/route.ts`, `app/api/users/profile/route.ts`, `app/api/users/by-phone/route.ts`, `app/api/users/login/route.ts`, `parola-api-service/schemas.py`, `parola-api-service/models.py`, relevant user handlers in `parola-api-service/main.py`, `backend/migrations/**` and owned tests as required by the agreed design. Son chooses the actual implementation/migration; listed paths are inspected touchpoints, not a mandate to alter every file. | One canonical snapshot across create/read/update/login and backend paths; five-day round-trip; duplicate/sixth-day rejection; port-only update preserves preferences; explicit missing/paused/denied/failed/conflict states; server timing with cutoff/zone and no guessed enrollment. Include written examples before Tier encodes fixtures. | Dependent REG-01 editor rules, shared types, durable save/reload, eligibility and saved-next-day display. Broader REG-02/dispatch/model work remains with its assignment/owner. | Pending, recorded locally only. No external message sent, no Son/Toby file edited, no implementation scope selected. |

**Preparation checks:** Read the hub/shared/Tier instructions and REG-01/REG-02 reference criteria; inspected the local paths cited above without invoking them. Reviewed documentation diff and whitespace; verified the 16 existing UI-01 application-file changes remained byte-for-byte unchanged during preparation. No application tests/build/dev/browser were run for this documentation-only update; no external calls or installs. Preparation complete; REG-01-TIER implementation and acceptance remain unproven.

Handoff format: `from assignment | to member | requested file/contract change | acceptance/example | blocks | status`. Record requests here and summarize them in chat; this does not authorize sending external messages or changing the recipient's files. The recipient updates their own plan; Son updates shared integration decisions after coordination.

Completion report: assignment ID, owned files changed, focused checks/results, unmet prerequisites, and owner handoffs. Branch pattern: `codex/tier/<task>`. Create/use branches only when implementation is requested; this documentation update creates none.
