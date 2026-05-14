import { describe, expect, it } from 'vitest';
import {
  summarizeColumn,
  summarizeDataset,
  type Dataset,
} from '../../src/renderer/store/dataStore';

describe('summarizeColumn', () => {
  it('detects numeric columns and computes sum/avg/min/max', () => {
    const rows = [
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
    ];
    const s = summarizeColumn(rows, 0, 'n');
    expect(s.numeric).toBe(true);
    expect(s.count).toBe(3);
    expect(s.sum).toBe(6);
    expect(s.avg).toBe(2);
    expect(s.min).toBe(1);
    expect(s.max).toBe(3);
  });

  it('parses numeric strings as numbers', () => {
    const rows = [['1.5'], ['2.5']];
    const s = summarizeColumn(rows, 0, 'price');
    expect(s.numeric).toBe(true);
    expect(s.sum).toBeCloseTo(4);
    expect(s.avg).toBeCloseTo(2);
  });

  it('marks a column non-numeric when most cells are strings', () => {
    const rows = [['foo'], ['bar'], [1]];
    const s = summarizeColumn(rows, 0, 'name');
    expect(s.numeric).toBe(false);
    expect(s.count).toBe(3);
  });

  it('ignores empty cells in the count', () => {
    const rows = [[1], [null], [''], [3]];
    const s = summarizeColumn(rows, 0, 'n');
    expect(s.count).toBe(2);
    expect(s.numeric).toBe(true);
    expect(s.sum).toBe(4);
  });

  it('handles an entirely empty column without throwing', () => {
    const rows = [[null], [''], [null]];
    const s = summarizeColumn(rows, 0, 'empty');
    expect(s.numeric).toBe(false);
    expect(s.count).toBe(0);
  });
});

describe('summarizeDataset', () => {
  it('summarises each column', () => {
    const ds: Dataset = {
      id: 'ds1',
      dataRef: 'data/d.xlsx',
      sheetName: 'Sheet1',
      headers: ['Region', 'Revenue'],
      rows: [
        ['EU', 100],
        ['US', 200],
        ['APAC', 150],
      ],
    };
    const s = summarizeDataset(ds);
    expect(s.map((c) => c.numeric)).toEqual([false, true]);
    expect(s[1]!.sum).toBe(450);
    expect(s[1]!.avg).toBe(150);
  });
});
