import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Write `data` to `target` atomically: write to a sibling `.tmp` file,
 * fsync, then rename. On the same filesystem `rename` is atomic on POSIX
 * and NTFS, so a crash mid-write either leaves the old file intact or
 * the new file fully written — never a partial file at `target`.
 */
export async function atomicWriteFile(target: string, data: string | Uint8Array): Promise<void> {
  await fs.mkdir(dirname(target), { recursive: true });
  const tmp = `${target}.tmp-${process.pid}-${Date.now()}`;
  const fh = await fs.open(tmp, 'w');
  try {
    await fh.writeFile(data);
    await fh.sync();
  } finally {
    await fh.close();
  }
  try {
    await fs.rename(tmp, target);
  } catch (err) {
    // best-effort cleanup of the orphan tmp
    await fs.unlink(tmp).catch(() => undefined);
    throw err;
  }
}
