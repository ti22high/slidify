# Slidify — Claude Code working agreement

You are working on **Slidify**, an offline desktop clone of Google Slides shipped as a single portable Windows `.exe`. Target environment: air-gapped corporate networks. Treat every choice as "must work with no internet."

## Locked stack — do not deviate

- **Electron 32+** with **electron-vite**
- **React 18 + TypeScript + Vite**
- **Zustand + Mutative** for state management (single `dispatch(action)` entry point)
- **Tailwind CSS** (local build, no CDN)
- **electron-builder** with target `portable` for win → produces a SINGLE `.exe` with no installer, no folder, no dependencies
- `asar: true` (everything inside one archive)
- `contextIsolation: true`, `nodeIntegration: false` in the renderer
- **XLSX parsing**: ExcelJS streaming for MVP; swap to `napi-rs` binding around the `calamine` (Rust) crate in Sprint 6
- **PPTX parsing**: `jszip` + `fast-xml-parser` (Sprint 7+)
- **Slide rendering**: per-slide `<svg>` in the DOM with `viewBox` in EMU units (914400 EMU = 1 inch). NOT Canvas2D. NOT WebGL.
- **Animations**: Web Animations API (no GSAP — licensing)
- **Save format**: `.slidify` — a ZIP container of `document.json` + `media/` + `fonts/` + `data/`
- **Bundled fonts**: Inter, Roboto, NotoSans in `assets/fonts/`

## Hard constraints — never violate

- **NO network calls at runtime.** No CDN, no external fonts, no telemetry, no auto-update.
- All assets embedded at build time.
- Single portable `.exe` via electron-builder target `portable`. **Reject** any installer (NSIS / MSI) target.
- Production builds **ONLY** on GitHub Actions `windows-latest` runner.
- Dev / test machine is macOS Apple Silicon.
- All measurements stored in EMU internally.
- Preserve unknown XML parts verbatim on PPTX round-trip. Never silently drop user data.
- Cap undo history at **200 steps**.
- Never store base64 images in `document.json` — always save as files in `media/`.

## Workflow rules — every sprint

1. Create a new branch named `feat/sprint-<N>-<short-topic>` from latest `main`.
2. Open a **draft PR immediately** after creating the branch, titled `Sprint <N>: <topic>`.
3. Put the **FULL EXECUTION PLAN** in the PR description (markdown checklist of subtasks, files to touch, design decisions). This is the user's review surface.
4. Implement all subtasks, committing logically grouped commits with **Conventional Commits** style (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).
5. Before marking PR ready: `pnpm typecheck`, `pnpm lint`, `pnpm test` must all pass locally.
6. Update `SPRINTS.md` — mark the sprint as ✅ done with PR link.
7. Mark PR ready for review. **Do NOT merge.** The user merges manually.
8. **Stop and wait** for user instruction before starting the next sprint.

Never push directly to `main`. Never force-push. Never add `Co-Authored-By` to commits. Never include "Generated with Claude" footers.

## Quality gates — every PR

- `pnpm typecheck` clean (no `any` without `// @ts-expect-error: <reason>`)
- `pnpm lint` clean (eslint + prettier)
- `pnpm test` all green (vitest)
- New features have unit tests in `tests/unit/`
- UI changes: PR description includes a "what changed visually" note
- Sprints 6, 7, 8 add fixture files to `tests/fixtures/` and integration tests

## Project layout

```
slidify/
├── src/
│   ├── main/        # Electron main process (Node)
│   ├── preload/     # contextBridge surface
│   ├── renderer/    # React app (path alias @/*)
│   └── shared/      # types shared across processes
├── tests/
│   ├── unit/        # vitest
│   └── fixtures/    # PPTX / XLSX test files (sprints 6–8)
├── assets/
│   ├── icons/       # icon.ico, icon.icns
│   └── fonts/       # Inter, Roboto, NotoSans .woff2 (gitignored binaries)
├── docs/adr/        # architectural decision records
├── .claude/
│   ├── agents/      # subagent definitions
│   └── commands/    # custom slash commands
├── .github/workflows/
│   ├── ci.yml       # macos-latest: typecheck + lint + test
│   └── release.yml  # windows-latest: portable .exe on tag push
├── CLAUDE.md        # this file
├── SPRINTS.md       # full 12-sprint plan
└── electron-builder.json
```

## How to continue

In a new session, say **"run next sprint from `SPRINTS.md`"** (or invoke `/run-next-sprint`).

The agent will:

1. `git pull` on `main`.
2. Read `SPRINTS.md`, pick the first sprint without ✅.
3. Execute it per the workflow rules above.
4. Stop after the PR is marked ready, waiting for the user to merge.

If you want a fresh ADR for a design decision, invoke `/adr <topic>`.
If you want a diff review against these invariants, invoke `/review-pr`.
