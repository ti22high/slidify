import { create as createStore } from 'zustand';

export type CellValue = string | number | boolean | null;

export interface Dataset {
  id: string;
  /** Path inside the .slidify ZIP, e.g. `data/sales.xlsx`. */
  dataRef: string;
  sheetName: string;
  headers: string[];
  rows: CellValue[][];
}

export interface ColumnSummary {
  column: string;
  numeric: boolean;
  count: number;
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
}

interface DataStore {
  datasets: Record<string, Dataset>;
  upsertDataset: (ds: Dataset) => void;
  removeDataset: (id: string) => void;
}

export const useDataStore = createStore<DataStore>((set) => ({
  datasets: {},
  upsertDataset: (ds) => set((s) => ({ datasets: { ...s.datasets, [ds.id]: ds } })),
  removeDataset: (id) =>
    set((s) => {
      const { [id]: _drop, ...rest } = s.datasets;
      return { datasets: rest };
    }),
}));

const NUMERIC_THRESHOLD = 0.5;

function parseAsNumber(v: CellValue): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim().length > 0) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function summarizeColumn(
  rows: readonly CellValue[][],
  columnIndex: number,
  columnName: string,
): ColumnSummary {
  let count = 0;
  let numericCount = 0;
  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const row of rows) {
    const v = row[columnIndex];
    if (v === null || v === undefined || v === '') continue;
    count += 1;
    const n = parseAsNumber(v);
    if (n !== null) {
      numericCount += 1;
      sum += n;
      if (n < min) min = n;
      if (n > max) max = n;
    }
  }
  const numeric = count > 0 && numericCount / count >= NUMERIC_THRESHOLD;
  if (!numeric) {
    return { column: columnName, numeric: false, count };
  }
  return {
    column: columnName,
    numeric: true,
    count: numericCount,
    sum,
    avg: numericCount > 0 ? sum / numericCount : 0,
    min: numericCount > 0 ? min : 0,
    max: numericCount > 0 ? max : 0,
  };
}

export function summarizeDataset(ds: Dataset): ColumnSummary[] {
  return ds.headers.map((h, i) => summarizeColumn(ds.rows, i, h));
}
