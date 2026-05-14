import { promises as fs } from 'node:fs';
import { cleanShutdownPath, sessionDir, sessionsRoot, walPath } from './sessionPaths';
import { readSnapshot } from './snapshot';
import { readWal } from './wal';

export interface RecoverableSession {
  docId: string;
  /** ms since epoch when the WAL was last modified. */
  walMtime: number;
  /** Number of ops in the WAL. */
  ops: number;
}

export interface RecoveredSession {
  docId: string;
  snapshotState: unknown | null;
  ops: unknown[];
}

async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

/** Scan the sessions root and return any session that has a WAL but no clean-shutdown marker. */
export async function scanRecoverableSessions(): Promise<RecoverableSession[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(sessionsRoot());
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }

  const out: RecoverableSession[] = [];
  for (const docId of entries) {
    const dir = sessionDir(docId);
    const stat = await fs.stat(dir).catch(() => null);
    if (!stat?.isDirectory()) continue;
    const wal = walPath(docId);
    if (!(await exists(wal))) continue;
    if (await exists(cleanShutdownPath(docId))) continue;
    const wstat = await fs.stat(wal);
    const ops = (await readWal(docId)).length;
    if (ops === 0) continue;
    out.push({ docId, walMtime: wstat.mtimeMs, ops });
  }
  return out;
}

export async function loadSession(docId: string): Promise<RecoveredSession> {
  const snap = await readSnapshot(docId);
  const ops = await readWal(docId);
  return { docId, snapshotState: snap?.state ?? null, ops };
}

/** Discard a recovered session: remove the directory entirely. */
export async function discardSession(docId: string): Promise<void> {
  await fs.rm(sessionDir(docId), { recursive: true, force: true });
}
