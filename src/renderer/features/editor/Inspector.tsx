import { EMU_PER_INCH } from '../../../shared/emu';
import { useT } from '../../i18n';
import { useEditorStore } from '../../store/editorStore';

const emuToIn = (v: number): string => (v / EMU_PER_INCH).toFixed(2);

export function Inspector(): JSX.Element {
  const t = useT();
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const slides = useEditorStore((s) => s.slides);
  const selectedShapeIds = useEditorStore((s) => s.selectedShapeIds);
  const dispatch = useEditorStore((s) => s.dispatch);

  const slide = slides.find((s) => s.id === selectedSlideId);
  const shape =
    selectedShapeIds.length === 1
      ? slide?.shapes.find((s) => s.id === selectedShapeIds[0])
      : undefined;

  return (
    <aside
      aria-label="Inspector"
      className="flex h-full w-[280px] flex-col border-l border-slate-800 bg-slate-900/60"
    >
      <header className="h-9 border-b border-slate-800 px-3 text-xs font-semibold uppercase tracking-wider leading-9 text-slate-400">
        {t('inspector.title')}
      </header>
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {!shape ? (
          <div className="flex flex-col gap-3">
            <p className="text-slate-500">
              {selectedShapeIds.length > 1
                ? t('inspector.multi', { count: selectedShapeIds.length })
                : t('inspector.empty')}
            </p>
            <div>
              <div className="mb-1 text-slate-500">{t('inspector.notes')}</div>
              <textarea
                value={slide?.notes ?? ''}
                placeholder={t('inspector.notesPlaceholder')}
                onChange={(e) => {
                  if (!slide) return;
                  useEditorStore.setState((s) => ({
                    slides: s.slides.map((sl) =>
                      sl.id === slide.id ? { ...sl, notes: e.target.value } : sl,
                    ),
                  }));
                }}
                className="min-h-24 w-full resize-y rounded bg-slate-800 px-2 py-1.5 text-slate-100"
              />
            </div>
            <label className="flex flex-col gap-0.5">
              <span className="text-slate-500">{t('inspector.slideTransition')}</span>
              <select
                value={slide?.transition ?? 'none'}
                onChange={(e) => {
                  if (!slide) return;
                  useEditorStore.setState((s) => ({
                    slides: s.slides.map((sl) =>
                      sl.id === slide.id
                        ? {
                            ...sl,
                            transition: e.target.value as NonNullable<typeof sl.transition>,
                          }
                        : sl,
                    ),
                  }));
                }}
                className="rounded bg-slate-800 px-1.5 py-1 text-slate-100"
              >
                <option value="none">—</option>
                <option value="fade">fade</option>
                <option value="push">push</option>
                <option value="wipe">wipe</option>
                <option value="split">split</option>
              </select>
            </label>
          </div>
        ) : (
          <div className="flex flex-col gap-3 text-slate-300">
            <div>
              <div className="mb-1 text-slate-500">{t('inspector.type')}</div>
              <div className="capitalize text-slate-100">{shape.kind}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-0.5">
                <span className="text-slate-500">{t('inspector.xIn')}</span>
                <input
                  type="number"
                  step="0.1"
                  value={emuToIn(shape.x)}
                  onChange={(e) =>
                    dispatch({
                      type: 'shape/update',
                      slideId: selectedSlideId,
                      shapeId: shape.id,
                      patch: { x: Number(e.target.value) * EMU_PER_INCH },
                    })
                  }
                  className="rounded bg-slate-800 px-1.5 py-1 text-slate-100"
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-slate-500">{t('inspector.yIn')}</span>
                <input
                  type="number"
                  step="0.1"
                  value={emuToIn(shape.y)}
                  onChange={(e) =>
                    dispatch({
                      type: 'shape/update',
                      slideId: selectedSlideId,
                      shapeId: shape.id,
                      patch: { y: Number(e.target.value) * EMU_PER_INCH },
                    })
                  }
                  className="rounded bg-slate-800 px-1.5 py-1 text-slate-100"
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-slate-500">{t('inspector.wIn')}</span>
                <input
                  type="number"
                  step="0.1"
                  value={emuToIn(shape.w)}
                  onChange={(e) =>
                    dispatch({
                      type: 'shape/update',
                      slideId: selectedSlideId,
                      shapeId: shape.id,
                      patch: { w: Number(e.target.value) * EMU_PER_INCH },
                    })
                  }
                  className="rounded bg-slate-800 px-1.5 py-1 text-slate-100"
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-slate-500">{t('inspector.hIn')}</span>
                <input
                  type="number"
                  step="0.1"
                  value={emuToIn(shape.h)}
                  onChange={(e) =>
                    dispatch({
                      type: 'shape/update',
                      slideId: selectedSlideId,
                      shapeId: shape.id,
                      patch: { h: Number(e.target.value) * EMU_PER_INCH },
                    })
                  }
                  className="rounded bg-slate-800 px-1.5 py-1 text-slate-100"
                />
              </label>
              <label className="col-span-2 flex flex-col gap-0.5">
                <span className="text-slate-500">{t('inspector.rotation')}</span>
                <input
                  type="number"
                  value={shape.rotation}
                  onChange={(e) =>
                    dispatch({
                      type: 'shape/update',
                      slideId: selectedSlideId,
                      shapeId: shape.id,
                      patch: { rotation: Number(e.target.value) },
                    })
                  }
                  className="rounded bg-slate-800 px-1.5 py-1 text-slate-100"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-0.5">
                <span className="text-slate-500">{t('inspector.fill')}</span>
                <input
                  type="color"
                  value={shape.fill === 'none' ? '#ffffff' : shape.fill}
                  onChange={(e) =>
                    dispatch({
                      type: 'shape/update',
                      slideId: selectedSlideId,
                      shapeId: shape.id,
                      patch: { fill: e.target.value },
                    })
                  }
                  className="h-8 w-full cursor-pointer rounded bg-slate-800"
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-slate-500">{t('inspector.stroke')}</span>
                <input
                  type="color"
                  value={shape.stroke}
                  onChange={(e) =>
                    dispatch({
                      type: 'shape/update',
                      slideId: selectedSlideId,
                      shapeId: shape.id,
                      patch: { stroke: e.target.value },
                    })
                  }
                  className="h-8 w-full cursor-pointer rounded bg-slate-800"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-0.5">
                <span className="text-slate-500">{t('inspector.strokeWidth')}</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={(shape.strokeWidth / 12700).toFixed(1)}
                  onChange={(e) =>
                    dispatch({
                      type: 'shape/update',
                      slideId: selectedSlideId,
                      shapeId: shape.id,
                      patch: { strokeWidth: Math.max(0, Number(e.target.value)) * 12700 },
                    })
                  }
                  className="rounded bg-slate-800 px-1.5 py-1 text-slate-100"
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-slate-500">{t('inspector.opacity')}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={Math.round((shape.opacity ?? 1) * 100)}
                  onChange={(e) =>
                    dispatch({
                      type: 'shape/update',
                      slideId: selectedSlideId,
                      shapeId: shape.id,
                      patch: { opacity: Number(e.target.value) / 100 },
                    })
                  }
                  className="h-7 cursor-pointer"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: 'shape/delete',
                  slideId: selectedSlideId,
                  shapeIds: [shape.id],
                })
              }
              className="mt-2 rounded border border-rose-700 bg-rose-900/40 px-2 py-1 text-rose-200 hover:bg-rose-900/60"
            >
              {t('inspector.delete')}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
