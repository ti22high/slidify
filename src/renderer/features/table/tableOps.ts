import type { TableCell, TablePayload } from '../../model/shape';

export const MAX_TABLE_DIM = 20;

export function makeEmptyTable(rows: number, cols: number): TablePayload {
  const r = Math.min(Math.max(1, rows), MAX_TABLE_DIM);
  const c = Math.min(Math.max(1, cols), MAX_TABLE_DIM);
  const cells: TableCell[][] = Array.from({ length: r }, () =>
    Array.from({ length: c }, () => ({ text: '' })),
  );
  return { rows: r, cols: c, cells };
}

export function addRow(table: TablePayload, atIndex?: number): TablePayload {
  if (table.rows >= MAX_TABLE_DIM) return table;
  const idx = atIndex ?? table.rows;
  const row: TableCell[] = Array.from({ length: table.cols }, () => ({ text: '' }));
  const cells = [...table.cells.slice(0, idx), row, ...table.cells.slice(idx)];
  return { rows: table.rows + 1, cols: table.cols, cells };
}

export function removeRow(table: TablePayload, atIndex: number): TablePayload {
  if (table.rows <= 1) return table;
  if (atIndex < 0 || atIndex >= table.rows) return table;
  const cells = [...table.cells.slice(0, atIndex), ...table.cells.slice(atIndex + 1)];
  return { rows: table.rows - 1, cols: table.cols, cells };
}

export function addColumn(table: TablePayload, atIndex?: number): TablePayload {
  if (table.cols >= MAX_TABLE_DIM) return table;
  const idx = atIndex ?? table.cols;
  const cells = table.cells.map((row) => [
    ...row.slice(0, idx),
    { text: '' } as TableCell,
    ...row.slice(idx),
  ]);
  return { rows: table.rows, cols: table.cols + 1, cells };
}

export function removeColumn(table: TablePayload, atIndex: number): TablePayload {
  if (table.cols <= 1) return table;
  if (atIndex < 0 || atIndex >= table.cols) return table;
  const cells = table.cells.map((row) => [...row.slice(0, atIndex), ...row.slice(atIndex + 1)]);
  return { rows: table.rows, cols: table.cols - 1, cells };
}

export function setCell(
  table: TablePayload,
  row: number,
  col: number,
  patch: Partial<TableCell>,
): TablePayload {
  if (row < 0 || row >= table.rows || col < 0 || col >= table.cols) return table;
  const cells = table.cells.map((r, ri) =>
    ri === row ? r.map((c, ci) => (ci === col ? { ...c, ...patch } : c)) : r,
  );
  return { rows: table.rows, cols: table.cols, cells };
}
