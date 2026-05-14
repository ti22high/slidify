/**
 * Missing-font substitution table. When a PPTX references a Windows-only font,
 * fall back to the bundled Slidify equivalent that ships in assets/fonts/.
 *
 * The mapping mirrors the well-known metric-compatible families used by
 * LibreOffice / Carlito-Calibri etc.
 */

export const FONT_SUBSTITUTIONS: Record<string, string> = {
  Calibri: 'Carlito',
  Cambria: 'Caladea',
  Arial: 'Liberation Sans',
  // Reverse direction — if someone authored in Carlito, render with the
  // Calibri metrics if available on the host machine.
  Carlito: 'Calibri',
  Caladea: 'Cambria',
  'Liberation Sans': 'Arial',
};

export function substituteFont(family: string, available: ReadonlySet<string>): string {
  if (available.has(family)) return family;
  const sub = FONT_SUBSTITUTIONS[family];
  if (sub && available.has(sub)) return sub;
  return family;
}
