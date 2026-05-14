import { SLIDE_HEIGHT_EMU, SLIDE_WIDTH_EMU } from '../../../shared/emu';
import { useEditorStore } from '../../store/editorStore';

const BASE_WIDTH_PX = 960;
const ASPECT = SLIDE_HEIGHT_EMU / SLIDE_WIDTH_EMU;

export function SlideCanvas(): JSX.Element {
  const slides = useEditorStore((s) => s.slides);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const zoom = useEditorStore((s) => s.zoom);

  const slide = slides.find((s) => s.id === selectedSlideId);

  const widthPx = BASE_WIDTH_PX * zoom;
  const heightPx = widthPx * ASPECT;

  return (
    <section
      aria-label="Slide canvas"
      className="flex h-full w-full items-center justify-center overflow-auto bg-slate-950 p-8"
    >
      {slide ? (
        <svg
          role="img"
          aria-label={slide.name ?? 'Slide'}
          viewBox={`0 0 ${SLIDE_WIDTH_EMU} ${SLIDE_HEIGHT_EMU}`}
          width={widthPx}
          height={heightPx}
          preserveAspectRatio="xMidYMid meet"
          className="bg-white shadow-2xl ring-1 ring-slate-700"
        >
          <rect width={SLIDE_WIDTH_EMU} height={SLIDE_HEIGHT_EMU} fill="#ffffff" />
        </svg>
      ) : null}
    </section>
  );
}
