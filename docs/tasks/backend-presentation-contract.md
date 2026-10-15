# Son backend handoff: UI-02, MAP-03 and UI-01

Selected explicitly by Son; branch `codex/son/presentation-contracts`.
Current backend contracts accepted: Son supplied passing dry-run and apply output
for migration 04 after correcting the observed species schema. Evidence controls,
client-write denial, deployed fields and existing owner/consent checks passed;
fixtures rolled back with no OTP/SMS requests. Tier/Toby/full release acceptance
remain pending. The inspection notes below record the earlier mismatch.
Tier owns client implementation and acceptance. No SMS requests are needed.

## UI-02: language, validation and retries

REG-01 persists `preferred_language` (`en`, `tl`, `ceb`, `hil`) and returns it on
owner profile reads/updates. Responses now add `language_status` with `requested`,
`message_language: "en"`, `fallback` and `reviewed: false`. Persisted preference
does not establish reviewed translation coverage. Bicolano remains planned.
Registration errors retain `{error}` and add stable `code`, optional `field`,
and `message_language: "en"`. Tier should translate reviewed message keys and use
the English text as fallback; no new translations are represented as reviewed.

Codes include `invalid_json`, `unsupported_fields`, `invalid_phone`,
`invalid_preference`, `consent_required`, `consent_version_outdated`,
`auth_required`, `ownership_required`, `profile_not_found`, `conflict` and
`service_unavailable`. Existing rate-limit responses/Retry-After remain supported.
Request bodies are limited to 64 KiB of actual UTF-8 bytes and five seconds of
body-reading time: failures return 413 `payload_too_large` or 408 `request_timeout`
before downstream persistence/Auth actions.

Profile PUT retries set the same requested values; omitted preferences remain
unchanged. Repeating the same consent/version preserves its audit timestamp,
avoiding another consent event. Registration duplicates remain HTTP 409 and do
not overwrite an account: read the owner's profile to recover after uncertainty.
Never automatically retry OTP requests or SMS sends after an uncertain outcome;
an explicit user resend is a separate action. Report retry identities remain a
REPORT-01/C05 handoff, and durable SMS retries remain SMS-01/02 work. This change
does not claim those unimplemented channels are duplicate-safe.

## MAP-03: species and environment

Nearest-area lookup uses the deployed catalog fields `id`, `common_name`,
`family`, `representative_species` in `pelagic_species` and `demersal_species`.
`common_name` is exposed as the compatible display field `species_name`, with
`name_source: "common_name"`; absent `local_name` stays null. Scientific
representative names remain explicitly named, not relabeled as local names.
Exact aliases are full stored names or slash/comma/parenthesis/semicolon-delimited names;
matching is case-insensitive and whitespace-normalized. `pelagic:1` and
`demersal:1` are scoped identifiers. Partial/wildcard matches and ambiguous aliases
are rejected. Catalogs over the reviewed 200-row bound require an explicit
contract update instead of silent truncation.

Unknown/ambiguous requests return 422 `species_unsupported` with no predictions.
Catalog/schema failures return 503 `species_catalog_unavailable`, never a default
row. Resolved species constrain habitat before limiting, including regional
queries. Existing habitat scores remain unchanged. Responses identify
`prediction_scope: "habitat_model"`, `species_hsi_status: "unavailable"` and
`depth: null`/`depth_status: "unavailable"`. Fixed 45/250 metre depth and false
HSI adjustment claims were removed. Stored SST/chlorophyll retain real zero
values; missing values remain null. Existing model/run provenance is explicitly
`legacy_unverified` and cannot establish measured environmental conditions.

FastAPI catalog/prediction routes use the same exact aliases and reject unknown
or ambiguous matches; storage failure does not synthesize the seed catalog.
`species_suitability` and `species_catch_probability` are nullable while validated
inputs are unavailable; use `base_catch_probability` as the habitat score.
HSI is not proof of species presence. Toby's validated HSI/depth/source definitions
remain necessary before enabling adjustment. Shared live weather is exposed by
`/api/dashboard/weather`; no coordinate-hash weather or generated storm signal
is introduced. Tier must remove its existing `depth: 0` client placeholder and
consume missing-depth/adjustment metadata rather than showing it as measured.

## UI-01: capability evidence

`GET /api/capabilities` reads `public.service_capabilities` from migration 04.
It returns `source: "database"`, records with `id`, `status`, `ready`, `summary`,
`evidence_recorded`, `verified_at`, `valid_until`, and language/weather metadata.
Missing/incomplete storage returns 503 `capabilities_unavailable` and an empty
list; it never synthesizes a ready state from environment flags or preview/local
storage. Responses use `Cache-Control: no-store`.

Statuses are `planned`, `implemented`, `verified`, `unavailable`. Seed rows record
implementation only, not operational verification. `ready` requires a persisted
verified status, nonblank evidence reference, non-future verification instant and
unexpired validity. Expired/malformed evidence yields unavailable. Evidence
references themselves are not exposed publicly. Table RLS and revoked client
privileges prevent anonymous/authenticated writes. Evidence must be maintained
through the authorized server/operator workflow after deployment acceptance;
there is no client endpoint that can mark a feature verified.

Tier must bind scheduling/reporting/dispatch/export claims to the appropriate
persisted feature states. Capability evidence is informational; it does not
replace authorization, consent or safety gates.

## Apply and verify

Migration 04 does not change profiles, preferences or consent. The existing
transactional runner now accepts:

```powershell
node scripts/apply-registration-migration.mjs --presentation --dry-run
node scripts/apply-registration-migration.mjs --presentation
```

This requires the existing REG-02 schema. It verifies deployed species fields,
capability evidence constraints/write protection and existing owner/consent
checks. Fixtures roll back; the first command rolls back the migration too.
`--presentation --verify-only` checks an already applied migration. No Auth OTP or
SMS provider is called. The presentation mode cannot combine with cleanup or
preference migration mode. Real database confirmation and Tier/Toby acceptance
remain pending until recorded in Son's checklist; code alone is not release proof.

The user-run presentation dry-run reached the deployed database but rejected its
species schema, so migration 04 did not commit. Inspect actual public species/fish
column names/types without applying any migration:

```powershell
node scripts/apply-registration-migration.mjs --inspect-species
```

Share that metadata output to establish the correct mapping. The report does not
read row contents, send SMS or change accounts/schema.

The schema inspection supplied by Son confirmed integer IDs, common_name/family/
representative_species text, depth_min_m/depth_max_m numeric, pelagic sst_min_c/
sst_max_c and salinity fields, and demersal temp_min_c/temp_max_c and reef-distance
fields. Next.js projection, Python ORM/catalog responses and migration validation
now use that actual schema. Missing optimal temperatures are not synthesized.
Legacy startup creation/seeding of the incompatible species catalog was removed.
Regression checks passed: 23 JavaScript tests, 5 Python tests including compiled
ORM queries against the observed columns, scoped TypeScript and syntax checks.
Son subsequently reran dry-run and apply successfully; the corrected mapping
and capability migration are now verified live.
