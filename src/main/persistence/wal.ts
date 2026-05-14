import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { walPath } from './sessionPaths';

export const WAL_DEBOUNCE_MS = 200;

interface PendingBuffer {
  lines: string[];
  timer: NodeJS.Timeout | null;
}

const buffers = new Map<string, PendingBuffer>();

function flushNow(docId: string): Promise<void> {
  const buf = buffers.get(docId);
  if (!buf || buf.lines.length === 0) return Promise.resolve();
  const { lines } = buf;
  buf.lines = [];
  if (buf.timer) {
    clearTimeout(buf.timer);
    buf.timer = null;
  }
  const path = walPath(docId);
  return fs
    .mkdir(dirname(path), { recursive: true })
    .then(() => fs.appendFile(path, lines.join('\n') + '\n'));
}

/**
 * Append a serialisable operation to the WAL for `docId`, debounced WAL_DEBOUNCE_MS.
 * Returns a promise that resolves after the *next* flush completes (useful in tests).
 */
export function appendOp(docId: string, op: unknown): Promise<void> {
  let buf = buffers.get(docId);
  if (!buf) {
    buf = { lines: [], timer: null };
    buffers.set(docId, buf);
  }
  buf.lines.push(JSON.stringify(op));
  return new Promise((resolve, reject) => {
    if (buf!.timer) clearTimeout(buf!.timer);
    buf!.timer = setTimeout(() => {
      flushNow(docId).then(resolve, reject);
    }, WAL_DEBOUNCE_MS);
  });
}

/** Force-flush a session's pending WAL writes (used at shutdown). */
export function flushPending(docId: string): Promise<void> {
  return flushNow(docId);
}

export async function flushAll(): Promise<void> {
  await Promise.all(Array.from(buffers.keys()).map((id) => flushNow(id)));
}

export async function readWal(docId: string): Promise<unknown[]> {
  try {
    const raw = await fs.readFile(walPath(docId), 'utf8');
    return raw
      .split('\n')
      .filter((l) => l.length > 0)
      .map((l) => JSON.parse(l) as unknown);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

export async function truncateWal(docId: string): Promise<void> {
  await fs.rm(walPath(docId), { force: true });
}

/** Test-only: clear in-memory buffers so cases can start fresh. */
export function _resetBuffersForTests(): void {
  for (const buf of buffers.values()) {
    if (buf.timer) clearTimeout(buf.timer);
  }
  buffers.clear();
}
