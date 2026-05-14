import { describe, expect, it } from 'vitest';
import {
  addColumn,
  addRow,
  makeEmptyTable,
  MAX_TABLE_DIM,
  removeColumn,
  removeRow,
  setCell,
} from '../../src/renderer/features/table/tableOps';

describe('tableOps', () => {
  it('makeEmptyTable clamps to 1..MAX_TABLE_DIM', () => {
    expect(makeEmptyTable(0, 0).rows).toBe(1);
    expect(makeEmptyTable(0, 0).cols).toBe(1);
    expect(makeEmptyTable(100, 100).rows).toBe(MAX_TABLE_DIM);
    expect(makeEmptyTable(100, 100).cols).toBe(MAX_TABLE_DIM);
    const t = makeEmptyTable(3, 4);
    expect(t.cells).toHaveLength(3);
    expect(t.cells[0]).toHaveLength(4);
  });

  it('addRow appends to the bottom by default', () => {
    const t = addRow(makeEmptyTable(2, 3));
    expect(t.rows).toBe(3);
    expect(t.cells).toHaveLength(3);
    expect(t.cells[2]).toHaveLength(3);
  });

  it('addRow respects atIndex', () => {
    let t = setCell(makeEmptyTable(2, 2), 1, 0, { text: 'B' });
    t = addRow(t, 1);
    expect(t.rows).toBe(3);
    expect(t.cells[1]!.every((c) => c.text === '')).toBe(true);
    expect(t.cells[2]![0]!.text).toBe('B');
  });

  it('addRow caps at MAX_TABLE_DIM', () => {
    let t = makeEmptyTable(MAX_TABLE_DIM, 2);
    t = addRow(t);
    expect(t.rows).toBe(MAX_TABLE_DIM);
  });

  it('removeRow keeps at least one row', () => {
    const t = removeRow(makeEmptyTable(1, 1), 0);
    expect(t.rows).toBe(1);
  });

  it('removeRow drops the indicated row', () => {
    let t = setCell(makeEmptyTable(3, 2), 0, 0, { text: 'top' });
    t = setCell(t, 2, 0, { text: 'bot' });
    t = removeRow(t, 1);
    expect(t.rows).toBe(2);
    expect(t.cells[0]![0]!.text).toBe('top');
    expect(t.cells[1]![0]!.text).toBe('bot');
  });

  it('addColumn / removeColumn keep the matrix square', () => {
    const a = addColumn(makeEmptyTable(2, 2));
    expect(a.cols).toBe(3);
    a.cells.forEach((row) => expect(row).toHaveLength(3));
    const b = removeColumn(a, 0);
    expect(b.cols).toBe(2);
    b.cells.forEach((row) => expect(row).toHaveLength(2));
  });

  it('removeColumn keeps at least one column', () => {
    const t = removeColumn(makeEmptyTable(2, 1), 0);
    expect(t.cols).toBe(1);
  });

  it('setCell patches the targeted cell only', () => {
    const t = setCell(makeEmptyTable(2, 2), 1, 0, { text: 'x', align: 'center' });
    expect(t.cells[1]![0]!.text).toBe('x');
    expect(t.cells[1]![0]!.align).toBe('center');
    expect(t.cells[0]![0]!.text).toBe('');
  });

  it('setCell is a no-op for out-of-range coordinates', () => {
    const t = makeEmptyTable(2, 2);
    expect(setCell(t, 5, 5, { text: 'nope' })).toBe(t);
  });
});
