# TIER-07 delivery — October 22, 2026

Tier explicitly selected the pasted MVP welcome/workspace addition. **Owned browser-only delivery: complete against isolated fixtures. Live integrated acceptance: pending.** TIER-05 retains its own completion/history and remains a separately preserved uncommitted batch.

## October 23 separate draft PR review

The user authorized separate TIER-05 and TIER-07 draft PRs, including the necessary scoped commits and pushes. These supersede earlier no-publication statements for the selected work only. TIER-07 depends on the separate TIER-05 branch; review it against TIER-05, merge TIER-05 first, then retarget TIER-07 to main. No merge or deployment was requested.

Independent review identified and verified fixes for two browser-preference recovery defects. A retry after a failed initial read now reads saved preferences instead of overwriting them with defaults. A newly mounted consumer reconciles changes missed while no consumer was mounted; failed in-memory edits remain intact. Three unit regressions and two browser regressions cover these cases, and re-review found no further actionable correctness issue.

A clean isolated TIER-07 source tree, excluding unrelated local auth files and scratch checkouts by construction, passes **full TypeScript with no custom exclusions**, the exact CI lint surface, **870 unit tests across 53 suites**, and **76 network-denied browser checks**. TIER-05 separately passes 853 unit tests, full TypeScript/CI lint and 69 browser checks. Documentation-only publication notes were added afterward; application/test code is unchanged from those checked trees. Both final PRs still require remote CI/human review and the live acceptance documented below.

**Build blocker:** `next build --webpack` fails on the unchanged existing print selector at `components/information/information.module.css:1794`. The same selector is present in origin/main; this file is excluded from both PRs. The default Turbopack build cannot be validated in the exported snapshots because their dependency junction crosses its filesystem root. No production build pass or unconditional merge readiness is claimed; these remain drafts pending the baseline build issue and review. No dependencies/configuration were changed to work around it.

## October 23 refinement — visible in the existing app

The user requested preserving navigation names and the established UI. This supersedes the original additional sidebar entry below: the primary navigation is exactly **Dashboard, Advisories, Updates, Reports, Settings**. `DashboardShell` retains only the workspace page title; no existing label, destination or navigation ordering was changed.

Existing accounts can open **Settings → Nickname & plan interest → Open workspace / Edit nickname & plan interest**. The new `components/workspace/WorkspaceSettings.tsx` is wired into `app/settings/page.tsx` and reuses the existing Settings section, definition-list, link and button classes directly. `/settings#workspace` scrolls to the section. Initial confirmed home-port onboarding still opens the welcome flow. Existing accounts are not forced through it.

The user's subsequent placement refinement moves this section directly below **SMS access** in the same right-hand Settings column. It uses that column's existing width, alignment and spacing; mobile stacking and navigation labels are preserved.

Workspace colors now inherit the existing shell tokens; panels inherit its radius, padding and shadow, and controls/heading hierarchy match the existing application. Onboarding retains the home-port screen's font variables and restrained heading size. No dashboard/map, auth, API or shared design-token file was changed for this refinement.

**Actual `npm run dev` route verification:** an existing Next.js 16.3.6 development server was found at `http://localhost:3000`. Read-only HTTP requests returned 200 for `/settings`, `/onboarding/welcome`, `/workspace`, `/workspace/preferences` and all four workspace routes, without rendered Next error documents. The existing server was reused and not stopped. Real authenticated account behavior remains unverified; the initial unsigned rendering correctly retains account guards.

**Refinement checks:** 74 isolated browser checks and 52 at native 200% zoom pass, including Settings visibility, unchanged navigation labels/order, existing Settings style reuse, preferred-workspace navigation, preference editing and 1280/834/390/320px overflow checks. Existing TIER-01 Settings/port checks (30) pass. Scoped ESLint and application TypeScript (243 files, same pre-existing exclusions) pass. Screenshots under `tier07-oct23/` and `tier07-oct23-zoom/` were inspected. SHA256 comparison against a durable pre-refinement snapshot confirms every unrelated starting dirty file is unchanged, including TIER-05, auth, other-owner documents and root config. No installs, database operations, commits, pushes or deployments occurred.

The October 22 evidence below is retained as historical delivery evidence; the navigation/Settings changes in this refinement take precedence.

## Result and files

Successful initial home-port saves now continue to optional plan interest, then an optional nickname and the chosen workspace. Profile/Settings port edits still return through `/profile` (the existing Settings redirect). Registration accepts the existing 1–6 digit demo code, and later password-only sign-in still goes to `/dashboard`. Those auth implementations are unchanged.

| Files | Purpose |
| --- | --- |
| `components/onboarding/HomePortOnboarding.tsx` | One destination change after confirmed initial save; existing edit/error/cache behavior retained. |
| `components/dashboard/DashboardShell.tsx` | Add My workspace to the existing desktop/tablet/mobile navigation; title and active state. All existing destinations retained. |
| `app/onboarding/welcome/page.tsx`, `app/workspace/preferences/page.tsx` | Initial welcome and later preference editor. |
| `app/workspace/page.tsx` | Open the browser-preferred workspace; Municipal default for existing accounts without preferences. |
| `app/workspace/{municipal,small,medium,large}/page.tsx` | Four thin routes using one shared workspace implementation. |
| `components/workspace/PreferenceFlow.tsx`, `PlanWorkspace.tsx`, `PreferenceNotice.tsx`, `use-workspace-preferences.ts`, `workspace.module.css` | Account guard, plan/nickname UI, local fallback notice/retry, shared workspace, scoped branding/styles. |
| `lib/frontend/workspace-preferences.ts` | Versioned account-ID-scoped browser preferences; strict parsing, Unicode nickname validation and in-memory fallback. No profile or entitlement writes. |
| `tests/frontend/workspace-preferences.test.ts` | Storage, reload, account isolation, malformed data, validation, recovery and notification behavior. |
| `tests/frontend/browser/workspace-{fixture.tsx,checks.mjs,preview.mjs,run.mjs}` | Explicit synthetic fixture, network-denied browser checks, local preview and screenshots. Normal app routes never import these. |
| `tests/frontend/browser/catch-reporting-checks.mjs` | Update only the navigation expectation to include the requested workspace link. |
| `docs/tasks/tier.md`, this file | Separate TIER-07 selection, delivery evidence and producer handoff. |

Municipal is free. Small ₱799, Medium ₱2,499 and Large ₱6,199 are monthly per-vessel proposals with **Register interest**. Scopes remain proposal information. Direct URLs neither change preference nor grant access. No FMA selector, radius enforcement, EEZ grant, checkout, payment, fleet workspace or unsupported export promises were introduced.

All views reuse TIER-05's `GeographicAccessStatus` and `CurrentPredictionExport` without modifying them, their client validators, or their producer APIs. Export requests contain the same home-port coordinates, region, habitat and species parameters; plan is never sent as authority. Browser download handoff retains demo/unverified/non-operational metadata and never confirms disk storage. Offline, denied, partial and unavailable exports produce no fallback file.

## Design and visual review

Direction: calm maritime utility, continuing Parola's green-and-paper shell, logo, production font variables (Inter Tight / Plus Jakarta Sans), outline icons and existing navigation. Local previews use installed system fonts without font requests. New styles use scoped color variables, 8px-based spacing, native controls and visible keyboard focus. No new motion was added. The shared shell's reduced-motion behavior is retained.

Agent screenshot inspection covered both welcome steps and all four workspace presentations, desktop 1280px, tablet 834px, mobile 390px/320px and native Chrome 200% zoom. Headings, optional-input guidance, plan prices, proposal caveats and mobile stacking were readable. Automated layout checks found no horizontal page overflow at those sizes. Keyboard/focus and named controls were exercised; no human pilot acceptance or assistive-technology session is claimed. Workspace content scrolls inside the existing application shell.

## Automated evidence

- **208 tests, 11 suites pass:** `node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/frontend/workspace-preferences.test.ts app/onboarding/home-port.test.ts tests/frontend/geographic-access.test.ts tests/frontend/prediction-export.test.ts tests/frontend/catch-reporting.test.ts tests/frontend/prediction-presentation.test.ts tests/frontend/map-geospatial.test.ts tests/frontend/drift-advisory.test.ts tests/frontend/weather-presentation.test.ts tests/dashboardService.test.ts lib/frontend/registration-client.test.ts`.
- **62 workspace browser checks pass:** `node tests/frontend/browser/workspace-run.mjs`. Covers the real auth/port/preference presentation against synthetic saves, failed registration/save, the one-digit demo code without OTP calls, later password sign-in destination, both skips, nickname validation, reload, account switch/logout, malformed/blocked storage, recovery, direct URLs, every tier's authorized fixture export, demo labels and denied/authentication/unavailable/partial/offline download failures.
- **46 native zoom browser checks pass:** `node tests/frontend/browser/workspace-run.mjs --native-zoom`. Chrome's default zoom is actually set to 200%, with DPR/CSS viewport verification; this is not root-font or viewport-only emulation.
- **Existing browser regressions pass:** `node tests/frontend/browser/run.mjs --tier-01` (30); `node tests/frontend/browser/catch-reporting-run.mjs` (90); `node tests/frontend/browser/access-export-run.mjs` (69). Includes report drafts/permissions/zero catch, profile persistence fixtures, port edits, geographic access/export validation, current-flow presentation and supported responsive states.
- **Scoped ESLint passes:** new workspace/preference/route/test files plus changed onboarding, shell and reporting-navigation check.
- **Scoped application TypeScript passes:** compiler API checks 242 files with the existing tsconfig options and incremental output disabled, excluding nested `scratch/**` worktrees plus pre-existing `components/auth/AccountAccessStatus.tsx` and `tests/frontend/browser/auth-restoration-fixture.tsx`.
- **Full repository TypeScript was run and fails on preserved errors:** `node node_modules/typescript/bin/tsc --noEmit --incremental false`. Those two auth-restoration files and nested scratch worktrees have missing imports/context fields or mismatched historical types. No new TIER-07 diagnostic appeared. Root config and unrelated auth work were not changed to hide them.
- `git diff --check` passes. No tests made live account, database, SMS, payment or model requests. Initial sandbox Chromium/temp-file failures were rerun successfully with the existing local tools and isolated network-denied browser profiles.

## Local previews

Start/restart with `node tests/frontend/browser/workspace-preview.mjs`. This binds only to `127.0.0.1:4177`, uses synthetic account IDs and blocks live requests. It is a development preview, not a deployment.

- [Welcome / plans](http://127.0.0.1:4177/onboarding/welcome) (completed preview accounts return to their workspace; use its preference editor to revisit both steps).
- [Preference editor / nickname](http://127.0.0.1:4177/workspace/preferences).
- [Municipal](http://127.0.0.1:4177/workspace/municipal), [Small](http://127.0.0.1:4177/workspace/small), [Medium](http://127.0.0.1:4177/workspace/medium), [Large](http://127.0.0.1:4177/workspace/large).

Screenshots were written outside the repository under the active Codex visualization directory's `tier07/` and `tier07-zoom/` folders. The browser runner supports `--screenshots=<absolute-directory>` to reproduce them.

## Conflict and integration boundaries

GitHub main was checked read-only at `badaa96a3c03778f5c30e6a554716ebad49d0b38`, matching origin/main and HEAD. No unfinished Git operation or staged change was present. The task branch is `codex/tier/tier-07-mvp-onboarding-workspaces`, created in the existing checkout at the same commit, preserving the working tree. There was no incoming-main overlap at that check. Selected onboarding/shell/test wiring was clean at the start; the existing dirty Tier plan received only the TIER-07 section. No guarantee is made about future concurrent changes.

Starting TIER-05/auth/documentation files were inspected and fingerprinted before edits; the temporary sandbox fingerprint file was unavailable for a final byte-for-byte comparison. The mutation/path audit shows no changes to the starting TIER-05 batch, unrelated auth files, shared rules, Toby documents or root configuration. No pull, stash, reset, batch copy, install, code generation, stage, commit, push, merge, deployment, database operation or live SMS/payment occurred.

**Future producer handoff:** TIER-07 → SON-01/06, for separate server nickname/plan-interest persistence only if prioritized. Example consumer need: `{ nickname: "Nene", preferred_plan_interest: "small", onboarding_version: 1 }`, bound to the canonical authenticated account, with validation, reload, denied and failed-write examples. This is not an approved/shared API schema. Son retains all payment, verified entitlement and geographic authority. No external message was sent.

**Pending live acceptance:** real registration/account save, cookie restoration, initial home-port persistence, browser reload/account switching, actual authorized export responses and compatible-software import. The successful synthetic tests certify frontend delivery only. Payment/verified geographic activation and server persistence are outside this browser-only MVP.
