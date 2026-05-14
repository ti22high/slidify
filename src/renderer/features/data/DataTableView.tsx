import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Dataset } from '../../store/dataStore';

const ROW_HEIGHT = 24;

interface Props {
  dataset: Dataset;
  /** Container height in pixels — used by the virtualizer to compute the window. */
  height?: number;
}

/**
 * In-app virtualized table for arbitrary-sized datasets.
 *
 * TODO(sprint-6-calamine): once the napi-rs binding lands the underlying
 * `dataset.rows` array will be lazy/paged. For now we materialise the whole
 * sheet up-front; the virtualizer keeps the DOM bounded regardless.
 */
export function DataTableView({ dataset, height = 480 }: Props): JSX.Element {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: dataset.rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  return (
    <div className="flex h-full flex-col text-xs text-slate-200">
      <div className="sticky top-0 z-10 border-b border-slate-700 bg-slate-900">
        <div className="grid" style={gridTemplate(dataset.headers.length)}>
          {dataset.headers.map((h, i) => (
            <div key={i} className="truncate px-2 py-1 font-semibold">
              {h}
            </div>
          ))}
        </div>
      </div>
      <div ref={parentRef} className="flex-1 overflow-auto" style={{ height, contain: 'strict' }}>
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            position: 'relative',
            width: '100%',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = dataset.rows[virtualRow.index] ?? [];
            return (
              <div
                key={virtualRow.key}
                className="absolute left-0 right-0 grid border-b border-slate-800/60"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  height: ROW_HEIGHT,
                  ...gridTemplate(dataset.headers.length),
                }}
              >
                {dataset.headers.map((_, c) => (
                  <div key={c} className="truncate px-2 py-0.5">
                    {row[c] === null || row[c] === undefined ? '' : String(row[c])}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function gridTemplate(cols: number): { gridTemplateColumns: string } {
  return { gridTemplateColumns: `repeat(${cols}, minmax(120px, 1fr))` };
}
