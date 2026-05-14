import { app } from 'electron';
import { promises as fs } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import type { FontAsset } from '../shared/ipc';

const FAMILIES = ['Inter', 'Roboto', 'NotoSans'] as const;

/**
 * Map a filename like `Inter-Bold.woff2` or `Roboto-Italic.woff2`
 * to its CSS font-weight + font-style. Defaults to 400 / normal.
 */
function parseStyle(filename: string): { weight: number; style: 'normal' | 'italic' } {
  const lower = filename.toLowerCase();
  const italic = lower.includes('italic') || lower.includes('oblique');
  let weight = 400;
  if (lower.includes('thin')) weight = 100;
  else if (lower.includes('extralight') || lower.includes('ultralight')) weight = 200;
  else if (lower.includes('light')) weight = 300;
  else if (lower.includes('medium')) weight = 500;
  else if (lower.includes('semibold') || lower.includes('demibold')) weight = 600;
  else if (lower.includes('extrabold') || lower.includes('ultrabold')) weight = 800;
  else if (lower.includes('black') || lower.includes('heavy')) weight = 900;
  else if (lower.includes('bold')) weight = 700;
  return { weight, style: italic ? 'italic' : 'normal' };
}

function fontsDir(): string {
  // In dev, assets/ sits at repo root. In packaged builds, electron-builder
  // copies it into the asar under resources/ — `app.getAppPath()` resolves
  // to the asar root in both modes.
  return join(app.getAppPath(), 'assets', 'fonts');
}

export async function listFontAssets(): Promise<FontAsset[]> {
  const dir = fontsDir();
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }

  const out: FontAsset[] = [];
  for (const file of entries) {
    if (!file.toLowerCase().endsWith('.woff2')) continue;
    const family = FAMILIES.find((f) => file.toLowerCase().startsWith(f.toLowerCase()));
    if (!family) continue;
    const { weight, style } = parseStyle(file);
    out.push({
      family,
      weight,
      style,
      url: pathToFileURL(join(dir, file)).href,
    });
  }
  return out;
}
