---
description: Pick the next unfinished sprint from SPRINTS.md and execute it per the workflow in CLAUDE.md.
---

You are continuing work on Slidify.

# Steps

1. Run `git fetch origin && git checkout main && git pull origin main`.
2. Read `CLAUDE.md` (full file) and `SPRINTS.md` (full file).
3. Find the **first sprint without a ✅**. That is the sprint to execute.
4. Create branch `feat/sprint-<N>-<short-topic>` from `main` and push it.
5. **Open a draft PR immediately**, titled `Sprint <N>: <topic>`.
   - PR body = the full execution plan: markdown checklist of every subtask in this sprint's SPRINTS.md entry, the files you intend to touch, and any design decisions you're locking in.
   - The user will read the PR description as their review surface before you implement.
6. Implement the sprint in small commits using Conventional Commits.
7. Run `pnpm typecheck && pnpm lint && pnpm test`. Iterate until clean.
8. Add unit tests in `tests/unit/`. For sprints 6 / 7 / 8, also add fixtures and integration tests.
9. Update `SPRINTS.md`: mark this sprint ✅ and link the PR.
10. Mark the PR **ready for review**. Do **not** merge.
11. Report the PR URL. **Stop**. Wait for the user to merge before running this command again.

# Hard rules

- Never push directly to `main`.
- Never force-push.
- Never add `Co-Authored-By` to commits.
- Never include "Generated with Claude" footers.
- Quality gates must be green before marking ready.

If you find an unfinished sprint with an open PR, **continue that PR** instead of starting a new one — rebase on main first.
