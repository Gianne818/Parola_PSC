> **REFERENCE ONLY - NOT AN EXECUTION QUEUE.** Preserved from the pre-split plan on October 15, 2026. Read the [hub](../../fixplan.md), [shared ownership](../tasks/shared.md) and your own member checklist first. Parent checkboxes below are historical definitions, not permission to perform another member's work. Use member-specific IDs for execution/status; unresolved policies and full acceptance criteria remain binding. Relative evidence links were rebased; explicit parent anchors were added. No substantive requirement or original H01-H22 finding was removed.

# Parola: Concept-Note Alignment and Frontend/Backend Fix Plan

Reviewed: October 14, 2026 (Asia/Manila).

This is an unimplemented improvement backlog. Updating this document does not implement its tasks, change application code, modify database records, send SMS, or deploy services. All implementation checkboxes remain unchecked. **Partial** describes existing repository behavior, not completion of this plan.

## 1. Proposal baseline and evidence

### 1.1 Product reference

Reference: [TIKI Concept Note for PSC XI](<D:/Renzo/TIKI_ConceptNote_PSC11.docx.pdf>), October 2026, 21 pages. References below use the PDF's printed page numbers. The note supplies proposed product requirements; it is not an instruction to execute deployments, access services, or change data.

| Area | Proposal baseline | Note reference |
| --- | --- | --- |
| Standard tier | Free service for municipal/artisanal fishers. Receiving SMS requires no app or mobile data, but does require cellular reception. Navigation may need a separate compass/GPS or prepared smartphone. | I, pp. 1-2; III.2, p. 6; VI, p. 10 |
| Routine advisories | Up to five fisher-selected weekdays weekly; one automatic pre-departure advisory on each selected day. Preferences change through the portal or authorized cooperative/LGU assistance. | I, p. 1; III.2, p. 6; IX, p. 18 |
| Critical alerts | Separate event-triggered outbound messages on any day, including non-selected days. Hazards suppress fishing coordinates. Delivery is monitored, not guaranteed; budgeted alert counts are not caps. | III.1, pp. 4-5; IV, p. 8; IX, p. 18; X, pp. 19-21 |
| Catch reporting | Optional internet-based portal reporting, directly or with authorized dockside assistance. Trip date, approximate area/coordinates where available, species, weight including zero catch, and effort; quality review before evaluation and later batch retraining. No incoming SMS catch parser is required. | III.3, p. 7; IX, pp. 18-19 |
| Predictions | Pelagic/demersal LightGBM using real environmental/biological inputs. Historical VIIRS DBSCAN clusters describe vessel activity, not verified catches or species ground truth. | III.1, pp. 4-5 |
| Safety sources | Proposed NOAA GFS wind, GFS-Wave sea conditions and official PAGASA advisories; ECMWF Open Data IFS is a proposed independent backup subject to validation. Withhold guidance when essential inputs remain unreliable. | III.1, pp. 4-5; X, p. 20 |
| Standard targeting | Pelagic/demersal selection within the registered municipal fishing area; highest-probability, nearest-above-threshold or combined ranking. Exact combined formula remains unspecified. | III.2, p. 6 |
| Enterprise | Proposed small plan: PHP 799/month, 50 km home-port radius outside municipal waters; medium: PHP 2,499/month, one selected FMA; large: PHP 6,199/month, Philippine EEZ excluding municipal waters. Custom fleet contracts are separate. | III.2, p. 6; VII.1, p. 13 |
| Exports and roadmap | One locked zone per single-vessel daily/24-hour cycle, with repeat downloads of that zone; planned 24-72h GPX/KML/GeoJSON exports. Chartplotter compatibility, satellite delta sync and institutional analytics require later validation. | VII.1, pp. 13-14; IX, p. 17 |
| Conservation | Track recommendation concentration and select another suitable ground within permitted areas. Automated MPA/no-take/seasonal exclusions depend on reliable government data; initial commercial deployment includes regulatory reminders. | III.1, p. 5; IX, pp. 18-19 |
| Funding and privacy | Optional consent-appropriate routine SMS sponsor credit without an extra billable segment; critical alerts and enterprise are ad-free. No continuous GPS tracking. Protect catch locations; institutional outputs must be suitably anonymized/aggregated. | III.2, p. 6; VII, pp. 12-14; IX, p. 19 |

These are proposed product rules, not independently verified interpretations of fisheries law, dataset licences, provider capabilities or device compatibility. Validate those dependencies before operational enforcement or production claims.

### 1.2 Repository evidence index

Evidence is local source inspection unless attributed to an earlier audit. File presence does not prove deployment, working integrations or validated models. Paths are repository-relative for portability.

| Key | Source | What it establishes |
| --- | --- | --- |
| E01 | [Lambda](../../backend/aws-inference/lambda_function.py), [SAM template](../../backend/aws-inference/template.yaml) | Random features/fallbacks, demersal score scaling, rank-based clusters, Cebu-default safety, duplicate loader, row inserts and a declared six-hour schedule. |
| E02 | [Nearest route](../../app/api/advisories/nearest/route.ts), [regional query](../../lib/regional-predictions.ts) | Regional filtering, deduplication and distance ordering exist. National selection still orders by date/probability; species lookup has a first-row fallback; demo cap is 1,000. |
| E03 | [Legacy hotspot service](../../services/supabaseHotspotService.ts), [context](../../context/AppContext.tsx), [map](../../components/features/hotspots/MapInner.tsx) | Raw geometry decoding, generated species/weather/depth, sample/cache fallbacks and map coordinate checks. Distinguish these from the newer dashboard flow. |
| E04 | [Dashboard service](../../services/dashboardService.ts), [helpers](../../lib/dashboard.ts), [components](../../components/dashboard) | Server-route consumption, deduplication, prediction dates, SMS simulation/acceptance distinction and incomplete/stale weather handling already exist. |
| E05 | [Weather route](../../app/api/dashboard/weather/route.ts), [weather service](../../services/weatherService.ts), [stored weather](../../services/supabaseWeatherService.ts) | Current Open-Meteo integration and regional hold lookup; missing hold data cannot establish safety. |
| E06 | [SQL schema](../../backend/migrations/01_schema.sql), [ORM models](../../parola-api-service/models.py), [API schemas](../../parola-api-service/schemas.py) | Registry, predictions, advisories, rating feedback, weather logs and fuel orders. Advisory time exists; selected weekdays, structured trip reports and enterprise entitlements are absent from these contracts. |
| E07 | [FastAPI](../../parola-api-service/main.py), [CSV ingestion](../../parola-api-service/ingest_predictions.py) | Existing user/ingest/advisory/rating APIs, species definitions, silent exceptions, date handling and cell construction. Reuse compatible capabilities instead of recreating older planned work. |
| E08 | [Auth UI](../../components/auth/AuthPage.tsx), [onboarding](../../components/onboarding/HomePortOnboarding.tsx), [settings](../../app/settings/page.tsx), [profile](../../app/profile/page.tsx) | Demo verification code, generated licence identifier, existing port editing and manual-SMS settings. |
| E09 | [Registration](../../app/api/users/register/route.ts), [profile API](../../app/api/users/profile/route.ts), [types](../../types/index.ts), [route auth](../../lib/route-auth.ts) | Existing account/profile persistence and ownership helpers; proposed preferences/delegation need consistent extension. |
| E10 | [SMS send](../../app/api/sms/send/route.ts), [webhook](../../app/api/sms/webhook/route.ts), [gateway](../../services/iprogSmsService.ts), [templates](../../templates/fishermanAlerts.ts) | Manual outbound sending, mock/live modes and inbound rating handler; inbound deduplication is in memory. These do not establish durable scheduled/critical dispatch. |
| E11 | [Landing](../../app/page.tsx), [pricing](../../components/information/pricing-data.ts), [guide](../../components/information/guide-data.ts), [resources](../../components/resources) | Command demos, daily 04:30 claims, rating-based feedback instructions, tier copy and some already-qualified preview claims. |
| E12 | [Geo-Pack modal](../../components/ui/OfflineGeoPackModal.tsx) | Client-generated sample files, local quota state and a static countdown; not real forecasts, server entitlements or device validation. |
| E13 | [Fuel service](../../services/fuelService.ts), E03 context | Fuel-order wrappers and local/sample pool state; not evidence of an end-to-end operational fuel product. |
| E14 | [Coverage audit](../../BACKEND_COVERAGE_AUDIT.md), [older backend plan](../../BACKEND_IMPLEMENTATION_PLAN.md) | Attributed earlier observations and proposals, not current deployment proof. Older backend work includes superseded SMS/simulation assumptions. |
| E15 | [Pelagic notebook](../../notebooks/pelagic_model.ipynb), [demersal notebook](../../notebooks/demersal_model.ipynb), [README](../../README.md) | Research/documentation context to reconcile with production features and product claims; existence is not deployed-model validation. |

### 1.3 Historical hotspot observations retained

The original plan reported 1,000 results from `GET /api/advisories/nearest?lat=10.3157&lon=123.8854&limit=1000`, including the examples below. These were **not re-queried for this update**. Validate shoreline/depth classifications with reliable spatial data.

| Latitude | Longitude | Model | Previously reported concern |
| --- | --- | --- | --- |
| 11.5833 | 122.6667 | demersal | Panay/Capiz coastal or land point. |
| 10.6667 | 122.5833 | demersal | Iloilo shoreline or land point. |
| 15.75 | 125.25 | demersal | Deep-Pacific location needing bathymetry/habitat validation. |
| 7.5833 | 127.0 | pelagic | Bounding-box edge; not proof of an error by itself. |

Approximate 0.0833-degree spacing is consistent with a 1/12-degree grid; it does not prove stored-row origin. The original 25-30% land-coverage estimate was not measured and is not retained as a verified statistic.

E14 separately reports 2,232 stored predictions dated September 25, 2026, with an unexplained insertion-date discrepancy. This is an earlier audit, not a fresh database check or proof the rows were synthetic. Do not relabel dates, lower thresholds or seed spots to make coverage appear current.

## 2. Concept-note alignment matrix

| Capability / note reference | Current mismatch | Required frontend change | Required backend/data change | Tasks |
| --- | --- | --- | --- | --- |
| Selected days; I p. 1, IX p. 18 | Time-only profiles, manual UI, daily copy (E06, E08-E11). | Weekday editor, saved schedule, assisted editing. | Persist up to five distinct weekdays; schedule in Manila time. | REG-01, SMS-01 |
| Any-day critical alerts; III pp. 4-5, IV p. 8 | Send/safety primitives do not establish independent durable routing (E01, E04, E10). | Show holds, unknown inputs and transmission state. | Independent events, suppression, retry, deduplication, delivery tracking. | SAFE-02/03, SMS-02 |
| Outbound-only core; III p. 7, IX p. 18 | Inbound ratings and ADVISORY/HOTSPOT/STATUS demos (E10-E11). | Scheduled-message examples and portal-reporting instructions. | Remove inbound replies as a core dependency; preserve legacy reference. | UI-01, LEG-01 |
| Portal reports; III.3 p. 7, IX p. 19 | 1/2/3 rating is not a trip report (E06-E07, E11). | Direct/assisted reports, zero catch, confirmation/history. | Structured records, actor authority, review and controlled learning export. | REPORT-01/02 |
| Real model inputs; III.1 pp. 4-5 | Random features, heuristic fallback, forced scores (E01). | Accurate live/stale/unavailable/demo labels. | Real datasets, calibrated outputs and run provenance. | DATA-02/03 |
| Historical VIIRS clustering; III.1 p. 4 | Rank-derived cluster IDs (E01). | Describe activity proxies accurately. | Actual historical-VIIRS DBSCAN with validated spatial parameters. | DATA-04 |
| Weather; III pp. 4-5, X p. 20 | Open-Meteo implementation; inconsistent thresholds (E01, E04-E05, E11). | Correct source labels and vessel-specific explanations. | Validated NOAA/ECMWF adapters, shared rules, persistent UNKNOWN. | SAFE-01/03 |
| Marine entitlements; III p. 6, IX pp. 18-19 | Administrative polygons do not establish marine permissions (E02-E03, E06). | Permitted-scope visibility and data-limit disclosure. | Server checks for municipal/FMA/EEZ scopes in every channel. | GEO-01 |
| Conservation; III.1 p. 5 | Validated restrictions/distribution not established (E01-E07). | Official reminders and validated overlays/alternatives. | Versioned restrictions when available; recommendation counts/rotation. | GEO-02/03 |
| Enterprise exports; VII p. 13, IX p. 17 | Prices plus sample files/local quota (E11-E12). | Verified vessel/plan/zone state; planned-feature labels. | Entitlements, atomic locks, real forecast exports and device tests. | ENT-01/02 |
| Monetization; III p. 6, VII pp. 13-14 | Ad/pricing UI does not prove contracts/consent (E10-E11). | Ad-free alerts/enterprise; qualified pricing claims. | Sponsor approval/consent, segment guard and cost monitoring. | SMS-03, UI-01 |
| Privacy/impact; IV pp. 7-8, IX p. 19 | Ratings cannot establish reviewed outcomes or savings (E06-E09, E15). | Privacy explanations; distinguish scores/targets/results. | Scoped access, de-identification, reviewed retention and pilot evaluation. | PRIV-01, EVAL-01 |

## 3. Prioritized implementation backlog

**Types:** Fix = incorrect/broken/misleading behavior; Improvement = strengthen an existing capability; Addition = add a proposal requirement. Tasks can include more than one type.

**Statuses:** Planned = work remains; Partial = some relevant code exists but acceptance is unmet; Needs verification = a runtime/schema claim cannot be established locally; Superseded = retained outside the current baseline; Deferred = optional or later-phase work.

**Priorities:** P0 = safety/prediction trust/release-blocking correctness; P1 = pilot completeness; P2 = enterprise/later improvement. Every checkbox is unimplemented work. Read installed Next.js guides as required by `AGENTS.md` before future framework changes; none are made by this documentation update.

### 3.1 Original 22 findings: complete traceability

H01-H22 retain the original issue numbers. Resolution tasks below contain the actions, dependencies and acceptance criteria. Partial does not mean deployed or complete.

| ID (original #) | Priority / status | Finding, corrected against current source | Evidence | Resolution |
| --- | --- | --- | --- | --- |
| H01 (1) | P0 / planned | No shared validated land/ocean filter across generation, ingest, query and rendering. Region containment is not an ocean mask. | E01-E03, E06-E07 | DATA-01, MAP-01 |
| H02 (2) | P0 / planned | Copernicus failure can generate random coordinates/environment rows. Actual deployment use remains unverified. | E01, E14 | DATA-02 |
| H03 (3) | P0 / planned | Loaded-model demersal outputs are normalized to 0.62-0.95, forcing finite scores above 0.60; heuristic branch differs. | E01 | DATA-03 |
| H04 (4) | P0 / planned | Demersal depth/slope/rugosity/reef/bottom/habitat inputs are generated rather than sourced. | E01 | DATA-03 |
| H05 (5) | P0 / partial | Legacy hex-geometry decoding can default to (0,0). Species selection tries API first; newer dashboard already uses API. Do not describe every path as Supabase-first. | E03-E04 | MAP-01 |
| H06 (6) | P1 / partial | National/legacy paths can mix dates/duplicate cells. Regional SQL and newer service deduplicate; latest-per-cell may still mix run dates. | E02-E04 | MAP-02 |
| H07 (7) | P1 / partial | National Next.js selection limits date/probability-ranked rows, not nearest rows. Regional SQL and FastAPI support nearest ordering. Client sorting cannot recover omitted rows. | E02, E04, E07 | MAP-02 |
| H08 (8) | P0 / planned | CHL is generated even after successful physical-data retrieval. | E01 | DATA-03 |
| H09 (9) | P1 / planned | Flattened-frame gradients do not represent validated 2D spatial fronts. | E01 | DATA-03 |
| H10 (10) | P1 / planned | Lambda cluster IDs use rank divided by 10; notebook work does not prove production historical clustering. | E01, E15 | DATA-04 |
| H11 (11) | P1 / partial | Legacy service assigns index-based species and may prepend user selection. New dashboard does not fabricate those lists. | E03-E04 | MAP-03 |
| H12 (12) | P0 / partial | Legacy wind/wave/storm fields use coordinate heuristics. New dashboard has provider readings; shared safety still needs work. | E03-E05 | MAP-03, SAFE-01 |
| H13 (13) | P1 / partial | Legacy/API species adjustments use fixed depth; newer service zero depth is a placeholder, not a measurement. | E02-E04 | DATA-03, MAP-03 |
| H14 (14) | P0 / partial | Lambda uses Cebu-default weather/Central Visayas label. Local dashboard weather does not establish national safety coverage. | E01, E05 | SAFE-02 |
| H15 (15) | P2 / planned | Duplicate model-loader definitions leave an overridden loader and obsolete global-model initialization. | E01 | OPS-01 |
| H16 (16) | P1 / partial | Host-local today() defaults can disagree with Manila date; frontend Manila-date helpers already exist. | E01, E04, E07 | OPS-01 |
| H17 (17) | P0 / needs verification | Advisory CHECK excludes UNKNOWN while Lambda can return it. No failing advisory INSERT is proven: Lambda weather INSERT stores boolean/reason, potentially losing UNKNOWN semantics. Inspect actual schema/consumers. | E01, E06-E07 | SAFE-03 |
| H18 (18) | P2 / planned | Individual prediction inserts need measured batch/transaction improvement. | E01 | OPS-01 |
| H19 (19) | P1 / planned | FastAPI startup/species exceptions silently pass and can conceal database failure behind defaults. | E07 | OPS-01 |
| H20 (20) | P1 / needs verification | Species lookup queries fields absent from checked-in definitions (including common_name/name), then tries an unrelated first row. Verify deployed columns rather than assert them. | E02, E06-E07 | MAP-03 |
| H21 (21) | P1 / planned | Lambda +/-0.05-degree envelopes differ from ingestion +/-0.005; actual source-cell geometry must define the size. | E01, E07 | OPS-01 |
| H22 (22) | P2 / planned | Demo limit/request of 1,000 remains. Bound/page web payloads without region starvation; basic-phone SMS is separate from web performance. | E02-E04 | MAP-02 |

### 3.2 Registration, preferences and authorized assistance

<a id="reg-01"></a>

- [ ] **REG-01 | Addition | P1 | Partial - Persist selected-day preferences.**
  - **Evidence:** E06, E08-E09; note I p. 1, III.2 p. 6, IX p. 18.
  - **Frontend:** Extend onboarding/settings with up to five distinct weekdays, advisory time, habitat/ranking preference, consent/contact status and saved schedule. Preserve home-port editing; explain any-day critical alerts.
  - **Backend/data:** Extend database, Next.js/FastAPI profile contracts and returned types consistently; validate weekdays server-side and persist preferences across sessions. Unrelated edits must not reset the schedule.
  - **Dependencies:** REG-02; minimum selection, pause/defaults and migration decisions in section 6.
  - **Acceptance:** Saved schedule/time/habitat reload correctly; duplicate/sixth-day input is rejected rather than truncated; UI/API agree on next routine day.

<a id="reg-02"></a>

- [ ] **REG-02 | Fix / Addition | P0 | Partial - Verify contacts, consent and assisted authority.**
  - **Evidence:** E08-E10; note IX pp. 18-19. Published demo code/generated licence do not verify a person or vessel; ownership helpers do not establish cooperative delegation.
  - **Frontend:** Keep preview verification explicit until real verification exists. Collect essential municipal contact/port information with optional BoatR/LGU identifiers; never present generated licence IDs as verified. Provide a clear assisted-registration/editing experience.
  - **Backend/data:** Persist verification, messaging consent and assistant scope/provenance. Use real outbound code verification or an approved assisted process; enforce authorization for each assisted operation. An inbound SMS number is not required for received-code entry in the portal.
  - **Dependencies:** PRIV-01 and provider/verification decisions. ENT-01 handles commercial credentials.
  - **Acceptance:** Demo code cannot establish live ownership; unverified/non-consenting contacts do not enter live dispatch; helpers cannot edit unrelated fishers and all assisted edits identify the actor.

### 3.3 Outbound SMS and maritime safety

<a id="sms-01"></a>

- [ ] **SMS-01 | Addition | P1 | Partial - Schedule routine advisories durably.**
  - **Evidence:** E01, E06, E08-E10; note I p. 1, IX p. 18. Send/log primitives and inference schedules do not establish recipient scheduling.
  - **Frontend:** Show saved schedule, next routine day and last attempt; distinguish preview, gateway acceptance and confirmed delivery where available.
  - **Backend/data:** Schedule verified consenting recipients by Asia/Manila weekday/time; select a fresh eligible habitat/ranking target from their home port. Format distance, bearing, GPS and optional link. Persist routine-job identity, deduplicate concurrent/retried runs, and check safety immediately before sending.
  - **Dependencies:** REG-01/02, MAP-02, GEO-01, SAFE-03, SMS-02, OPS-01.
  - **Acceptance:** One routine outcome per selected day; none on non-selected days. Hazardous selected days send the appropriate warning without fishing coordinates. No valid target produces honest unavailability, never sample coordinates. Receiving scheduled messages requires no portal login.

<a id="sms-02"></a>

- [ ] **SMS-02 | Fix / Addition | P0 | Partial - Route critical events independently and track delivery.**
  - **Evidence:** E06, E10; note III.1 p. 5, IV p. 8, IX p. 18, X pp. 19-21.
  - **Frontend:** Show queued/submitted/delivered/failed/unknown states as supported, and independent critical alerts in history. Gateway acceptance is not handset receipt.
  - **Backend/data:** Separate routine jobs and hazard events; persist recipient/event deduplication, attempts, bounded retries, gateway IDs and authenticated delivery reports where supported. Surface terminal failures for manual escalation. Reconcile a scheduled-day warning with the same critical event without duplicate sending; allow material escalation. Never gate critical routing on routine weekdays or subscription.
  - **Dependencies:** REG-02, SAFE-02/03; verify gateway callback/failover capabilities.
  - **Acceptance:** Alerts work on non-selected days and after five routine days; restart/retry does not resend an identical event unnecessarily. Genuine changed warnings remain eligible. Two budgeted alerts per fisher-month is never a hard cap.

<a id="sms-03"></a>

- [ ] **SMS-03 | Improvement | P1 | Partial - Govern segments, sponsorship and costs.**
  - **Evidence:** E10-E11; note III.2 p. 6, VII.2 p. 14, X pp. 19-21.
  - **Frontend:** Explain optional routine sponsorship separately; keep critical alerts/enterprise ad-free. Qualify rates/provider readiness.
  - **Backend/data:** Track encoding/billable segments for actual language templates and routine versus critical costs. Sponsor credits require contract/provider approval, appropriate consent and no extra billable segment. Drop credits rather than guidance when they do not fit. Budget monitoring must not silently suppress real warnings.
  - **Dependencies:** SMS-01/02 and production gateway quotation. PHP 0.40/segment and 15% extra segments are proposal assumptions, not verified prices.
  - **Acceptance:** No sponsor on critical messages, without consent, or when it adds a segment; mock/billable traffic stays distinct; Unicode/segment tests use actual payloads.

<a id="safe-01"></a>

- [ ] **SAFE-01 | Fix / Improvement | P0 | Partial - Validate weather providers and backup.**
  - **Evidence:** E01, E03-E05; note III.1 pp. 4-5, X p. 20. Current Open-Meteo integration is not NOAA/ECMWF implementation.
  - **Frontend:** Preserve source/validity/unavailable labels; remove generated hotspot weather from operational views. Do not relabel Open-Meteo as NOAA.
  - **Backend/data:** Plan NOAA GFS/GFS-Wave plus official PAGASA and validated ECMWF IFS backup. Record issue/run time, valid time, geography, units and quality; validate per-variable freshness/compatibility before failover. Proposed NOAA RTOFS/CoastWatch ocean backups also need feature compatibility checks.
  - **Dependencies:** Provider access/reuse terms and approved freshness limits in section 6; current providers remain honestly labeled until validated migration.
  - **Acceptance:** Primary failure uses only a suitable current backup. If essential inputs remain unreliable, withhold guidance; never infer safety from zero/default/heuristic readings. Independently available official warnings can still route through SMS-02.

<a id="safe-02"></a>

- [ ] **SAFE-02 | Fix / Addition | P0 | Partial - Localize warnings and decouple them from inference.**
  - **Evidence:** E01, E04-E05; note III.1 pp. 4-5, IX p. 18.
  - **Frontend:** Show checked area, warning coverage, validity/reason and incomplete states. Missing regional records are not clearance.
  - **Backend/data:** Match weather/official warnings to home ports and candidate guidance areas. Replace Cebu-only/national assumptions with validated spatial sampling and affected-area matching. Run independent safety evaluation so model failure or once/twice-daily inference cannot disable any-day alerts; one regional centroid may not represent all grounds.
  - **Dependencies:** SAFE-01, GEO-01 and agreed alert cadence/coverage.
  - **Acceptance:** Cebu conditions do not stand in for Bicol/Northern Mindanao; only applicable warning areas are asserted. Critical evaluation continues when inference fails.

<a id="safe-03"></a>

- [ ] **SAFE-03 | Fix | P0 | Partial - Share deterministic rules and preserve UNKNOWN.**
  - **Evidence:** H17; E01, E04-E06, E10-E11. Sample uses 1.5 m, dashboard 2 m, Lambda default 3 m. Bulletin presence/count is not a verified local wind-signal level. UNKNOWN can be lost in boolean-only weather storage.
  - **Frontend:** Use server-evaluated vessel-specific status/reasons consistently; keep known hold versus incomplete information distinct. Suppress actionable hotspot guidance, not just recolor a banner.
  - **Backend/data:** Define versioned shared rules for query/SMS/export; validate units, threshold boundaries and warning applicability. Persist NORMAL, SUPPRESSED_WEATHER_HAZARD and UNKNOWN semantics and permit warning-only records without target coordinates. Preserve known applicable hazards when another source fails. Inspect deployed schema before migration rather than assume an insert failure.
  - **Dependencies:** SAFE-01/02 and approved vessel rules. The note's small-banca example (>1.5 m or applicable signal No. 1) is not an independently validated global threshold.
  - **Acceptance:** Same vessel/inputs/rules give consistent channel decisions; missing data never becomes NORMAL, known warning survives another outage, and hazard/unknown states prevent actionable target retrieval or export bypass.

### 3.4 Prediction correctness, maps and operations

<a id="data-01"></a>

- [ ] **DATA-01 | Fix | P0 | Planned - Apply a validated ocean mask.**
  - **Evidence:** H01; E01-E03, E06-E07; note III.1 pp. 4-5.
  - **Frontend:** Reject malformed/out-of-coverage targets, omit server-rejected land points and show truthful empty states.
  - **Backend/data:** Add versioned PostGIS land data (proposed ph_land, GiST index/ocean predicate), loader and matching generation checks. Filter during inference, all ingestion and server queries; rendering is the last guard. Evaluate Natural Earth 1:10m-scale land/global_land_mask rather than assume sufficient small-island/coastline precision. A bounding box is neither an ocean mask nor an EEZ boundary.
  - **Dependencies:** Validated coastline source/accuracy/reuse. Do not apply an untested blanket 1 km shore buffer.
  - **Acceptance:** Validated land samples fail; ocean, small-island, shoreline and mixed-cell fixtures pass the correct classification. Count/quarantine historical bad rows first; preserve advisory links. Any deletion needs a separate reviewed backup/cleanup/rollback plan, not automatic execution from this document.

<a id="data-02"></a>

- [ ] **DATA-02 | Fix / Addition | P0 | Planned - Stop production simulation and record provenance.**
  - **Evidence:** H02; E01, E06, E14; note III.1 pp. 4-5, X p. 20.
  - **Frontend:** Distinguish observation time, prediction date/validity, generation time and fetch time; label stale/unavailable/demo data correctly.
  - **Backend/data:** Fail affected production runs on missing essential models/data; never publish random grids, dummy-trained models or heuristic substitutes. Keep last-good data with original validity and withhold guidance once invalid. Add source/model/run versions, timestamps, coverage, quality and outcomes; isolate demo fixtures from operational feeds.
  - **Dependencies:** OPS-01, SAFE-03 and validity policy. Separately inspect deployed Lambda version, scheduler enablement, logs and DB destination to explain E14; no inference invocation is implied.
  - **Acceptance:** Missing model/Copernicus inputs create visible failure/degradation without fabricated production rows. New outputs trace to inputs/model/run; legacy provenance remains unverified rather than retroactively invented.

<a id="data-03"></a>

- [ ] **DATA-03 | Fix | P0 | Planned - Use real environmental features and calibrated scores.**
  - **Evidence:** H03-H04, H08-H09, H13; E01-E02, E06-E07, E15; note III.1 pp. 4-5.
  - **Frontend:** Show supported depth/habitat/species evidence only with provenance; missing values are unknown, not measurements.
  - **Backend/data:** Obtain compatible Copernicus physical/CHL data; compute fronts on the 2D grid with correct spacing before flattening. Join GEBCO/Allen Coral Atlas coverage, reef/habitat/bottom features and biological priors; preserve surface versus bottom temperature semantics. Align training/inference feature order/units/missingness. Remove forced demersal score floor and calibrate with reviewed outcomes.
  - **Dependencies:** DATA-02, coverage/licences, EVAL-01. Earlier CHL product/GEBCO edition are candidates needing suitability checks. The note's 15 m source split is not a municipal boundary or universal demersal depth band.
  - **Acceptance:** No random CHL/depth/bottom features or forced above-threshold outputs; validated missing-feature behavior. Test shallow coverage gaps, deep habitat mismatch, gradients and surface/bottom fields. Do not replace missing bathymetry with universal 10-200 m or 15 km coastal heuristics.

<a id="data-04"></a>

- [ ] **DATA-04 | Fix / Improvement | P1 | Planned - Integrate real historical VIIRS DBSCAN.**
  - **Evidence:** H10; E01, E15; note III.1 p. 4.
  - **Frontend:** Describe historical nighttime activity support with date/coverage; never imply confirmed catch/species ground truth.
  - **Backend/data:** Quality-filter historical VIIRS VBD, run distance-aware spatial DBSCAN and record cluster version/geometry/support. Validate noise and any confidence adjustment with held-out data; tune parameters rather than adopting the former 0.15-degree suggestion as established. Prediction-cell clustering for display is separate.
  - **Dependencies:** DATA-02/03, VIIRS access/history, EVAL-01.
  - **Acceptance:** IDs trace to actual detection clusters, not rank buckets; cluster-free/noise areas are honest; adjustment is not described as validated accuracy without evidence.

<a id="map-01"></a>

- [ ] **MAP-01 | Fix | P0 | Partial - Normalize coordinates and remove legacy bypasses.**
  - **Evidence:** H01, H05; E02-E04, E07.
  - **Frontend:** Share a sanitized operational feed across dashboard/map/context; reject malformed/non-finite/(0,0)/out-of-coverage targets. Do not substitute samples after live failure.
  - **Backend/data:** Prefer server numeric ST_Y/ST_X outputs; remove legacy raw geometry decoding or replace with an equivalently guarded server RPC. Preserve longitude/latitude geometry order and explicit UI lat/lng.
  - **Dependencies:** DATA-01, MAP-02. Shore-based home ports remain valid registry locations; hotspot ocean checks must not indiscriminately reject them.
  - **Acceptance:** Malformed hex/WKT cannot produce Null Island; swapped coordinates fail. Legacy direct queries cannot bypass filters; maps, lists and SMS use consistent eligible targets.

<a id="map-02"></a>

- [ ] **MAP-02 | Fix / Improvement | P1 | Partial - Unify run validity, ranking and bounded payloads.**
  - **Evidence:** H06-H07, H22; E02-E04, E07; note III.2 p. 6.
  - **Frontend:** Preserve regional ordering, dates, deduplication and capped metadata; add defined ranking choices and clear no-eligible-area states. Page/load more without presenting a partial page as complete coverage.
  - **Backend/data:** Filter permitted scope, habitat, valid run/source and threshold before ranking/limiting. Use coherent validated runs per habitat/coverage instead of blindly global MAX date or mixed latest-per-cell rows. Standardize score units/tie breaks. Nearest mode uses distance; highest-score/combined modes follow their own validated contract. Profile 200 as an initial page-size candidate, not an unexamined cap.
  - **Dependencies:** DATA-01/02, GEO-01/03 and section 6 ranking. Reconcile existing 0.50/0.60 thresholds through validation, not arbitrary lowering.
  - **Acceptance:** No duplicate cell/model across runs; national limits do not hide regional results. Selected ranking is correct among eligible candidates; unavailable regions never silently substitute another region or invalid old run.

<a id="map-03"></a>

- [ ] **MAP-03 | Fix | P1 | Partial - Correct species and environment presentation.**
  - **Evidence:** H11-H13, H20; E02-E07.
  - **Frontend:** Remove index-based species, forced selected-species claims, fixed depths and coordinate-hash weather. Distinguish habitat support, HSI adjustment and actual species-specific prediction.
  - **Backend/data:** Resolve validated species identifiers/aliases against real schema fields. Unknown species returns an explicit unsupported state, never an unrelated first row or false adjustment claim. Use actual depth and shared weather data; HSI alone is not verified species presence.
  - **Dependencies:** DATA-03, SAFE-01, deployed species-schema inspection.
  - **Acceptance:** Unknown species cannot inherit first-row bounds; aliases agree across channels; no operational view presents zero/fixed depth or generated storm signal as measured.

<a id="ops-01"></a>

- [ ] **OPS-01 | Fix / Improvement | P1 | Partial - Harden dates, ingestion and run visibility.**
  - **Evidence:** H15-H16, H18-H19, H21; E01, E06-E07, E14; note IX p. 18. Loader/performance cleanup follows P0 trust controls.
  - **Frontend:** Show freshness/coverage/failures without secrets or successful-looking samples.
  - **Backend/data:** Use Manila calendar dates and timezone-aware log instants. Remove duplicate loader/dead initialization; batch inserts with a compatible method such as execute_values, validate counts and publish runs atomically. Derive cell envelopes from source resolution, enforce run/cell/model uniqueness and replace silent exceptions with redacted actionable errors. Preserve linked advisories/last-good runs instead of blind delete/reinsert.
  - **Dependencies:** DATA-02 and migration/backfill/rollback design. Reconcile declared six-hour schedule with proposed once/twice-daily inference separately from critical-alert evaluation.
  - **Acceptance:** Manila-midnight/early-morning dates are correct; failed partial batches never look complete; retries are idempotent and ingest paths match cell geometry; DB/model/source failures identify run/cause without exposing credentials.

### 3.5 Portal catch reporting and pilot evaluation

<a id="report-01"></a>

- [ ] **REPORT-01 | Addition | P1 | Planned - Add structured voluntary trip reports.**
  - **Evidence:** E06-E07, E11; note III.3 p. 7, IX p. 19. Existing 1/2/3 ratings are not weights or effort records.
  - **Frontend:** Add mobile form/history for trip date, approximate area or optional coordinates, species, nonnegative weight including explicit zero catch, and effort such as hours at sea. Explain internet reporting versus SMS reception; precise GPS/positive catch are not prerequisites.
  - **Backend/data:** Add authenticated structured create/read contracts, units, owner/advisory linkage where available, submission provenance and validation. Keep legacy ratings separate; make retries duplicate-safe and corrections reviewable.
  - **Dependencies:** REG-02, PRIV-01 and report-unit/effort decisions.
  - **Acceptance:** Zero-catch/no-coordinate trips can persist and be reviewed; invalid weights/effort fail; no false success on save failure, duplicate retry records or invented rating-to-weight backfill.

<a id="report-02"></a>

- [ ] **REPORT-02 | Addition / Improvement | P1 | Planned - Review assisted reports before learning.**
  - **Evidence:** E06-E10, E15; note III.3 p. 7, IV pp. 7-8, IX p. 19.
  - **Frontend:** Helpers act explicitly for permitted fishers; show submitted/reviewed/flagged states and correction guidance. Advisories must not depend on feedback participation.
  - **Backend/data:** Store fisher and assisting actor separately; review duplicates/plausibility and optional dockside verification. Export only eligible reviewed reports for reproducible evaluation and later batch retraining with dataset/model lineage and rollback. Do not retrain on every submission or equate an old integration boolean with review.
  - **Dependencies:** REPORT-01, PRIV-01, DATA-02, reviewer workflow.
  - **Acceptance:** Unauthorized helpers cannot submit/read other reports; flagged/duplicate/unreviewed rows are excluded from training exports; reviewed zero catches remain valid evidence; model promotion is separately evaluated and controlled.

<a id="eval-01"></a>

- [ ] **EVAL-01 | Improvement / Addition | P1 | Planned - Measure outcomes without overstating them.**
  - **Evidence:** E14-E15; note III.1 p. 5, IV pp. 7-8, IX p. 17, X pp. 19-21.
  - **Frontend:** Label percentages as scores unless calibrated evidence supports stronger claims. The 76% location example is not an accuracy statistic; savings/adoption/revenue are targets until demonstrated.
  - **Backend/data:** Evaluate pelagic/demersal separately with time/spatial holdouts, reviewed geotagged/effort-standardized catches and BFAR comparisons. Report the Pearson r >=0.60 target separately from precision/recall, with sample size/exclusions/uncertainty. Distinguish search-related fuel from whole-trip fuel using comparable trips/weather/effort; optional pilot fuel/distance/duration fields need a protocol and consent.
  - **Dependencies:** REPORT-02, DATA-02/03/04 and approved evaluation protocol.
  - **Acceptance:** Zero catches are handled explicitly; insufficient/unverified labels cannot yield claimed validated metrics. Controlled-test suppression is distinct from gateway delivery/at-sea receipt. Q1 150 fishers/3 trial vessels and Year-1 500 fishers/8 paid vessels remain targets until evidenced.

### 3.6 Spatial eligibility and conservation

<a id="geo-01"></a>

- [ ] **GEO-01 | Addition / Fix | P0 | Planned - Enforce proposed permitted areas server-side.**
  - **Evidence:** E02-E03, E06, E08-E09, E11-E12; note III.2 p. 6, VII.1 p. 13, IX pp. 18-19.
  - **Frontend:** Show registered municipal area or verified enterprise scope and restriction-data limits. Administrative polygons are not legal marine boundaries.
  - **Backend/data:** Use versioned validated municipal/FMA/EEZ datasets and registry/vessel context across query, SMS and export. Standard is within its registered municipal scope; commercial excludes municipal waters, with small 50 km radius, medium selected FMA and large EEZ access. Filter before ranking/limiting; client selectors cannot grant access.
  - **Dependencies:** Authoritative data, jurisdiction/product review, REG-02, ENT-01 for paid tiers and GT/boundary decisions. Limit pilot to validated coverage until adequate geometry exists; do not claim national enforcement.
  - **Acceptance:** Direct requests cannot bypass scope/commercial exclusions; island/exact-boundary fixtures follow approved policy; unknown coverage does not invent targets. Recommendation geofencing does not prevent vessel encroachment or certify legal clearance.

<a id="geo-02"></a>

- [ ] **GEO-02 | Addition | P1 | Planned - Stage authoritative conservation exclusions.**
  - **Evidence:** E01-E07; note III.1 p. 5, IX pp. 18-19.
  - **Frontend:** Initially show official-advisory verification reminders; label validated overlays versus missing data. Do not claim complete automated compliance.
  - **Backend/data:** Obtain BFAR/DENR-BMB/LGU MPA/no-take/seasonal closure data with provenance, effective dates and coverage/version. Automate exclusion across channels only after validation; define stale/conflicting-data behavior before enablement.
  - **Dependencies:** GEO-01 and data-sharing/licensing/geographic/regulatory review. Reminder-only staging does not waive validated pilot municipal/commercial eligibility.
  - **Acceptance:** Enabled active restrictions exclude targets in API/SMS/export; expiry/version changes work; missing coverage is disclosed rather than interpreted as no restrictions.

<a id="geo-03"></a>

- [ ] **GEO-03 | Addition | P1 | Planned - Distribute recommendations across suitable grounds.**
  - **Evidence:** E01-E07; note III.1 p. 5.
  - **Frontend:** Explain alternative-area suggestions/no suitable alternative; recommendation counts are not measured fishing pressure or biomass.
  - **Backend/data:** Atomically track municipal/commercial recommendations with retry-safe accounting. At a configurable pilot threshold, prioritize the next-best fresh/safe/permitted target without lowering confidence or bypassing locks. Keep rotation compatible with selected ranking and enterprise zone locks.
  - **Dependencies:** MAP-02, GEO-01, SMS-01/02; section 6 counting/window/threshold decisions and pilot evaluation.
  - **Acceptance:** Concurrent requests cannot bypass threshold; retries/re-downloads are not blindly new exposure; no alternate is land/restricted/unsafe/outside entitlement/below suitability. Otherwise withhold guidance honestly.

### 3.7 Enterprise and later capabilities

<a id="ent-01"></a>

- [ ] **ENT-01 | Addition | P2 | Planned - Verify vessels and persist entitlements/zone locks.**
  - **Evidence:** E06, E08-E09, E11-E12; note III.2 p. 6, VII.1 p. 13, IX p. 19.
  - **Frontend:** Show verified BFAR CFVLR/MARINA/GT details, operator/role, actual plan/scope/zone state. Keep Standard free; label unimplemented plans rather than imply working purchases/entitlements.
  - **Backend/data:** Persist vessel/operator verification, membership and subscription/trial status. Enforce atomic per-vessel zone locks and same-zone repeated downloads; custom fleet permissions are separate. Audit query/download events without claiming movement tracking. Payment/activation workflow needs selection; no payment provider is assumed.
  - **Dependencies:** REG-02, PRIV-01, GEO-01 and GT/cycle decisions. Scoped pilot trials precede complete paid SaaS.
  - **Acceptance:** Tampered client plan/GT grants nothing; simultaneous different-zone unlocks respect quota; repeat downloads consume no new quota; expiry/trial handling is explicit and does not affect free-tier critical alerts.

<a id="ent-02"></a>

- [ ] **ENT-02 | Addition / Fix | P2 | Partial - Generate real verified Geo-Packs.**
  - **Evidence:** E12, E01-E02; note VII.1 p. 13, IX pp. 17-18. Static sample files are not 24-72h forecasts.
  - **Frontend:** Select supported horizon/format and actual locked zone; show data generation/validity/source and unavailable horizons. Keep samples explicitly demonstrational until real generation exists.
  - **Backend/data:** Generate GPX/KML/GeoJSON from validated forecast data after spatial/safety/entitlement checks; include thermal/depth layers only with compatible inputs/formats. Protect downloads, retain run/export provenance and validate schemas. Never substitute today's points for an unsupported future horizon.
  - **Dependencies:** ENT-01, DATA-01/02/03, SAFE-03, GEO-01/02 and real forecast availability; Garmin/Furuno/Simrad compatibility testing.
  - **Acceptance:** Formats parse with correct coordinate order, zone and times; no hard-coded samples, excluded targets or suppressed guidance. Device imports pass before compatibility claims; same-zone format/horizon changes do not silently unlock another zone.

<a id="road-01"></a>

- [ ] **ROAD-01 | Addition | P2 | Deferred - Validate satellite, fleet and institutional capabilities.**
  - **Evidence:** E11-E12, E15; note VII pp. 13-14, IX pp. 17-19.
  - **Frontend:** Mark satellite delta sync, fleet views/multi-stop routing and institutional analytics planned until separately validated.
  - **Backend/data:** Test actual compatible satellite channels/costs; distinguish custom-fleet multi-zone contracts from single-vessel quotas. Produce only suitably anonymized/aggregated institutional reports. Query/download logs alone do not establish vessel tracks, fishing effort, biomass or stock recovery.
  - **Dependencies:** ENT-02, PRIV-01, EVAL-01, sufficient data and partner/device agreements.
  - **Acceptance:** Each capability has demonstrated pilot evidence and limitations before live claims; simulations/projected revenue do not prove service readiness or contracts.

### 3.8 Frontend alignment, privacy and useful enhancements

<a id="ui-01"></a>

- [ ] **UI-01 | Fix / Improvement | P1 | Partial - Align all public and signed-in journeys.**
  - **Evidence:** E03-E05, E08, E11-E12; note I pp. 1-2, III pp. 4-7, VI p. 10, IX pp. 17-19.
  - **Frontend:** Update landing/pricing/guide/resources, onboarding/settings, dashboard/alerts/updates, reporting and exports. Replace core command/reply-rating instructions with selected-day outbound examples and voluntary portal reporting; qualify unbuilt enterprise/satellite/compliance features. Preserve truthful demo, freshness/incomplete and verified-versus-sample labels plus existing port editing.
  - **Backend/data:** Bind schedule/report/eligibility/delivery states to persisted contracts; local storage/preview success is not operational confirmation.
  - **Dependencies:** Feature tasks; misleading claims may be corrected before capabilities ship without representing them as available.
  - **Acceptance:** No active core journey requires ADVISORY/HOTSPOT/STATUS or 1/2/3 replies; no unconditional daily/seven-day promise contradicts selection. Manual UI remains honestly described until scheduling ships. No guaranteed delivery/catch/savings/device support or mobile-data-free reporting claim.

<a id="ui-02"></a>

- [ ] **UI-02 | Improvement | P1 | Partial - Extend accessible regional-language flows.**
  - **Evidence:** E04, E08, E11; note IX p. 18.
  - **Frontend:** Extend existing support to clear Cebuano, Tagalog, Ilonggo/Hiligaynon and planned Bicolano instructions as appropriate, reviewed with pilot partners. Make weekday selection, zero-catch and assisted forms keyboard/screen-reader/small-screen usable. Preserve recoverable input and never label an offline unsaved draft submitted.
  - **Backend/data:** Persist communication language and stable validation/status contracts; bound payloads and tolerate slow connections without a native-app requirement.
  - **Dependencies:** REG-01, REPORT-01, translation review. English fallback is not completed local-language coverage.
  - **Acceptance:** Language templates retain hazard/schedule meaning; controls have labels/focus/non-color cues; retry creates no duplicate report/SMS; received SMS remains readable without internet.

<a id="priv-01"></a>

- [ ] **PRIV-01 | Addition / Improvement | P1 | Partial - Separate identity, reports and delegated access.**
  - **Evidence:** E06, E09-E10; note IX pp. 18-19. Existing RLS/ownership helpers are a starting point, not complete protection for new records.
  - **Frontend:** Explain optional reporting/purpose/consent, approximate location, assisted roles and proposed retention.
  - **Backend/data:** Enforce scoped server/RLS access to registry, reports/review, entitlements and audits, including service-role paths. Separate identifying registration from evaluation catch locations; anonymize before evaluation and suitable institutional sharing; protect raw exports. Proposed tamper-evident query/download logs and one-year retention need privacy/regulatory review. No continuous GPS tracking or sale/disclosure of personal catch locations.
  - **Dependencies:** REG-02, REPORT-02, ENT-01 and reviewed access/consent/retention design. Applicable legal requirements require separate verification.
  - **Acceptance:** Cross-account/cooperative/fleet access fails in UI/direct API; evaluation/institutional outputs follow approved de-identification; purge preserves record integrity. Any enforcement disclosure requires documented lawful basis/safeguards, not an automatic unrestricted feed.

<a id="ux-01"></a>

- [ ] **UX-01 | Improvement | P2 | Deferred - Preserve useful map/trip-planning additions.**
  - **Evidence:** Original feature list; E02-E04, E12; note III pp. 4-6, VII p. 13.
  - **Frontend:** Evaluate clearer hotspot zones, bathymetry contours and travel-time/fuel estimates. Forecast slider requires actual supported future data. Freshness/pipeline health remain core tasks, not deferred enhancements.
  - **Backend/data:** Generate display polygons from validated spatial support (for example appropriate cluster hulls); mask excluded land/restrictions for areas too. Estimates require vessel speed/consumption/route assumptions; straight-line bearing is not a verified navigable route.
  - **Dependencies:** DATA-01/03/04, GEO-01/02, ENT-02 and route/vessel inputs.
  - **Acceptance:** Layers/estimates show source/uncertainty; hulls never recommend excluded land. Estimated travel/fuel is not measured savings or official navigation guidance.

## 4. Delivery phases and release gates

These are future implementation phases. Advance on acceptance evidence, not UI presence.

| Phase | Work and sequence | Exit evidence |
| --- | --- | --- |
| A: Trust/safety foundation | DATA-01/02/03, MAP-01, SAFE-01/02/03, REG-02/PRIV-01 prerequisites; immediately qualify misleading UI-01 claims. Read-only deployment investigation for E14 before repair planning. | No fabricated operational data; validated coordinates/ocean exclusion; persistent unknown/hold states, shared suppression and run provenance. |
| B: Q1 municipal pilot and scoped commercial trials | REG-01, SMS-01/02/03, REPORT-01/02, MAP-02/03, DATA-04, OPS-01, GEO-01/03, UI-01/02, PRIV-01, EVAL-01. GEO-02 begins with reminders/data acquisition; scoped ENT-01 trial access precedes paid SaaS. | Selected-day SMS plus independent any-day alerts, structured reviewed reports, authorized assistance and validated pilot coverage. Q1 150 fishers/3 trial vessels are targets, not achievements. |
| C: Q2 enterprise exports | ENT-01/02, actual forecasts, format/device tests and validated conservation exclusions; continue evaluation and cost/delivery monitoring. | Server locks/entitlements, genuine protected downloads, device evidence and documented limits. |
| D: Q3/Q4 and later | ROAD-01, UX-01, validated regional/provider/partner expansion and institutional/satellite pilots. | Demonstrated capabilities, appropriately aggregated outputs and measured impact; projected revenue/adoption remains qualified. |

Inference, recipient SMS schedules and hazard evaluation are separate workloads. The declared six-hour schedule is not deployment proof or an adequate substitute for an independent critical-alert trigger. Agree proposed once/twice-daily inference separately; routine SMS follows saved recipient preferences.

## 5. Deferred and superseded work

<a id="leg-01"></a>

- [ ] **LEG-01 | Fix / archival reference | P2 | Superseded - Incoming SMS commands and rating feedback.**
  - **Evidence:** E10-E11, E14's older backend plan. Keep existing webhook/parser work historical/optional, outside pilot requirements. Outbound code verification and provider delivery callbacks are distinct from inbound user replies.
  - **Frontend/backend disposition:** Correct core instructions via UI-01; do not delete handlers or historical ratings as part of this document update. Any later reactivation needs separate product authorization/provider validation.
  - **Acceptance for future disposition:** Current proposal does not depend on inbound ADVISORY/HOTSPOT/STATUS or 1/2/3. Legacy ratings stay separate from structured reports. If reactivated, invalid/ambiguous messages must not become medium catch by default; durable idempotency must avoid losing failed retries through premature in-memory marking.

<a id="leg-02"></a>

- [ ] **LEG-02 | Optional addition | P2 | Deferred - Cooperative fuel pooling.**
  - **Evidence:** E06, E13 and older app/README direction; absent from the current note. Not a prerequisite for advisory delivery or the fuel-impact hypothesis.
  - **Frontend/backend disposition:** If separately prioritized, replace local/sample pools with persistent scoped membership/orders/commitments, validated capacities/statuses and authorized operations. Reconcile pool shapes with coop_fuel_orders. Do not imply verified discounts/payments/fulfilment/supply partnerships.
  - **Acceptance for future work:** Records survive sessions; authorization/concurrency pass; displayed volumes/discounts/statuses reflect confirmed records. No fuel code/data changes accompany this documentation update.

Earlier proposals for ocean-only production demo fallback, blanket demersal depth/coast bands and DBSCAN solely on current prediction cells are superseded by DATA-02/03/04. Demo fixtures belong in isolated labeled demonstrations, not operational fallbacks.

## 6. Decisions and external dependencies before implementation

These unresolved policies belong to later implementation planning. The documentation update must record them rather than invent defaults.

| Decision | Unresolved detail | Required outcome |
| --- | --- | --- |
| Weekday/time defaults and migration | Whether zero days pauses routine SMS, minimum selection, existing users with no preferences, edit cutoff and pre-departure defaults; code 05:00 versus copy 04:30. | Agree explicit behavior/consent-safe migration before REG-01/SMS-01; never silently assign five guessed days. |
| Verification/assistance | Demo verification, helper scope and approved live process. | Choose verification/provider contract and delegated registration/report/review permissions before live enrollment or cross-user access. |
| Freshness/safety/cadence | Input-specific validity, vessel thresholds/comparisons, local warning scope and independent event cadence. | Approve shared rules/validity/coverage and validate backup compatibility before operational guidance. |
| Ranking/distribution | Combined ratio formula, confidence policy, counting event/window/threshold, retries/re-download accounting and interaction with locks. | Define/test ranking and atomic rotation without weakening eligibility. |
| Marine boundaries/GT | Note mixes <3/>3 GT with 3.1/20.1 tier starts; 3.0 GT/fractional-boundary cases and authoritative geometry need review. | Validate legal/product classification, rounding/exact-boundary policy and coverage; do not guess vessel class. |
| Enterprise cycle | Daily versus rolling 24-hour wording; modal midnight reset, zone definition, scope changes, forecast revision and expiry. | Choose lock/reset/re-download rules before ENT-01; show real server reset information. |
| Gateway/costs | Quote, sender approval, delivery callbacks, failover and fees are not confirmed by integration code. | Verify production contract and encoding/retry/status behavior; keep no-inbound core and no budget cap on genuine hazards. |
| Sources/cleanup/publication | Coastline, marine boundaries, MPA/closures, VIIRS, shallow coverage and backups need validation; legacy row provenance unknown. | Validate/version datasets; count/quarantine before separately reviewed cleanup; plan migrations/backfills, atomic publication and rollback without invented provenance. |
| Reports/evaluation/retention | Units, effort requirements, review/correction ownership, pilot protocol and audit retention. | Agree minimal structured fields/consent, optional coordinates, review and evaluation eligibility; review proposed one-year audit retention. Never require positive catch or precise GPS for every report. |

## 7. Future acceptance and verification scenarios

These checks are for later implementation, **not executed for this Markdown update**. Use focused behavioral tests and mocked gateways; manual device/provider checks need their own verified setup. Reading this plan does not authorize real SMS, inference invocation or destructive SQL.

| Scenario | Expected result | Tasks |
| --- | --- | --- |
| Save five weekdays; sixth/duplicate input; reload and port-only edit | Persist valid schedule; reject invalid/excess input; preserve unrelated preferences. Test zero-day behavior after decision. | REG-01 |
| Demo code, unverified/no-consent contact, unauthorized helper | No false live verification/enrollment; deny unrelated access and attribute authorized assisted edits. | REG-02, PRIV-01 |
| Selected/non-selected days, concurrent/retried scheduler, process restart | One eligible routine outcome per selected day, none outside selection, correct Manila time, durable idempotency. | SMS-01, OPS-01 |
| Hazard on selected and non-selected days, fifth routine day already used | Suppress coordinates; critical alerts remain independent of routine days and budgeted monthly counts. | SMS-01/02, SAFE-03 |
| Stale/failed primary, valid backup; no valid backup; independent PAGASA warning | Use compatible current backup only; otherwise withhold guidance and preserve known warning/unknown semantics. | SAFE-01/02/03 |
| Threshold boundary, unit conversion, warning geography, vessel profiles | Deterministic consistent portal/SMS/export outcome; bulletin counts do not become local signal levels. | SAFE-02/03 |
| Gateway timeout/retry/duplicate callback/restart/terminal failure | Persistent attempts/deduplication, honest lifecycle and escalation; acceptance is not receipt. | SMS-02 |
| Sponsor credit, regional Unicode/multipart text, critical template | Consent/approval/no-extra-segment rules; critical/enterprise ad-free; separate costs and mock status. | SMS-03, UI-02 |
| Land controls: Iloilo (10.70,122.56), Roxas (11.58,122.75), Cebu City (10.31,123.89), Manila (14.60,120.98) | Reject validated land fixtures across generation/ingest/API. Check exact shoreline fixtures rather than assume rounded coastal coordinates are definitive. | DATA-01, MAP-01 |
| Ocean controls: Sulu Sea (8.0,120.0), Philippine Sea (13.0,126.0); small islands/coastal cells; malformed geometry/swapped coordinates | Preserve valid ocean classification; full eligibility tested separately. No Null Island or coordinate swaps; hotspot checks do not reject shore-based home ports. | DATA-01, MAP-01, GEO-01 |
| Missing model/Copernicus/CHL/bottom inputs; score-floor regression; legacy old run | No fabricated rows/current-date relabeling; invalid affected runs visible; source/model/run lineage and honest stale state. | DATA-02/03 |
| Spatial fronts/historical VIIRS cluster fixtures/noise | Correct axes/spacing; genuine historical clusters, no rank buckets or catch-ground-truth claims. | DATA-03/04 |
| Multiple dates/runs, national cap, regional selection and ranking modes | Scope/validity before limiting, no duplicates/region starvation, correct defined ranking and count metadata. | MAP-02 |
| Unknown species/known aliases, missing depth/weather | No first-row species substitution or synthetic measurement; supported matches consistent. | MAP-03 |
| Manila-midnight/UTC boundary, partial write, retry, differing ingest paths | Correct dates, atomic complete runs, matching source cells, visible errors and no orphaned advisory links. | OPS-01 |
| Zero catch/no coordinates, invalid weight/effort, failed save/retry | Persist legitimate zero/approximate-area report; reject invalid input; no false success or duplicates. | REPORT-01 |
| Assisted report/revoked helper/flagged record/training export | Scoped access/provenance; reviewed eligible data only, zero catches respected, no automatic live-model replacement. | REPORT-02, PRIV-01 |
| Standard, small 50 km, medium FMA, large EEZ and commercial municipal exclusions | Server rejects ineligible direct query/SMS/export; exact boundaries/GT follow validated policy. | GEO-01, ENT-01 |
| Active/expired restriction, stale coverage, concurrent recommendation saturation, no alternative | Enabled validated exclusions everywhere; unknown coverage disclosed; eligible alternatives only, otherwise no guidance. | GEO-02/03 |
| Concurrent different-zone locks, same-zone re-download, forged tier, expired entitlement | Durable server quota/access under agreed cycle; no extra repeat quota or client-granted access. | ENT-01 |
| Export parse/device import, unsupported horizon, expired/suppressed forecast | Correct geometry/time/provenance; no static or invented future targets; verified device claims only. | ENT-02 |
| Mobile/keyboard/screen reader, pilot-language review, slow network | Usable labels/focus/errors/status; preserve recoverable input; duplicate-safe retry; SMS reception needs no internet. | UI-01/02 |
| Cross-account/fleet access, raw catch export, institutional report, retention/purge | Deny unauthorized access; protect identities/locations; approved aggregation/retention and record integrity. | PRIV-01, ROAD-01 |
| Pilot model/fuel/adoption report | Sample sizes/limits; separate models, scores/accuracy, search/whole-trip fuel, suppression/delivery and targets/achievements. | EVAL-01 |

For later code changes, run focused TypeScript/Python and integration checks, then `npm test` and `npm run build` when applicable. Inspect portal flows/export files manually and use gateway mocks for routine testing. A future PostGIS intersection check should require **zero land intersections in eligible published/served predictions**; historical quarantined rows need not be deleted merely to force a zero count across the entire table.

## 8. Documentation review checklist

- [ ] Every original H01-H22 maps to an actionable task, acknowledging partial fixes and correcting unsupported runtime claims.
- [ ] Alignment tasks cover frontend, backend/data, dependencies and acceptance, beyond hotspot rendering alone.
- [ ] Source pages/evidence resolve; proposed features are not labeled deployed or validated.
- [ ] Selected-day routine SMS, independent any-day alerts and voluntary portal/assisted reporting agree throughout.
- [ ] Two-way SMS and fuel pooling remain traceable outside the core pilot requirements.
- [ ] Unsettled policies/dependencies are explicit rather than invented.
- [ ] This update changes only fixplan.md relative to the pre-edit workspace; all existing code/document changes remain intact. Application tests and operational actions are unnecessary for this documentation-only edit.
