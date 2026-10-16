<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Team implementation workflow

The backlog uses six owned packages per member: **Tier (frontend)**, **Son (backend/integration)** and **Toby (data/models)**. Start with [fixplan.md](fixplan.md), [shared ownership rules](docs/tasks/shared.md) and your member plan.

1. Before application implementation, use identity explicitly stated in this chat. If unknown, ask exactly: **Who are you working as: Tier, Son, or Toby?** Wait. Never infer identity from a branch/account or another chat.
2. Read the hub, shared rules and identified checklist: [Tier](docs/tasks/tier.md), [Son](docs/tasks/son.md), [Toby](docs/tasks/toby.md). Consult legacy/history/reference material only for selected work; historical instructions are superseded by current rules.
3. A named owned package/portion selects that work; an old ID selects only its mapped portion. For general continue requests, propose a ready owned portion and establish selection before coding. Do not execute the entire backlog.
4. Edit only selected, owner-permitted files. Read across roles for context; do not implement another member's task, impersonate them, use delegation to bypass ownership or change files through formatting/install/codegen side effects.
5. Owned implementation can proceed independently using existing services or isolated fixtures. Tier owns frontend-local models/types/adapters/components/tests in owned paths; shared API schemas/types, dependencies/config and backend authority remain Son's. Scientific validity remains Toby's. Missing shared work creates one exact producer/consumer integration handoff; continue independent selected portions.
6. Fixtures stay in tests or explicit development previews. Preserve branded UI, onboarding/navigation, habitat values and the [PR #11 authentication baseline](docs/tasks/shared.md#preservation-and-authentication-baseline). Do not replace default routes, manufacture sessions, alter the agreed demo OTP/password flow or report failed real saves as success.
7. Track member delivery separately from integrated acceptance. Report package/legacy portion, files, automated/manual checks, remaining work and handoffs. Check off only proven-complete owned delivery; pending integration need not keep completed owned work open. Full parent acceptance still needs all required owners and actual integration evidence.
8. Use task branches/checkouts `codex/<member>/<package>` and focused PRs; a package may span several PRs. Preserve user/teammate changes. Never stage, revert, reset or format unrelated work; commit/push/merge/deployment require the authorized workflow.

An explicit user reassignment takes precedence; record it in coordination documents before changing scope. Explicit documentation maintenance can update agreed team documents without selecting application work. Deferred/superseded features require separate prioritization. These are cooperation instructions, not filesystem access restrictions.
