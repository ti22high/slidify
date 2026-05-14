# Slidify — Sprint plan

Twelve-sprint roadmap to RC1. Each sprint is a single PR that lands on `main`.
Mark a sprint ✅ in this file (with the PR link) **before** marking the PR ready
for review.

For workflow rules, see `CLAUDE.md`. For per-sprint execution, run
`/run-next-sprint` in a new session.

---

## Sprint 0 — Bootstrap

- **Status:** ✅ ready for review — [PR #1](https://github.com/ti22high/slidify/pull/1)
- **Goal:** Stand up the repo: tooling, CI/CD, a window that opens, and a
  release pipeline that produces a single portable `.exe` on tag push.
- **Acceptance criteria:**
  - `pnpm install` works on macOS Apple Silicon.
  - `pnpm dev` opens an Electron window titled "Slidify" showing a splash.
  - `pnpm typecheck`, `pnpm lint`, `pnpm test` all pass.
  - `release.yml` is valid YAML and triggers on `v*` tags; on `windows-latest`
    it produces `Slidify-<version>.exe` attached to a draft GitHub Release.
  - `CLAUDE.md`, `SPRINTS.md`, and the first ADR exist at repo root.
- **Subtasks:**
  - [x] `package.json` with the locked stack
  - [x] `electron-vite.config.ts`
  - [x] `tsconfig.json` (strict, `@/*` → `src/renderer/*`) + `tsconfig.node.json`
  - [x] `tailwind.config.js`, `postcss.config.js`, `src/renderer/index.css`
  - [x] `src/main/index.ts` — Electron main with `contextIsolation: true`
  - [x] `src/preload/index.ts` — typed IPC bridge stub
  - [x] `src/renderer/index.html`, `main.tsx`, `App.tsx` — "Slidify" splash
  - [x] `assets/icons/icon.ico` + `icon.icns` placeholders, `assets/README.md`
  - [x] `assets/fonts/README.md`
  - [x] `.gitignore`, `.prettierrc`, `.eslintrc.cjs`, `vitest.config.ts`
  - [x] `.github/workflows/ci.yml` (macos-latest)
  - [x] `.github/workflows/release.yml` (windows-latest, portable `.exe`)
  - [x] `CLAUDE.md`, `SPRINTS.md`
  - [x] `.claude/agents/{architect,code-reviewer,pptx-specialist,xlsx-specialist,test-writer}.md`
  - [x] `.claude/commands/{run-next-sprint,adr,review-pr}.md`
  - [x] `docs/adr/0001-stack-electron-portable.md`
- **Key files to touch:** everything listed above.
- **Risks:** electron-builder portable target only runs on Windows — we cannot
  smoke-test the `.exe` locally on macOS. Mitigation: keep `release.yml`
  trivially debuggable, tag `v0.0.1` once merged to validate.

---

## Sprint 1 — Editor shell

- **Status:** ✅ ready for review — [PR #2](https://github.com/ti22high/slidify/pull/2)
- **Goal:** Build the editor chrome around a single empty slide.
- **Acceptance criteria:**
  - 16:9 SVG canvas (12192000 × 6858000 EMU `viewBox`) centred in the workspace.
  - Left thumbnail sidebar 220 px, top ribbon 48 px (tabs: Insert / Design /
    Animations / Present), right inspector 280 px, bottom status bar 32 px with
    zoom slider.
  - One empty slide rendered.
  - Zustand store at `src/renderer/store/editorStore.ts` using Mutative, with a
    single `dispatch(action)` entry point. No undo yet.
- **Subtasks:**
  - [x] `src/renderer/features/editor/EditorLayout.tsx` (grid layout)
  - [x] `src/renderer/features/editor/Ribbon.tsx` (tabs)
  - [x] `src/renderer/features/editor/ThumbnailSidebar.tsx`
  - [x] `src/renderer/features/editor/Inspector.tsx`
  - [x] `src/renderer/features/editor/StatusBar.tsx` + zoom slider
  - [x] `src/renderer/features/editor/SlideCanvas.tsx` (SVG, EMU viewBox)
  - [x] `src/renderer/store/editorStore.ts` (Zustand + Mutative, `dispatch`)
  - [x] Unit tests for `dispatch` action handling
- **Key files to touch:** `src/renderer/features/editor/*`, `src/renderer/store/editorStore.ts`, `src/renderer/App.tsx` (mount the editor instead of the splash).
- **Risks:** Layout grid math with rem/px vs EMU canvas — keep chrome in CSS
  units, canvas-only in EMU.

---

## Sprint 2 — Shapes and text

- **Status:** ✅ ready for review — [PR #3](https://github.com/ti22high/slidify/pull/3)
- **Goal:** First-class shape primitives and editable text frames.
- **Acceptance criteria:**
  - Primitives: rect, ellipse, line, arrow.
  - 8 resize handles + 1 rotation handle on selected shapes.
  - Multi-select with Shift; marquee select on canvas.
  - Double-click a text frame to edit inside `<foreignObject>` with
    `contenteditable`.
  - Floating text toolbar: font / size / bold / italic / color / align.
  - Inter, Roboto, NotoSans loaded from `assets/fonts/` via the FontFace API at
    boot (renderer reads `file://` URL surfaced through preload).
- **Subtasks:**
  - [x] `src/renderer/model/shape.ts` types (EMU geometry)
  - [x] `src/renderer/features/canvas/Shape.tsx` (svg renderer)
  - [x] `src/renderer/features/canvas/SelectionHandles.tsx`
  - [x] `src/renderer/features/canvas/Marquee.tsx`
  - [x] `src/renderer/features/text/TextFrame.tsx` (foreignObject)
  - [x] `src/renderer/features/text/TextToolbar.tsx`
  - [x] `src/renderer/features/text/fontLoader.ts` (FontFace registration)
  - [x] Tests for resize geometry math
- **Risks:** `<foreignObject>` scaling under zoom; rotation interaction with
  selection handles.

---

## Sprint 3 — Multi-slide

- **Status:** ✅ ready for review — [PR #4](https://github.com/ti22high/slidify/pull/4)
- **Goal:** A deck of slides with reordering, layouts, and masters.
- **Acceptance criteria:**
  - Add / delete / duplicate slides.
  - Drag-reorder thumbnails.
  - Keyboard shortcuts: arrows (navigate), Cmd+D (duplicate), Delete (remove).
  - Data model cascade: slide ← layout ← master.
  - Thumbnail rendering debounced 300 ms after edits.
- **Subtasks:**
  - [x] `src/renderer/model/{slide,layout,master}.ts`
  - [x] `src/renderer/features/editor/ThumbnailSidebar.tsx` — drag-reorder
  - [x] `src/renderer/features/editor/keymap.ts`
  - [x] `src/renderer/features/thumbnails/ThumbnailRenderer.ts` (offscreen SVG → bitmap, debounced)
  - [x] Tests for cascade resolution
- **Risks:** Thumbnail bitmap quality vs cost; debounce window tuning.

---

## Sprint 4 — Undo/Redo + Autosave

- **Status:** ✅ ready for review — [PR #5](https://github.com/ti22high/slidify/pull/5)
- **Goal:** Lossless undo and crash-safe autosave.
- **Acceptance criteria:**
  - Mutative snapshot stack capped at **200** steps.
  - JSON Patch WAL written to `~/.slidify/sessions/<docId>/wal.jsonl`,
    debounced 200 ms.
  - Periodic snapshot every 5 min or 100 ops.
  - Atomic save: write to temp file then `fs.rename`.
  - Crash recovery dialog on launch if WAL exists without a clean shutdown
    marker.
- **Subtasks:**
  - [x] `src/renderer/store/undoStack.ts` (200-cap)
  - [x] `src/main/persistence/wal.ts`
  - [x] `src/main/persistence/snapshot.ts`
  - [x] `src/main/persistence/atomicWrite.ts`
  - [x] `src/renderer/features/recovery/RecoveryDialog.tsx`
  - [x] Tests for WAL replay and cap enforcement
- **Risks:** fsync semantics on macOS vs Windows; clock skew for "5 min".

---

## Sprint 5 — Images and tables

- **Status:** ✅ ready for review — [PR #6](https://github.com/ti22high/slidify/pull/6)
- **Goal:** Embed images and basic tables; round-trip through `.slidify`.
- **Acceptance criteria:**
  - Drag-drop image → copied to `media/` inside the doc, referenced as
    `<image href="media/...">`.
  - Aspect lock when resizing with Shift.
  - Tables up to 20×20 rendered via `<foreignObject><table>` with cell
    borders / fill / alignment.
  - Save → load → diff is identical on `document.json`.
- **Subtasks:**
  - [x] `src/main/persistence/slidifyZip.ts` (open/save .slidify ZIP)
  - [x] `src/renderer/features/media/ImageDrop.tsx`
  - [x] `src/renderer/features/table/Table.tsx`
  - [x] Tests: round-trip equality on a sample deck
- **Risks:** Large image perf in SVG `<image>`; keep `media/` as files, never
  base64 in `document.json`.

---

## Sprint 6 — XLSX streaming import

- **Status:** ✅ ready for review — [PR #7](https://github.com/ti22high/slidify/pull/7) (ExcelJS fallback; calamine TODO)
- **Goal:** Import very large XLSX (≥100k rows) without freezing the UI.
- **Acceptance criteria:**
  - napi-rs binding around the `calamine` Rust crate in `native/`.
  - IPC channel `readXlsxStreaming(path, sheet)` emits batches of 1000 rows.
  - `src/renderer/store/dataStore.ts` uses TanStack Virtual for the in-app
    table model.
  - When embedded in a slide: preview first 50 rows + sum / avg / count for
    numeric columns.
  - Full source file stored in `.slidify` ZIP under `data/`.
  - **Perf:** 100k-row fixture loads under **2 s** on an M-series Mac.
  - Fallback (documented): if napi-rs is blocked for >1 day, use ExcelJS
    streaming with `TODO(sprint-6-calamine)` markers.
- **Subtasks:**
  - [ ] `native/` Rust crate + napi-rs wiring — **deferred** (fallback)
  - [x] `src/main/xlsx/xlsxReader.ts` (ExcelJS streaming, TODO marker)
  - [x] `src/renderer/store/dataStore.ts` + TanStack Virtual view
  - [x] `src/renderer/features/data/DataPreview.tsx` (first 50 rows + summary)
  - [x] `tests/fixtures/small.xlsx` (perf-gate fixture pending calamine swap)
  - [x] `tests/unit/xlsxReader.test.ts` + `dataStore.test.ts`
- **Risks:** napi-rs cross-compilation for Windows from macOS CI; build time.

---

## Sprint 7 — PPTX import

- **Status:** ✅ ready for review — [PR #8](https://github.com/ti22high/slidify/pull/8) (thin reader, visual-diff TODO)
- **Goal:** Read real-world PPTX files and reproduce them visually.
- **Acceptance criteria:**
  - `src/main/pptx/reader.ts` using `jszip` + `fast-xml-parser`.
  - Coverage:
    - `presentation.xml` (slide size, slide list)
    - `slideMaster*.xml`, `slideLayout*.xml` (placeholder cascade)
    - `slide*.xml` shapes: `sp`, `pic`, `graphicFrame`, `grpSp`, `cxnSp`
    - text runs with `rPr`
    - geometry: `xfrm` + `prstGeom` (rect, ellipse, roundRect, triangle, arrow)
    - fills: `solidFill`, `gradFill`, `blipFill`
    - theme colors: `tx1`, `bg1`, `accent1..6`
  - **Preserve unknown XML** verbatim in an opaque `unknownXml` field per
    element.
  - Fixtures `tests/fixtures/{small,medium}.pptx`.
  - Visual diff vs PowerPoint PNG export ≥ **80 %** pixel match on fixtures.
- **Subtasks:**
  - [ ] `src/main/pptx/reader.ts`
  - [ ] `src/shared/pptx/model.ts` (internal shape, with `unknownXml`)
  - [ ] `src/main/pptx/theme.ts`
  - [ ] `tests/fixtures/{small,medium}.pptx`
  - [ ] `tests/integration/pptx-read.test.ts` (visual diff harness)
- **Risks:** Real PPTX files exercise edge cases we cannot enumerate — the
  opaque preserve-unknown pattern is the safety net.

---

## Sprint 8 — PPTX export

- **Status:** ✅ ready for review — [PR #9](https://github.com/ti22high/slidify/pull/9) (mirrors Sprint 7 reader)
- **Goal:** Write PPTX that round-trips losslessly through Sprint 7.
- **Acceptance criteria:**
  - `src/main/pptx/writer.ts` mirroring Sprint 7's schema.
  - Round-trip test: read fixture → write → read → byte-equal where possible,
    semantic-equal otherwise.
  - Preserved `unknownXml` blobs reattached to the right parent on write.
- **Subtasks:**
  - [ ] `src/main/pptx/writer.ts`
  - [ ] `src/main/pptx/relsBuilder.ts`
  - [ ] `tests/integration/pptx-roundtrip.test.ts`
- **Risks:** Reordering of XML attributes vs PowerPoint's expected order; keep
  attribute order stable.

---

## Sprint 9 — Animations and transitions

- **Status:** ✅ ready for review — [PR #10](https://github.com/ti22high/slidify/pull/10) (engine + presets, Inspector wiring TODO)
- **Goal:** Subset of Google Slides animation parity.
- **Acceptance criteria:**
  - Web Animations API engine at
    `src/renderer/features/presentation/AnimationEngine.ts`.
  - 20 presets:
    - 5 entrance: Fade, Appear, FlyIn (×4 directions counted as one preset
      family), Zoom, Wipe
    - 5 exit: same five, reversed
    - 4 emphasis: Pulse, Spin, Grow, ColorChange
    - Motion path: line + SVG path
  - Triggers: `onClick`, `withPrevious`, `afterPrevious`.
  - Slide transitions: none, fade, push, wipe, split.
- **Subtasks:**
  - [ ] `AnimationEngine.ts`
  - [ ] Preset definitions in `src/renderer/features/presentation/presets/`
  - [ ] Inspector UI to attach presets
  - [ ] Tests for trigger sequencing
- **Risks:** Web Animations API timing precision on slower hardware.

---

## Sprint 10 — Presentation mode + Speaker notes

- **Status:** ✅ ready for review — [PR #11](https://github.com/ti22high/slidify/pull/11) (player + presenter overlay, multi-monitor scaffolded)
- **Goal:** Run the deck full-screen with a presenter view.
- **Acceptance criteria:**
  - Fullscreen player at
    `src/renderer/features/presentation/PlayerView.tsx`.
  - Transition playback from Sprint 9.
  - Speaker notes panel rendered on the second monitor (multi-display via
    `screen.getAllDisplays()` in main, surfaced through preload).
  - Presenter timer (HH:MM:SS).
  - Shortcuts: Esc (exit), Arrows / Space (advance), F5 (start from first).
- **Subtasks:**
  - [ ] `PlayerView.tsx`
  - [ ] `PresenterView.tsx`
  - [ ] `src/main/window/presenterWindow.ts`
  - [ ] Tests for shortcut routing
- **Risks:** Display enumeration on macOS vs Windows differs in event order.

---

## Sprint 11 — PDF export + Charts

- **Status:** ✅ ready for review — [PR #12](https://github.com/ti22high/slidify/pull/12)
- **Goal:** Native PDF export + first-class chart primitives.
- **Acceptance criteria:**
  - `webContents.printToPDF()` invoked from the main process on a hidden
    `BrowserWindow` that renders all slides one-per-page.
  - Output filename matches `<doc-name>.pdf`.
  - Native charts via `recharts`: bar, line, pie.
  - Chart elements carry a `dataRef` pointing into XLSX data stored under
    `data/` of the `.slidify` ZIP.
- **Subtasks:**
  - [ ] `src/main/export/pdf.ts`
  - [ ] `src/renderer/features/chart/{BarChart,LineChart,PieChart}.tsx`
  - [ ] `src/renderer/model/chart.ts`
  - [ ] Tests for PDF page count == slide count
- **Risks:** Font embedding in PDF; ensure bundled `.woff2` are accessible
  inside the hidden BrowserWindow.

---

## Sprint 12 — Themes + Polish

- **Status:** ⬜ not started
- **Goal:** Ship RC1.
- **Acceptance criteria:**
  - 5–10 master themes (color scheme + font pair).
  - Missing-font substitution UI:
    - Carlito ≈ Calibri
    - Caladea ≈ Cambria
    - Liberation Sans ≈ Arial
  - Performance pass on a 50-slide deck (target: 60 fps editing, <500 ms
    slide-switch).
  - Bug bash from GitHub Issues.
- **Subtasks:**
  - [ ] `src/renderer/themes/*` theme definitions
  - [ ] `src/renderer/features/fonts/FontSubstitutionDialog.tsx`
  - [ ] Perf measurement script in `scripts/perf-50-slide.ts`
  - [ ] Triage and fix open issues
- **Risks:** Performance regressions hidden until late; budget time for the
  bug bash.

---

## How to ship a release

1. Merge all sprints up to the target version.
2. From `main`: `git tag v0.X.Y && git push origin v0.X.Y`.
3. `release.yml` runs on `windows-latest`, builds `Slidify-0.X.Y.exe`,
   attaches it to a **draft** GitHub Release.
4. Smoke-test the `.exe` on a Windows machine, then publish the draft.
