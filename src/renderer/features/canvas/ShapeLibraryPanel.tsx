import { useT } from '../../i18n';
import { makePresetShape, useEditorStore } from '../../store/editorStore';
import { useUiStore } from '../../store/uiStore';
import { PRESET_GROUPS, presetPath, type PresetGeomName } from './shapePresets';

/**
 * Floating gallery of 30 preset shapes (mirrors PPTX prstGeom catalog).
 * Click a thumbnail → preset is inserted into the current slide.
 */
export function ShapeLibraryPanel(): JSX.Element | null {
  const t = useT();
  const open = useUiStore((s) => s.shapeLibraryOpen);
  const setOpen = useUiStore((s) => s.setShapeLibraryOpen);
  const dispatch = useEditorStore((s) => s.dispatch);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);

  if (!open) return null;

  const insert = (name: PresetGeomName) => {
    const shape = makePresetShape(name);
    dispatch({ type: 'shape/add', slideId: selectedSlideId, shape });
    setOpen(false);
  };

  return (
    <aside
      aria-label="Shape library"
      className="absolute left-1/2 top-24 z-30 w-[480px] -translate-x-1/2 rounded-md border border-slate-700 bg-slate-900/95 p-3 text-xs text-slate-200 shadow-xl"
    >
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">{t('shapeLibrary.title')}</h2>
        <button
          type="button"
          aria-label="close"
          onClick={() => setOpen(false)}
          className="rounded px-1.5 py-0.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        >
          ✕
        </button>
      </header>
      <div className="max-h-[60vh] overflow-y-auto">
        {PRESET_GROUPS.map((group) => (
          <section key={group.label} className="mb-3">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
              {group.label}
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {group.items.map((name) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => insert(name)}
                  className="flex aspect-square items-center justify-center rounded border border-slate-700 bg-slate-800/40 p-1 hover:border-sky-500 hover:bg-slate-800"
                >
                  <svg viewBox="0 0 50 50" width="100%" height="100%">
                    <path
                      d={presetPath(name, 50, 50)}
                      fill="#475569"
                      stroke="#cbd5e1"
                      strokeWidth={1.5}
                    />
                  </svg>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
