# 0001. Stack: Electron + portable `.exe` + SVG + `.slidify` ZIP

- Status: Accepted
- Date: 2026-05-14

## Context

Slidify ships into an **air-gapped corporate environment**. Constraints handed
down at project kickoff:

1. **Single portable Windows `.exe`** — no installer, no folder, no
   side-by-side runtime. Users copy one file onto a locked-down workstation
   and run it.
2. **No network at runtime** — no CDN, no auto-update, no telemetry, no font
   server.
3. Must handle very large XLSX files (hundreds of thousands of rows) embedded
   into slides.
4. Must consume and produce real-world `.pptx` files without silently
   discarding user data.
5. Dev / test machine: macOS Apple Silicon. Production build runner: GitHub
   Actions `windows-latest`.

Within those constraints we had to choose: a desktop framework, a Windows
packaging target, a slide rendering backend, and a save-file format.

## Decision

We will use **Electron 32+** with **electron-vite**, packaged for Windows via
**electron-builder** with `target: "portable"` and `asar: true`, render slides
as **per-slide `<svg>` in the DOM with `viewBox` in EMU units**, and use a
custom **`.slidify` ZIP container** (`document.json` + `media/` + `fonts/` +
`data/`) as the primary save format. Native `.pptx` is supported via import /
export (Sprints 7 / 8) but is not the canonical store.

## Consequences

### Positive

- The whole runtime (Chromium + Node + app code) is statically packed into
  one `.exe` by electron-builder's portable target. Users get a true
  drag-and-run binary; nothing is written to `Program Files`.
- `asar: true` collapses the asset tree into a single archive inside the
  `.exe`, removing any temptation to ship a folder.
- SVG rendering reuses the same primitives Google Slides uses: free
  accessibility (DOM nodes, text selection), free print-to-PDF (via
  `webContents.printToPDF`), free zooming via `viewBox`, free hit testing.
- EMU `viewBox` matches OOXML's coordinate system 1:1, so PPTX import /
  export is a pure data shuffle — no unit conversion arithmetic at the
  geometry layer.
- A custom `.slidify` ZIP lets us evolve the schema additively (versioning
  in `document.json`) without being trapped by `.pptx` semantics. It also
  gives us a natural home for the "preserve unknown XML" blobs we round-trip
  through `.pptx` (Sprint 7), the raw XLSX bytes embedded by Sprint 6, and
  the bundled fonts.

### Negative

- Chromium is heavy: the resulting `.exe` will be 80–150 MB. Acceptable for
  an internal tool, but precludes "tiny utility" positioning.
- Electron forces us to manage two processes (main, renderer) and an IPC
  surface. We mitigate with a single typed `slidify` preload bridge and a
  single `dispatch(action)` entry point in the renderer store.
- Portable `.exe` writes its working state to `%TEMP%`. We pin runtime data
  (autosave WAL, sessions) to `~/.slidify/` explicitly (Sprint 4) so users
  can find their recovery files.
- Adding native modules (Sprint 6's `calamine` via napi-rs) requires Windows
  cross-compilation from CI; risk noted in the sprint.

### Neutral / reversible

- The save format is decoupled from the rendering backend. If we ever swap
  SVG for a canvas-based renderer, `.slidify` files keep working.
- Switching from `electron-builder` to a different packager (e.g.
  `@electron/forge`) is purely a build-pipeline change.

## Alternatives considered

- **Tauri + Rust + WebView2.** Smaller binaries, faster startup, lower memory.
  **Rejected:** Tauri on Windows relies on the system WebView2 runtime, which
  cannot be embedded inside a single `.exe` — it must sit alongside the binary
  or be installed system-wide. That breaks constraint #1 ("one file, no
  installer, no folder"). Air-gapped customer machines often lack WebView2
  entirely, and we cannot reach out to install it. Revisit if Tauri ships a
  bundle-WebView2 mode.
- **NSIS / MSI installer (electron-builder).** Standard Windows install
  experience. **Rejected:** users cannot run installers on locked-down
  workstations without IT approval. Portable is the only practical target.
- **Squirrel.Windows / `@electron/forge` Squirrel.** Auto-update friendly.
  **Rejected:** air-gapped — no auto-update channel reachable. Adds complexity
  for zero benefit.
- **Canvas2D for slide rendering.** Faster paint, lower DOM cost.
  **Rejected:** loses free accessibility, text selection, and
  `printToPDF`-based PDF export. Reimplementing those on top of Canvas2D is a
  whole sub-project. SVG matches Google Slides' own architecture.
- **WebGL for slide rendering.** Fastest, GPU-accelerated.
  **Rejected:** massive accessibility regression, no text reflow, no native
  PDF export path. Wrong tool for document editing.
- **Native `.pptx` as the canonical save format.** Maximum interop.
  **Rejected:** `.pptx` is schema-frozen by ECMA-376 — any Slidify-only
  feature (e.g. our internal animation timing model, or embedded XLSX data
  with `dataRef`) has nowhere to live. We would either lose data on every
  save or pollute namespaces. A custom container with PPTX import / export
  is the standard pattern (Keynote, Google Slides both do this).

## References

- ECMA-376 Part 1 Edition 5 — Office Open XML.
- Electron docs: [Portable target](https://www.electron.build/configuration/win#portable),
  [`webContents.printToPDF`](https://www.electronjs.org/docs/latest/api/web-contents#contentsprinttopdfoptions).
- Tauri docs on WebView2 distribution (as of writing, requires sidecar or
  system-installed runtime).
- Google Slides reverse-engineering writeups confirming SVG + EMU
  architecture.
