import { SLIDE_HEIGHT_EMU, SLIDE_WIDTH_EMU } from '../../../shared/emu';
import { Shape } from '../canvas/Shape';
import { useEditorStore } from '../../store/editorStore';

export function ThumbnailSidebar(): JSX.Element {
  const slides = useEditorStore((s) => s.slides);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const dispatch = useEditorStore((s) => s.dispatch);

  return (
    <aside
      aria-label="Slides"
      className="flex h-full w-[220px] flex-col gap-2 overflow-y-auto border-r border-slate-800 bg-slate-900/60 p-3"
    >
      {slides.map((slide, idx) => {
        const selected = slide.id === selectedSlideId;
        return (
          <button
            key={slide.id}
            type="button"
            onClick={() => dispatch({ type: 'slide/select', slideId: slide.id })}
            aria-current={selected ? 'true' : undefined}
            className={`flex items-stretch gap-2 rounded border px-2 py-2 text-left text-xs transition ${
              selected
                ? 'border-sky-500 bg-slate-800/80 text-slate-100'
                : 'border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800/40'
            }`}
          >
            <span className="w-5 shrink-0 self-center text-right tabular-nums text-slate-500">
              {idx + 1}
            </span>
            <span className="flex-1">
              <svg
                viewBox={`0 0 ${SLIDE_WIDTH_EMU} ${SLIDE_HEIGHT_EMU}`}
                preserveAspectRatio="xMidYMid meet"
                className="block aspect-[16/9] w-full rounded-sm bg-white shadow-sm ring-1 ring-slate-700"
              >
                <rect width={SLIDE_WIDTH_EMU} height={SLIDE_HEIGHT_EMU} fill="#ffffff" />
                {slide.shapes.map((shape) => (
                  <Shape key={shape.id} shape={shape} selected={false} editing={false} />
                ))}
              </svg>
            </span>
          </button>
        );
      })}
    </aside>
  );
}
