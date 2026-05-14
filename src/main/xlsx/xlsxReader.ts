// TODO(sprint-6-calamine): replace ExcelJS streaming with the napi-rs binding
// around the `calamine` Rust crate. The function signatures below describe the
// post-swap contract: stream() yields batches of 1000 rows. The current
// implementation uses ExcelJS to satisfy the same contract synchronously enough
// for typical decks; the 100k-row / 2s perf target is gated on the swap.

import ExcelJS from 'exceljs';

export const BATCH_SIZE = 1000;

export type CellValue = string | number | boolean | null;

export interface RowBatch {
  /** 0-based row offset of the first row in this batch within the sheet. */
  startRow: number;
  rows: CellValue[][];
}

export interface XlsxMeta {
  sheetNames: string[];
  rowCount: number;
  columnCount: number;
}

function toCellValue(v: ExcelJS.CellValue): CellValue {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    if ('result' in v && v.result !== undefined) {
      return toCellValue(v.result as ExcelJS.CellValue);
    }
    if ('richText' in v && Array.isArray(v.richText)) {
      return v.richText.map((r) => r.text).join('');
    }
    if ('text' in v && typeof v.text === 'string') return v.text;
    if ('hyperlink' in v && typeof v.text === 'string') return v.text;
  }
  return String(v);
}

export async function openWorkbook(filePath: string): Promise<{
  workbook: ExcelJS.Workbook;
  meta: XlsxMeta;
}> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheetNames = workbook.worksheets.map((ws) => ws.name);
  const first = workbook.worksheets[0];
  const rowCount = first?.rowCount ?? 0;
  const columnCount = first?.columnCount ?? 0;
  return { workbook, meta: { sheetNames, rowCount, columnCount } };
}

export async function* streamRows(
  filePath: string,
  sheetName?: string,
): AsyncGenerator<RowBatch, void, void> {
  const { workbook } = await openWorkbook(filePath);
  const sheet = sheetName ? workbook.getWorksheet(sheetName) : workbook.worksheets[0];
  if (!sheet) return;

  let batch: CellValue[][] = [];
  let startRow = 0;
  let rowIdx = 0;

  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values: CellValue[] = [];
    const arr = (row.values as ExcelJS.CellValue[]) ?? [];
    // ExcelJS row.values is 1-indexed; drop index 0
    for (let c = 1; c < arr.length; c += 1) {
      values.push(toCellValue(arr[c]));
    }
    batch.push(values);
    rowIdx += 1;
  });

  for (let i = 0; i < batch.length; i += BATCH_SIZE) {
    yield { startRow: startRow + i, rows: batch.slice(i, i + BATCH_SIZE) };
  }
  startRow += rowIdx;
  batch = [];
}

export async function readAllRows(filePath: string, sheetName?: string): Promise<CellValue[][]> {
  const out: CellValue[][] = [];
  for await (const batch of streamRows(filePath, sheetName)) {
    for (const r of batch.rows) out.push(r);
  }
  return out;
}
