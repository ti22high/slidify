---
description: Invoke the code-reviewer subagent on the current branch's diff vs origin/main.
---

You are running a pre-merge review on the current Slidify branch.

# Steps

1. Run `git fetch origin main`.
2. Confirm there is a diff: `git diff --merge-base origin/main --stat`. If empty, report "no changes" and stop.
3. Delegate to the `code-reviewer` subagent with this prompt:

   > Review the current branch's pending diff against `origin/main`. Read `CLAUDE.md` first for invariants. Read `SPRINTS.md` for sprint-specific acceptance criteria. Walk the diff with `git diff --merge-base origin/main` and read changed files end-to-end. Report blockers and advisories in the format specified in your agent file.

4. Print the subagent's verdict verbatim.
5. If there are blockers, list them as a TODO checklist for the author. Do **not** mark the PR ready for review until blockers are resolved.
