# Son's saved task list

Saved at Son's request on October 15, 2026. When Son asks for the list again,
use this file and the current evidence in [son.md](son.md). Keep the distinction
between implemented backend work, pending integration and completed assignments.
The UI belongs to Tier. These are the 27 Son assignments in active scope, including completed work; deferred and
superseded work is excluded. This list does not authorize starting other tasks.

1. **REG-02 — Registration: APPROVED SELF-SERVICE BACKEND COMPLETE.** Live OTP/session verification, owner enforcement, explicit consent/audit and database migration checks passed. Assisted operations remain disabled as agreed. Tier UI integration, full application acceptance and production deployment checks remain pending for the parent feature.
2. **REG-01 — Save advisory preferences: BACKEND COMPLETE.** Selected weekdays, delivery time, language and habitat preferences implemented; API checks and the user-run live migration verification passed. Tier UI integration and full parent acceptance remain pending.
3. **SMS-01 — Schedule routine advisories:** durable Manila-time scheduling with duplicate prevention.
4. **SMS-02 — Deliver critical alerts:** independent alerts, delivery tracking, safe retries and authenticated callbacks.
5. **SMS-03 — Track SMS costs:** message segments, encoding and consented sponsorship rules.
6. **SAFE-01 — Validate weather providers:** check freshness and quality, with controlled backup providers.
7. **SAFE-02 — Localize warnings:** send relevant warnings even when fishing inference is unavailable.
8. **SAFE-03 — Enforce shared safety rules:** withhold fishing guidance when essential inputs are missing or unsafe while preserving independently valid warnings.
9. **DATA-01 — Apply the ocean mask:** integrate Toby's validated mask and reject land-based fishing targets.
10. **DATA-02 — Record data provenance:** remove production simulation and track source, model, run and validity.
11. **DATA-03 — Store real environmental features:** validate units and scoring inputs.
12. **DATA-04 — Integrate historical clusters:** persist and serve Toby's validated VIIRS/DBSCAN outputs.
13. **MAP-01 — Standardize coordinates:** numeric latitude/longitude and consistent validation across endpoints.
14. **MAP-02 — Fix ranking and filtering:** eligible runs, freshness, pagination and nearest/highest-score selection.
15. **MAP-03 — Correct species/environment responses: BACKEND CONTRACTS COMPLETE.** expose supported values and units consistently.
16. **OPS-01 — Harden ingestion:** dates, run tracking, failures and operational visibility.
17. **REPORT-01 — Add trip reports:** structured voluntary reporting, including zero catch.
18. **REPORT-02 — Review assisted reports:** attribution, review and approval before learning from them.
19. **EVAL-01 — Support evaluation:** store and expose evidence for measuring outcomes.
20. **GEO-01 — Enforce permitted areas:** apply agreed geographic restrictions on the server.
21. **GEO-02 — Integrate conservation exclusions:** validated sources, coverage and versions.
22. **GEO-03 — Distribute recommendations:** apply agreed rules for suitable fishing grounds.
23. **ENT-01 — Implement entitlements:** vessel verification, access permissions and zone locks.
24. **ENT-02 — Generate Geo-Packs:** real exports with verified access and safety checks.
25. **UI-01 — Support consistent app journeys: BACKEND CONTRACTS COMPLETE.** align backend responses and documented capabilities with Tier.
26. **UI-02 — Support regional languages: BACKEND CONTRACTS COMPLETE.** persist language choices and provide agreed validation/fallback behavior.
27. **PRIV-01 — Complete privacy controls:** identity/report separation, scoped delegated access and consent enforcement.

UI-02/MAP-03/UI-01 live presentation migration/schema/evidence checks passed.
Tier UI integration, reviewed translations and Toby depth/HSI validation remain
separate dependencies before the full features can be accepted.
