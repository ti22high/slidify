export type ChartKind = 'bar' | 'line' | 'pie';

export interface ChartSeries {
  /** Display name for the series. */
  name: string;
  /** Column index in the referenced dataset that holds the values. */
  valueColumn: number;
  /** Optional hex colour (without #). */
  color?: string;
}

export interface ChartPayload {
  kind: ChartKind;
  /** Dataset id from the renderer's data store. */
  datasetId: string;
  /** Column index for the category axis (x for bar/line, slice label for pie). */
  categoryColumn: number;
  series: ChartSeries[];
  title?: string;
}

export interface ChartPoint {
  /** Category label (x value / slice label). */
  category: string | number;
  /** One entry per series, keyed by series name. */
  values: Record<string, number>;
}

export function buildChartData(
  rows: readonly (string | number | boolean | null)[][],
  categoryColumn: number,
  series: readonly ChartSeries[],
): ChartPoint[] {
  return rows.map((row) => {
    const rawCategory = row[categoryColumn];
    const category = typeof rawCategory === 'number' ? rawCategory : String(rawCategory ?? '');
    const values: Record<string, number> = {};
    for (const s of series) {
      const raw = row[s.valueColumn];
      const n = typeof raw === 'number' ? raw : Number(raw);
      values[s.name] = Number.isFinite(n) ? n : 0;
    }
    return { category, values };
  });
}
