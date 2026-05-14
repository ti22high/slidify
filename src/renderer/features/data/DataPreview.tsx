import { useMemo } from 'react';
import { summarizeDataset, useDataStore, type Dataset } from '../../store/dataStore';

interface Props {
  datasetId: string;
  rowLimit?: number;
}

export function DataPreview({ datasetId, rowLimit = 50 }: Props): JSX.Element | null {
  const dataset = useDataStore((s) => s.datasets[datasetId]);
  const summaries = useMemo(() => (dataset ? summarizeDataset(dataset) : []), [dataset]);
  if (!dataset) return <div className="p-3 text-xs text-slate-500">Dataset unavailable.</div>;
  const previewRows = dataset.rows.slice(0, rowLimit);

  return (
    <div className="flex h-full w-full flex-col text-xs text-slate-200">
      <div className="overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {dataset.headers.map((h) => (
                <th
                  key={h}
                  className="sticky top-0 border-b border-slate-700 bg-slate-900 px-2 py-1 text-left font-semibold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, r) => (
              <tr key={r} className="odd:bg-slate-900/40">
                {row.map((cell, c) => (
                  <td key={c} className="border-b border-slate-800/60 px-2 py-0.5">
                    {cell === null ? '' : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Summary summaries={summaries} />
    </div>
  );
}

function Summary({ summaries }: { summaries: ReturnType<typeof summarizeDataset> }): JSX.Element {
  const numeric = summaries.filter((s) => s.numeric);
  if (numeric.length === 0) {
    return (
      <div className="mt-2 border-t border-slate-800 px-2 py-1 text-slate-500">
        No numeric columns to summarise.
      </div>
    );
  }
  return (
    <div className="mt-2 border-t border-slate-800 px-2 py-1">
      <table className="w-full border-collapse text-slate-300">
        <thead>
          <tr>
            <th className="px-1 py-0.5 text-left font-semibold text-slate-500">Column</th>
            <th className="px-1 py-0.5 text-right font-semibold text-slate-500">Count</th>
            <th className="px-1 py-0.5 text-right font-semibold text-slate-500">Sum</th>
            <th className="px-1 py-0.5 text-right font-semibold text-slate-500">Avg</th>
          </tr>
        </thead>
        <tbody>
          {numeric.map((s) => (
            <tr key={s.column}>
              <td className="px-1 py-0.5">{s.column}</td>
              <td className="px-1 py-0.5 text-right tabular-nums">{s.count}</td>
              <td className="px-1 py-0.5 text-right tabular-nums">{s.sum?.toFixed(2)}</td>
              <td className="px-1 py-0.5 text-right tabular-nums">{s.avg?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Helper for tests / IPC import: turn raw rows into a Dataset. */
export function datasetFromRows(
  id: string,
  dataRef: string,
  sheetName: string,
  rawRows: readonly (string | number | boolean | null)[][],
): Dataset {
  const [headerRow, ...rest] = rawRows;
  const headers = (headerRow ?? []).map((h) => (h === null ? '' : String(h)));
  return { id, dataRef, sheetName, headers, rows: rest as Dataset['rows'] };
}
