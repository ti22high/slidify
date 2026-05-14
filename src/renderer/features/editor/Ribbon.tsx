import { useRef, useState } from 'react';
import { importXlsxIntoSlide } from '../data/importXlsx';
import { insertImageFromFile } from '../media/ImageDrop';
import { makeShape, makeTableShape, useEditorStore } from '../../store/editorStore';

const TABS = ['Insert', 'Design', 'Animations', 'Present'] as const;
type Tab = (typeof TABS)[number];

const INSERT_BUTTONS = [
  { label: 'Rectangle', kind: 'rect' },
  { label: 'Ellipse', kind: 'ellipse' },
  { label: 'Line', kind: 'line' },
  { label: 'Arrow', kind: 'arrow' },
] as const;

export function Ribbon(): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('Insert');
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const dispatch = useEditorStore((s) => s.dispatch);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <nav
      aria-label="Editor toolbar"
      className="flex h-12 items-center gap-1 border-b border-slate-800 bg-slate-900/80 px-2"
    >
      <div className="px-3 text-sm font-semibold tracking-tight text-slate-200">Slidify</div>
      <div className="mx-2 h-6 w-px bg-slate-800" />
      <ul className="flex items-center gap-1">
        {TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <li key={tab}>
              <button
                type="button"
                onClick={() => setActiveTab(tab)}
                aria-pressed={active}
                className={`rounded px-3 py-1.5 text-sm ${
                  active
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                {tab}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mx-2 h-6 w-px bg-slate-800" />
      {activeTab === 'Insert' ? (
        <div className="flex items-center gap-1">
          {INSERT_BUTTONS.map((b) => (
            <button
              key={b.kind}
              type="button"
              onClick={() =>
                dispatch({ type: 'shape/add', slideId: selectedSlideId, shape: makeShape(b.kind) })
              }
              className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
            >
              + {b.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: 'shape/add',
                slideId: selectedSlideId,
                shape: makeTableShape(3, 3),
              })
            }
            className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
          >
            + Table
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
          >
            + Image…
          </button>
          <button
            type="button"
            onClick={() => void importXlsxIntoSlide(selectedSlideId)}
            className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
          >
            + XLSX…
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void insertImageFromFile(file, selectedSlideId);
              e.target.value = '';
            }}
          />
        </div>
      ) : (
        <span className="text-xs text-slate-500">{activeTab} — coming in a later sprint</span>
      )}
    </nav>
  );
}
