import { promises as fs } from 'node:fs';
import { atomicWriteFile } from './atomicWrite';
import { cleanShutdownPath, snapshotPath } from './sessionPaths';
import { truncateWal } from './wal';

export interface Snapshot {
  docId: string;
  ts: number;
  state: unknown;
}

/** Atomically write a snapshot and truncate the WAL. */
export async function writeSnapshot(docId: string, state: unknown): Promise<void> {
  const snap: Snapshot = { docId, ts: Date.now(), state };
  await atomicWriteFile(snapshotPath(docId), JSON.stringify(snap));
  await truncateWal(docId);
}

export async function readSnapshot(docId: string): Promise<Snapshot | null> {
  try {
    const raw = await fs.readFile(snapshotPath(docId), 'utf8');
    return JSON.parse(raw) as Snapshot;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

export async function markCleanShutdown(docId: string): Promise<void> {
  await atomicWriteFile(cleanShutdownPath(docId), String(Date.now()));
}

export async function clearCleanShutdownMarker(docId: string): Promise<void> {
  await fs.rm(cleanShutdownPath(docId), { force: true });
}
