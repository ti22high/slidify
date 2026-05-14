import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import JSZip from 'jszip';
import { canonicalJson } from '../../shared/canonicalJson';

export const DOCUMENT_FILENAME = 'document.json';
export const MEDIA_DIR = 'media';
export const DATA_DIR = 'data';

export interface MediaAsset {
  /** Path inside the ZIP, e.g. `media/img-abc.png`. */
  mediaRef: string;
  bytes: Uint8Array;
  mime: string;
}

export interface SlidifyDocument {
  /** Serialized `EditorState`. */
  state: unknown;
  media: MediaAsset[];
  /** Optional data files (Sprint 6 will use this for XLSX). */
  data?: Record<string, Uint8Array>;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

export function extensionForMime(mime: string): string {
  return EXT_BY_MIME[mime] ?? 'bin';
}

/** Stable content-hashed media ref. */
export function mediaRefFor(bytes: Uint8Array, mime: string): string {
  const hash = createHash('sha1').update(bytes).digest('hex').slice(0, 16);
  return `${MEDIA_DIR}/img-${hash}.${extensionForMime(mime)}`;
}

export async function packDocument(doc: SlidifyDocument): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file(DOCUMENT_FILENAME, canonicalJson(doc.state));
  for (const m of doc.media) {
    zip.file(m.mediaRef, m.bytes);
  }
  if (doc.data) {
    for (const [name, bytes] of Object.entries(doc.data)) {
      zip.file(`${DATA_DIR}/${name}`, bytes);
    }
  }
  // Stable output: no compression timestamps, deterministic order
  const out = await zip.generateAsync({
    type: 'uint8array',
    compression: 'STORE',
  });
  return out;
}

export async function unpackDocument(bytes: Uint8Array): Promise<SlidifyDocument> {
  const zip = await JSZip.loadAsync(bytes);
  const docFile = zip.file(DOCUMENT_FILENAME);
  if (!docFile) throw new Error('Not a Slidify document: document.json missing');
  const stateRaw = await docFile.async('string');
  const state = JSON.parse(stateRaw) as unknown;
  const media: MediaAsset[] = [];
  const data: Record<string, Uint8Array> = {};
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    if (entry.name === DOCUMENT_FILENAME) continue;
    const buf = await entry.async('uint8array');
    if (entry.name.startsWith(`${MEDIA_DIR}/`)) {
      media.push({
        mediaRef: entry.name,
        bytes: buf,
        mime: mimeFromExt(entry.name),
      });
    } else if (entry.name.startsWith(`${DATA_DIR}/`)) {
      data[entry.name.slice(DATA_DIR.length + 1)] = buf;
    }
  }
  return { state, media, ...(Object.keys(data).length > 0 ? { data } : {}) };
}

function mimeFromExt(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return 'application/octet-stream';
  const ext = name.slice(dot + 1).toLowerCase();
  for (const [mime, e] of Object.entries(EXT_BY_MIME)) {
    if (e === ext) return mime;
  }
  return 'application/octet-stream';
}

export async function saveToFile(path: string, doc: SlidifyDocument): Promise<void> {
  const bytes = await packDocument(doc);
  await fs.writeFile(path, bytes);
}

export async function loadFromFile(path: string): Promise<SlidifyDocument> {
  const bytes = await fs.readFile(path);
  return unpackDocument(bytes);
}
