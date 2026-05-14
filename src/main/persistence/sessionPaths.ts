import { homedir } from 'node:os';
import { join } from 'node:path';

const ROOT_DIRNAME = '.slidify';
const SESSIONS_DIRNAME = 'sessions';
export const WAL_FILENAME = 'wal.jsonl';
export const SNAPSHOT_FILENAME = 'snapshot.json';
export const CLEAN_SHUTDOWN_FILENAME = 'clean-shutdown';

/** Resolve the per-user Slidify root. Tests can override via SLIDIFY_HOME. */
export function sessionsRoot(): string {
  const override = process.env['SLIDIFY_HOME'];
  const base = override && override.length > 0 ? override : homedir();
  return join(base, ROOT_DIRNAME, SESSIONS_DIRNAME);
}

export function sessionDir(docId: string): string {
  return join(sessionsRoot(), docId);
}

export function walPath(docId: string): string {
  return join(sessionDir(docId), WAL_FILENAME);
}

export function snapshotPath(docId: string): string {
  return join(sessionDir(docId), SNAPSHOT_FILENAME);
}

export function cleanShutdownPath(docId: string): string {
  return join(sessionDir(docId), CLEAN_SHUTDOWN_FILENAME);
}
