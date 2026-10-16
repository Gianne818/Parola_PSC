# Parola: compact team backlog

Updated October 17, 2026. Six work packages per member; all original requirements remain traceable. This is a task entry point, not authorization to execute the backlog.

## Identity and selection

Use the identity explicitly stated in the current chat. Otherwise ask exactly:
> Who are you working as: Tier, Son, or Toby?

Wait for the answer. Read this hub, [shared ownership/rules](docs/tasks/shared.md) and that member's checklist. Select an owned package or portion before coding; for a general continue request, propose a ready portion and establish selection.

| Member | Responsibility | Six packages |
| --- | --- | --- |
| Tier | Frontend screens, interactions, local adapters, accessibility and client integration | [TIER-01–06](docs/tasks/tier.md) |
| Son | APIs, persistence, auth, SMS, permissions and shared contracts | [SON-01–06](docs/tasks/son.md) |
| Toby | Datasets, models, inference and scientific evaluation | [TOBY-01–06](docs/tasks/toby.md) |

## Work independently, integrate explicitly

- Each package lists owned files, acceptance checks and actual integration needs. Completed portions are reused, not restarted.
- Tier may finish frontend delivery with existing services, frontend-local models/adapters and isolated fixtures. An unavailable API does not block all UI work.
- Fixtures stay in tests or explicit development previews; they never replace normal app routes or simulate successful real saves.
- Son and Toby may likewise test owned boundaries in isolation. Shared schemas, operational permissions and scientific validity retain their owners.
- **Member delivery:** scoped owned implementation and required checks pass. **Integrated acceptance:** real producer/consumer behavior is verified. Track these separately.
- A member delivery can be complete while integration is pending. A full proposal feature still needs all required portions and integration evidence.
- Use one handoff per actual missing interface. C01–C08 classify integration needs; they are not blanket gates for isolated development.
- Branches remain `codex/<member>/<package>`; use focused PRs, review and authorized merge workflows. Several PRs may deliver one package.

## Protect the working application

Preserve established branded login/register screens, artwork/mascot, onboarding, dashboard/navigation, accessibility fixes and pelagic/demersal/both behavior unless explicitly asked to change them.

Preserve [PR #11](https://github.com/Gianne818/Parola_PSC/pull/11)'s agreed demo behavior: registration accepts a 1–6 digit demo code without OTP/provider calls, then saves the account and proceeds to onboarding; later phone/password sign-in needs no OTP. Account/profile persistence is real, not a synthetic-account selector or fake local success. See [baseline and limits](docs/tasks/shared.md#preservation-and-authentication-baseline).

This checkout is at PR #2 (c91a3f2). PR #11 was source-reviewed at 0642034, open/unmerged at inspection; its real runtime journey remains unverified. This update neither installs nor approves merging it.

## Delivery phases and first steps

- A: trust/safety foundation; B: municipal pilot and scoped trials; C: verified enterprise exports; D: separately validated roadmap.
- Free routine advisories use up to five selected weekdays; critical alerts remain independent and any-day. Budgets never cap safety warnings.
- Hazard/unreliable essential inputs withhold fishing guidance; independently valid official warnings remain eligible.
- Preserve voluntary zero-catch reporting, privacy/access controls, authoritative marine restrictions and truthful measured outcomes. No fabricated operational data.
- ROAD-01, UX-01 and LEG-02 remain deferred; LEG-01 remains superseded. Fuel pooling stays outside the core proposal.
- Inspect the chosen package and current code first. Separate remaining owned work from integration; do not repeat PR #2's completed portions.

## Reference and progress

- [Exact ownership, interfaces, decisions and all 31 parent mappings](docs/tasks/shared.md).
- [Original proposal detail, concept-note references and H01–H22 findings](docs/reference/fixplan-detail.md).
- Complete historical plans: [Tier](docs/tasks/tier-history.md), [Son](docs/tasks/son-history.md), [Toby](docs/tasks/toby-history.md). Reference only; current rules override historical instructions.
- Unproven packages remain unchecked. Distinguish source inspection, automated checks, manual acceptance and real integration.
- This reorganization authorizes no application edits, installs, live SMS, database operations, resets, commits, pushes or deployments.
