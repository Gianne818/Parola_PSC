# Parola: team task hub

Updated October 15, 2026. This is the starting point for the unimplemented backlog, not a request to execute every task.

## 1. Identify the member before coding

If the user has not explicitly identified themselves in the current chat, ask:

> Who are you working as: Tier, Son, or Toby?

**Wait for their answer.** Do not infer identity from a branch, account or another chat. Tier already identified themselves in the originating chat; teammates do not inherit that identity.

| Member | Responsibility | Open only your task checklist |
| --- | --- | --- |
| Tier | UI screens/interactions, accessibility, translations and client integration | [Tier's tasks](docs/tasks/tier.md) |
| Son | APIs, database, auth, SMS, permissions and shared integration contracts | [Son's tasks](docs/tasks/son.md) |
| Toby | Datasets, inference, models, clustering and scientific evaluation | [Toby's tasks](docs/tasks/toby.md) |

## 2. Select and respect the assignment

1. Read [shared ownership/contracts](docs/tasks/shared.md) and the identified member's checklist.
2. An explicitly requested owned assignment selects that task. For a general "continue", propose one ready owned ID and establish selection before coding.
3. Edit only that assignment's owner-approved files. Reading other code is allowed; implementing another member's portion is not.
4. If a contract/file belongs to someone else, record a handoff in your own plan and summarize it in chat. Continue only independent selected work; never impersonate another member or use a subagent to bypass ownership.
5. Report the assignment, files changed, checks, remaining dependencies and requested handoffs. Check off only your own completed portion.

Shared types, database contracts, dependency manifests/config and integration docs belong to Son. Explicit frontend/scientific exceptions are listed in the shared file map. Son coordinates integration without taking over Tier/Toby code. Explicit user-requested assignment changes must be recorded before code work.

These are agent workflow instructions, not filesystem security restrictions. User-requested documentation maintenance does not authorize application implementation.

## 3. Begin with a small owned task

| Member | First candidate, after explicit task selection |
| --- | --- |
| Tier | UI-01-TIER: qualify incorrect public/demo claims using current behavior; feature wiring waits for agreed APIs. |
| Son | REG-02-SON: start C03/D02 contact/consent/assistance agreement and tests before live verification. |
| Toby | DATA-01-TOBY: validate mask sources/fixtures before production publication or database changes. |

Use separate task branches/checkouts: `codex/tier/<task>`, `codex/son/<task>`, `codex/toby/<task>`. No branches or application changes are created by this split.

## 4. Preserve the proposal and release order

- Free Standard advisories: up to five selected weekdays; critical alerts are separate and may arrive any day.
- Hazard/unreliable essential inputs withhold actionable fishing guidance; independently valid official warnings remain eligible.
- Catch reporting is voluntary portal/authorized-assisted entry, including zero catch; no inbound SMS command/parser is a core requirement.
- No fabricated operational model/environment data, implied guaranteed delivery/catch, or unverified savings/accuracy/device claim.
- Marine entitlements, privacy, consent and reviewed catch/model data apply before live operation.
- A: trust/safety foundation; B: municipal pilot and scoped commercial trials; C: verified enterprise exports; D: separately validated roadmap.
- ROAD-01/UX-01/LEG-02 remain deferred; LEG-01 is superseded. Fuel pooling is outside the core proposal.
- Member checklists record proven completed portions (REG-01-SON backend is complete). A parent remains "Partial" until every active member portion and integration acceptance is complete.

## 5. References, decisions and sharing

- [Shared file map, all 31 parent mappings, C01-C08 contracts and D01-D10 pending decisions](docs/tasks/shared.md).
- [Detailed preserved plan, concept-note page references, H01-H22 findings and full acceptance cases](docs/reference/fixplan-detail.md). Consult the relevant parent only; the archive never authorizes other members' work.
- The external concept PDF and some local audits are not bundled. Essential requirements/attributed findings remain in the reference; do not add private files or credentials.
- The hub and new Markdown documents are intended for Git sharing. Commit/push only through an explicitly authorized workflow; never include unrelated changes.
- This reorganization changes only documentation and the hub's ignore entry. It does not implement features, send SMS, modify data, deploy, or start the backlog.
