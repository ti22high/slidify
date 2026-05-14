import JSZip from 'jszip';

const DOCUMENT_FILENAME = 'document.json';
const MEDIA_DIR = 'media';

const EXT_TO_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

function mimeFromExt(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return 'application/octet-stream';
  return EXT_TO_MIME[name.slice(dot + 1).toLowerCase()] ?? 'application/octet-stream';
}

/**
 * Same shape as the main-process `unpackDocument` but works in the renderer
 * (e.g. when a `.slidify` file is dropped on the window via HTML5 DnD).
 */
export async function unpackDocumentBytes(bytes: ArrayBuffer): Promise<{
  state: unknown;
  media: { mediaRef: string; bytes: ArrayBuffer; mime: string }[];
}> {
  const zip = await JSZip.loadAsync(new Uint8Array(bytes));
  const docFile = zip.file(DOCUMENT_FILENAME);
  if (!docFile) throw new Error('Not a Slidify document: document.json missing');
  const stateRaw = await docFile.async('string');
  const state = JSON.parse(stateRaw) as unknown;
  const media: { mediaRef: string; bytes: ArrayBuffer; mime: string }[] = [];
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    if (entry.name === DOCUMENT_FILENAME) continue;
    if (!entry.name.startsWith(`${MEDIA_DIR}/`)) continue;
    const u8 = await entry.async('uint8array');
    const ab = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
    media.push({ mediaRef: entry.name, bytes: ab, mime: mimeFromExt(entry.name) });
  }
  return { state, media };
}
