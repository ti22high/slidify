# Bundled fonts

Slidify runs offline. All fonts must be embedded in the portable `.exe` at build time. **Never** fetch fonts from Google Fonts or any CDN.

## Required files

Drop the following `.woff2` files in this folder before running a production build. The renderer loads them at boot via the FontFace API.

| Family    | File                       | Source                                    | License             |
| --------- | -------------------------- | ----------------------------------------- | ------------------- |
| Inter     | `Inter-Regular.woff2`      | https://rsms.me/inter/ (release zip)      | SIL Open Font 1.1   |
| Inter     | `Inter-Bold.woff2`         | https://rsms.me/inter/                    | SIL Open Font 1.1   |
| Inter     | `Inter-Italic.woff2`       | https://rsms.me/inter/                    | SIL Open Font 1.1   |
| Roboto    | `Roboto-Regular.woff2`     | https://fonts.google.com/specimen/Roboto  | Apache 2.0          |
| Roboto    | `Roboto-Bold.woff2`        | https://fonts.google.com/specimen/Roboto  | Apache 2.0          |
| NotoSans  | `NotoSans-Regular.woff2`   | https://fonts.google.com/noto/specimen/Noto+Sans | SIL Open Font 1.1 |
| NotoSans  | `NotoSans-Bold.woff2`      | https://fonts.google.com/noto/specimen/Noto+Sans | SIL Open Font 1.1 |

## How they are loaded

Sprint 2 wires up `FontFace` registration. The build copies this folder via `electron-builder`'s `extraResources` → `resources/fonts/` next to the portable `.exe`. The renderer reads them at boot through `file://` URLs resolved by the main process.

## Substitutions

If a user's deck references a font we don't ship, Sprint 12's substitution UI maps it to the closest bundled match:

- `Calibri` → `Carlito` (when bundled) or `Inter`
- `Cambria` → `Caladea` (when bundled) or `NotoSans`
- `Arial` → `Liberation Sans` (when bundled) or `Inter`

## Do NOT commit `.woff2` files yet

Until the licensing and binary-blob policy is decided, these files are gitignored. Place them locally for builds; CI release jobs will fetch them from a vetted artifact location.
