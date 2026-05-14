# Slidify build assets

This folder is bundled into the portable `.exe` via `electron-builder` (`buildResources: assets`) and `extraResources` (for fonts).

## Icons (`icons/`)

Replace the placeholders with real artwork before shipping a release.

| File              | Format | Purpose                                  | Notes                              |
| ----------------- | ------ | ---------------------------------------- | ---------------------------------- |
| `icons/icon.ico`  | ICO    | Windows portable `.exe` app icon         | Multi-resolution 16/32/48/256      |
| `icons/icon.icns` | ICNS   | macOS dev build icon (`pnpm build:mac`)  | Optional, dev only                 |
| `icons/icon.png`  | PNG    | 512×512 source for icon generation tools | Optional, helpful for regenerating |

The current `.ico` and `.icns` files are **placeholders** that exist only so `electron-builder` does not error during the bootstrap CI run. Production releases MUST replace them.

## Fonts (`fonts/`)

See `fonts/README.md`. Fonts are loaded at boot via the FontFace API from this bundled folder — never from a CDN. The application is air-gapped at runtime.
