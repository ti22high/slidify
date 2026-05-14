import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  _resetBuffersForTests,
  appendOp,
  flushPending,
  readWal,
  truncateWal,
  WAL_DEBOUNCE_MS,
} from '../../src/main/persistence/wal';

let tmpHome: string;
let originalSlidifyHome: string | undefined;

beforeEach(async () => {
  tmpHome = await fs.mkdtemp(join(tmpdir(), 'slidify-wal-'));
  originalSlidifyHome = process.env['SLIDIFY_HOME'];
  process.env['SLIDIFY_HOME'] = tmpHome;
  _resetBuffersForTests();
});

afterEach(async () => {
  _resetBuffersForTests();
  if (originalSlidifyHome === undefined) delete process.env['SLIDIFY_HOME'];
  else process.env['SLIDIFY_HOME'] = originalSlidifyHome;
  await fs.rm(tmpHome, { recursive: true, force: true });
});

describe('wal', () => {
  it('flushes pending writes through flushPending', async () => {
    const docId = 'doc-flush';
    void appendOp(docId, { ts: 1, action: { type: 'shape/add' } });
    void appendOp(docId, { ts: 2, action: { type: 'shape/delete' } });
    await flushPending(docId);
    const ops = (await readWal(docId)) as { ts: number }[];
    expect(ops.map((o) => o.ts)).toEqual([1, 2]);
  });

  it('eventually flushes after the debounce window elapses', async () => {
    const docId = 'doc-debounce';
    const done = appendOp(docId, { ts: 1, action: 'a' });
    expect(await readWal(docId)).toEqual([]);
    await done;
    expect(await readWal(docId)).toHaveLength(1);
  });

  it('appends across separate flushes (no truncation)', async () => {
    const docId = 'doc-append';
    void appendOp(docId, { ts: 1, action: 'a' });
    await flushPending(docId);
    void appendOp(docId, { ts: 2, action: 'b' });
    await flushPending(docId);
    const ops = (await readWal(docId)) as { ts: number }[];
    expect(ops.map((o) => o.ts)).toEqual([1, 2]);
  });

  it('truncateWal removes the file', async () => {
    const docId = 'doc-trunc';
    void appendOp(docId, { ts: 1, action: 'a' });
    await flushPending(docId);
    await truncateWal(docId);
    expect(await readWal(docId)).toEqual([]);
  });

  it('readWal returns [] when no WAL exists', async () => {
    expect(await readWal('ghost-doc')).toEqual([]);
  });

  it('debounce window is the documented 200 ms', () => {
    expect(WAL_DEBOUNCE_MS).toBe(200);
  });
});
