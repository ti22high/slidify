import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BATCH_SIZE, openWorkbook, readAllRows, streamRows } from '../../src/main/xlsx/xlsxReader';

const fixture = join(__dirname, '../fixtures/small.xlsx');

describe('xlsxReader', () => {
  it('exposes a 1000-row batch size (per SPRINTS.md contract)', () => {
    expect(BATCH_SIZE).toBe(1000);
  });

  it('openWorkbook reports sheet names + dimensions', async () => {
    const { meta } = await openWorkbook(fixture);
    expect(meta.sheetNames).toEqual(['Sales']);
    expect(meta.rowCount).toBe(6); // header + 5 rows
    expect(meta.columnCount).toBe(3);
  });

  it('readAllRows returns header + data rows in order', async () => {
    const rows = await readAllRows(fixture);
    expect(rows[0]).toEqual(['Region', 'Revenue', 'Units']);
    expect(rows).toHaveLength(6);
    expect(rows[1]).toEqual(['EU', 1200, 30]);
    expect(rows[5]).toEqual(['MEA', 700, 14]);
  });

  it('streamRows yields a single batch for tiny sheets', async () => {
    const batches = [];
    for await (const b of streamRows(fixture)) batches.push(b);
    expect(batches).toHaveLength(1);
    expect(batches[0]!.startRow).toBe(0);
    expect(batches[0]!.rows).toHaveLength(6);
  });
});
