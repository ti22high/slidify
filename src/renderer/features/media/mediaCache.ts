/**
 * In-renderer cache of `mediaRef → blob: URL`. Populated on import / load.
 * Never persisted — `document.json` only stores `mediaRef`.
 */
const urls = new Map<string, string>();
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

export function subscribeMedia(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function registerBlob(mediaRef: string, blob: Blob): string {
  const url = URL.createObjectURL(blob);
  setMediaUrl(mediaRef, url);
  return url;
}
