/**
 * In-renderer cache of `mediaRef → blob: URL` AND raw bytes. Populated on
 * import / load. Bytes are kept so we can serialise the doc to .slidify
 * (the URL alone is opaque). Never persisted directly — `document.json`
 * only stores `mediaRef`.
 */
const urls = new Map<string, string>();
const bytes = new Map<string, Uint8Array>();
const mimes = new Map<string, string>();
const listeners = new Set<() => void>();

export function setMediaUrl(mediaRef: string, url: string): void {
  const prev = urls.get(mediaRef);
  if (prev && prev !== url) URL.revokeObjectURL(prev);
  urls.set(mediaRef, url);
  for (const l of listeners) l();
}

export function getMediaUrl(mediaRef: string): string | undefined {
  return urls.get(mediaRef);
}

export function getMediaBytes(mediaRef: string): Uint8Array | undefined {
  return bytes.get(mediaRef);
}

export function getMediaMime(mediaRef: string): string | undefined {
  return mimes.get(mediaRef);
}

export function listMedia(): { mediaRef: string; bytes: Uint8Array; mime: string }[] {
  const out: { mediaRef: string; bytes: Uint8Array; mime: string }[] = [];
  for (const [ref, b] of bytes) {
    out.push({ mediaRef: ref, bytes: b, mime: mimes.get(ref) ?? 'application/octet-stream' });
  }
  return out;
}

export function subscribeMedia(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function registerBlob(mediaRef: string, blob: Blob): string {
  const url = URL.createObjectURL(blob);
  setMediaUrl(mediaRef, url);
  // Read bytes asynchronously and cache for later persistence.
  void blob.arrayBuffer().then((buf) => {
    bytes.set(mediaRef, new Uint8Array(buf));
    mimes.set(mediaRef, blob.type || 'application/octet-stream');
  });
  return url;
}

/** Used by the file-open path: register pre-known bytes (skips the async readback). */
export function registerBytes(mediaRef: string, bs: Uint8Array, mime: string): string {
  bytes.set(mediaRef, bs);
  mimes.set(mediaRef, mime);
  // Make a Blob from the bytes so we have a stable blob: URL for <image href>.
  const blobInstance = new Blob([bs], { type: mime });
  const url = URL.createObjectURL(blobInstance);
  setMediaUrl(mediaRef, url);
  return url;
}
