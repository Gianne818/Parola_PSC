<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Team implementation workflow

This repository's backlog is split between **Tier (frontend)**, **Son (backend/integration)** and **Toby (data/models)**. Start with [fixplan.md](fixplan.md) and [shared ownership rules](docs/tasks/shared.md).

1. Before application implementation, use the identity explicitly stated in the current chat. If unknown, ask exactly: **Who are you working as: Tier, Son, or Toby?** Wait for the answer. Do not infer identity from a branch/account or another chat.
2. Read only the hub, shared rules and the identified member's checklist first: [Tier](docs/tasks/tier.md), [Son](docs/tasks/son.md), [Toby](docs/tasks/toby.md). Consult the detailed reference only for the selected task.
3. A request naming an owned assignment selects that work. For a general request to continue, propose one ready owned assignment and establish selection before coding. Do not execute the whole backlog automatically.
4. Edit only files permitted by both the selected assignment and the exact ownership map. Read-only investigation across roles is allowed. Do not implement another member's task, impersonate them, use a subagent to bypass ownership, or change their files through formatting/install/codegen side effects.
5. If another owner's contract/file is needed, record a handoff in your own task document and summarize it in chat. Continue only independent selected portions. Shared schemas/types/dependency manifests/configuration belong to Son; scientific/frontend exceptions are explicit in the shared map. Son coordinates integration without taking over the other owners' code.
6. Report your assignment ID, changed files, focused checks, remaining dependencies and handoffs. Check off only your own proven-complete assignment; a parent feature requires every active member portion and integration evidence.
7. Use separate task branches/checkouts (`codex/tier/<task>`, `codex/son/<task>`, `codex/toby/<task>`) when implementing. Preserve existing user/teammate changes; never stage, revert or format unrelated edits.

An explicit user reassignment takes precedence; record it in the coordination documents before changing application scope. Explicit user-requested documentation maintenance can update the agreed team documents without starting any application assignment. Deferred/superseded work requires separate prioritization. These instructions guide cooperating agents; they are not filesystem security permissions.
