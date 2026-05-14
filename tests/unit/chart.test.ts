import { describe, expect, it } from 'vitest';
import { buildChartData } from '../../src/renderer/model/chart';

describe('buildChartData', () => {
  it('maps rows to category + series values', () => {
    const rows = [
      ['EU', 100, 30],
      ['US', 200, 55],
      ['APAC', 150, 42],
    ];
    const points = buildChartData(rows, 0, [
      { name: 'Revenue', valueColumn: 1 },
      { name: 'Units', valueColumn: 2 },
    ]);
    expect(points).toEqual([
      { category: 'EU', values: { Revenue: 100, Units: 30 } },
      { category: 'US', values: { Revenue: 200, Units: 55 } },
      { category: 'APAC', values: { Revenue: 150, Units: 42 } },
    ]);
  });

  it('coerces stringy numbers and defaults non-numeric to 0', () => {
    const rows = [
      ['Q1', '12.5', 'oops'],
      ['Q2', 7, ''],
    ];
    const points = buildChartData(rows, 0, [
      { name: 'sales', valueColumn: 1 },
      { name: 'returns', valueColumn: 2 },
    ]);
    expect(points[0]!.values.sales).toBeCloseTo(12.5);
    expect(points[0]!.values.returns).toBe(0);
    expect(points[1]!.values.sales).toBe(7);
    expect(points[1]!.values.returns).toBe(0);
  });

  it('handles empty rows', () => {
    expect(buildChartData([], 0, [{ name: 'x', valueColumn: 1 }])).toEqual([]);
  });
});
