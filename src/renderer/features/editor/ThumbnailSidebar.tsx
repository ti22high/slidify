import { useState } from 'react';
import { SLIDE_HEIGHT_EMU, SLIDE_WIDTH_EMU } from '../../../shared/emu';
import { useT } from '../../i18n';
import type { Slide } from '../../model/slide';
import { useThumbnail } from '../thumbnails/useThumbnail';
import { useEditorStore } from '../../store/editorStore';
import { Shape } from '../canvas/Shape';

interface ThumbProps {
  slide: Slide;
  index: number;
  selected: boolean;
  draggingIndex: number | null;
  setDraggingIndex: (i: number | null) => void;
}

function Thumb({
  slide,
  index,
  selected,
  draggingIndex,
  setDraggingIndex,
}: ThumbProps): JSX.Element {
  const layouts = useEditorStore((s) => s.layouts);
  const masters = useEditorStore((s) => s.masters);
  const dispatch = useEditorStore((s) => s.dispatch);
  const url = useThumbnail(slide, layouts, masters);
  const isOver = draggingIndex !== null && draggingIndex !== index;

  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
        setDraggingIndex(index);
      }}
      onDragOver={(e) => {
        if (draggingIndex === null || draggingIndex === index) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
        const fromIndex = Number(e.dataTransfer.getData('text/plain'));
        if (!Number.isFinite(fromIndex) || fromIndex === index) return;
        dispatch({ type: 'slide/reorder', fromIndex, toIndex: index });
        setDraggingIndex(null);
      }}
      onDragEnd={() => setDraggingIndex(null)}
    >
      <button
        type="button"
        onClick={() => dispatch({ type: 'slide/select', slideId: slide.id })}
        aria-current={selected ? 'true' : undefined}
        className={`flex w-full items-stretch gap-2 rounded border px-2 py-2 text-left text-xs transition ${
          selected
            ? 'border-sky-500 bg-slate-800/80 text-slate-100'
            : 'border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800/40'
        } ${isOver ? 'border-dashed border-sky-400' : ''}`}
      >
        <span className="w-5 shrink-0 self-center text-right tabular-nums text-slate-500">
          {index + 1}
        </span>
        <span className="flex-1">
          {url ? (
            <img
              src={url}
              alt={slide.name ?? `Slide ${index + 1}`}
              className="block aspect-[16/9] w-full rounded-sm bg-white shadow-sm ring-1 ring-slate-700"
            />
          ) : (
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
          )}
        </span>
      </button>
    </li>
  );
}

export function ThumbnailSidebar(): JSX.Element {
  const t = useT();
  const slides = useEditorStore((s) => s.slides);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const dispatch = useEditorStore((s) => s.dispatch);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  return (
    <aside
      aria-label="Slides"
      className="flex h-full w-[220px] flex-col border-r border-slate-800 bg-slate-900/60"
    >
      <header className="flex items-center justify-between gap-1 border-b border-slate-800 px-2 py-1.5">
        <span className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {t('sidebar.slides')}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={t('sidebar.add')}
            title={t('sidebar.add')}
            onClick={() => dispatch({ type: 'slide/add', afterSlideId: selectedSlideId })}
            className="rounded border border-slate-700 bg-slate-800/60 px-1.5 py-0.5 text-xs text-slate-200 hover:bg-slate-800"
          >
            +
          </button>
          <button
            type="button"
            aria-label={t('sidebar.duplicate')}
            title={t('sidebar.duplicate')}
            onClick={() => dispatch({ type: 'slide/duplicate', slideId: selectedSlideId })}
            className="rounded border border-slate-700 bg-slate-800/60 px-1.5 py-0.5 text-xs text-slate-200 hover:bg-slate-800"
          >
            ⎘
          </button>
          <button
            type="button"
            aria-label={t('sidebar.delete')}
            title={t('sidebar.delete')}
            disabled={slides.length <= 1}
            onClick={() => dispatch({ type: 'slide/delete', slideId: selectedSlideId })}
            className="rounded border border-slate-700 bg-slate-800/60 px-1.5 py-0.5 text-xs text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ✕
          </button>
        </div>
      </header>
      <ul className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {slides.map((slide, idx) => (
          <Thumb
            key={slide.id}
            slide={slide}
            index={idx}
            selected={slide.id === selectedSlideId}
            draggingIndex={draggingIndex}
            setDraggingIndex={setDraggingIndex}
          />
        ))}
      </ul>
    </aside>
  );
}
