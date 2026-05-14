import type { FontAsset } from '../../../shared/ipc';

/**
 * Register the bundled font stack via the FontFace API.
 *
 * Offline-safe: if the preload bridge is unavailable (e.g. unit tests, or the
 * `assets/fonts/` directory is empty in dev) this resolves to `[]` and the
 * CSS font stack in `index.css` falls back to system fonts.
 */
export async function registerBundledFonts(): Promise<FontAsset[]> {
  if (typeof window === 'undefined' || !window.slidify?.listFonts) return [];
  let assets: FontAsset[];
  try {
    assets = await window.slidify.listFonts();
  } catch {
    return [];
  }
  if (typeof FontFace === 'undefined' || !document.fonts) return assets;

  const loaded: FontAsset[] = [];
  for (const asset of assets) {
    try {
      const face = new FontFace(asset.family, `url(${asset.url}) format('woff2')`, {
        weight: String(asset.weight),
        style: asset.style,
        display: 'swap',
      });
      const ready = await face.load();
      document.fonts.add(ready);
      loaded.push(asset);
    } catch (err) {
      // Air-gapped guarantee: a single missing/corrupt font must never throw
      // out of boot. Log and continue.
      // eslint-disable-next-line no-console
      console.warn(
        `[fontLoader] failed to load ${asset.family} ${asset.weight} ${asset.style}`,
        err,
      );
    }
  }
  return loaded;
}
