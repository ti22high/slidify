import { EMU_PER_INCH } from '../../../shared/emu';
import { useEditorStore } from '../../store/editorStore';

const emuToIn = (v: number): string => (v / EMU_PER_INCH).toFixed(2);

export function Inspector(): JSX.Element {
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
        Inspector
      </header>
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {!shape ? (
          <p className="text-slate-500">
            {selectedShapeIds.length > 1
              ? `${selectedShapeIds.length} shapes selected.`
              : 'Select something on the slide to edit its properties.'}
          </p>
        ) : (
          <div className="flex flex-col gap-3 text-slate-300">
            <div>
              <div className="mb-1 text-slate-500">Type</div>
              <div className="capitalize text-slate-100">{shape.kind}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-0.5">
                <span className="text-slate-500">X (in)</span>
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
                <span className="text-slate-500">Y (in)</span>
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
                <span className="text-slate-500">W (in)</span>
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
                <span className="text-slate-500">H (in)</span>
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
                <span className="text-slate-500">Rotation (°)</span>
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
                <span className="text-slate-500">Fill</span>
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
                <span className="text-slate-500">Stroke</span>
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
              Delete shape
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
