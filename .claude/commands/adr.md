---
description: Generate a new Architectural Decision Record in docs/adr/ from a topic.
argument-hint: "<short topic, e.g. 'svg-vs-canvas'>"
---

You are creating a new ADR for Slidify.

# Steps

1. Read existing `docs/adr/` to find the highest numbered ADR. The new one is `N+1`, zero-padded to 4 digits.
2. Slugify the topic from `$ARGUMENTS` (kebab-case, lowercase). Filename: `docs/adr/NNNN-<slug>.md`.
3. Read `CLAUDE.md` for the locked stack and hard constraints — your decision must not violate them. If it would, escalate to the user instead of writing the ADR.
4. Optionally delegate research to the `architect` subagent.
5. Write the ADR using the Michael Nygard template:

```
# NNNN. <Title in sentence case>

- Status: Proposed | Accepted | Superseded by ADR-XXXX
- Date: YYYY-MM-DD

## Context

<What forces are at play? What constraints from CLAUDE.md apply?>

## Decision

<What we will do, stated as a declarative sentence.>

## Consequences

<Positive, negative, and neutral consequences. Include performance, maintenance, and reversibility.>

## Alternatives considered

- **<Alternative 1>** — why rejected.
- **<Alternative 2>** — why rejected.

## References

- ECMA-376 §<n>, Electron docs, etc.
```

6. Open the file in the user's editor (or just print the path). Do not commit — let the user review first.
