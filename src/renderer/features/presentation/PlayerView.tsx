import { useEffect, useMemo, useRef, useState } from 'react';
import { SLIDE_HEIGHT_EMU, SLIDE_WIDTH_EMU } from '../../../shared/emu';
import { Shape } from '../canvas/Shape';
import { resolveSlide } from '../slides/cascade';
import { Table } from '../table/Table';
import { useEditorStore } from '../../store/editorStore';
import { runSequence, type AnimationStep } from './AnimationEngine';
import { formatTimer, keyToIntent } from './playerTimer';

interface Props {
  /** Called when the user presses Esc to exit. */
  onExit: () => void;
  /** Render the presenter overlay (notes + timer + next slide). */
  presenter?: boolean;
}

export function PlayerView({ onExit, presenter = false }: Props): JSX.Element {
  const slides = useEditorStore((s) => s.slides);
  const layouts = useEditorStore((s) => s.layouts);
  const masters = useEditorStore((s) => s.masters);
  const [index, setIndex] = useState(0);
  const [startedAt] = useState<number>(() => Date.now());
  const [now, setNow] = useState<number>(() => Date.now());
  const svgRef = useRef<SVGSVGElement | null>(null);
  const animRef = useRef<{ advance: () => void; stop: () => void } | null>(null);
  const onClickRemainingRef = useRef<number>(0);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Build & start the animation sequence whenever the slide changes.
  const slide = slides[index];
  useEffect(() => {
    animRef.current?.stop();
    animRef.current = null;
    onClickRemainingRef.current = 0;
    if (!slide) return;
    const steps: AnimationStep[] = [];
    for (const sh of slide.shapes) {
      for (const a of sh.animations ?? []) {
        steps.push({
          shapeId: sh.id,
          preset: a.preset as AnimationStep['preset'],
          trigger: a.trigger,
          ...(a.durationMs ? { options: { durationMs: a.durationMs } } : {}),
        });
      }
    }
    if (steps.length === 0) return;
    // Count onClick triggers after the first step — those are the ones that
    // gate on a key press from the user.
    onClickRemainingRef.current = steps.filter((s, i) => i > 0 && s.trigger === 'onClick').length;
    const resolver = (id: string) =>
      svgRef.current?.querySelector(`[data-shape-id="${id}"]`) ?? null;
    animRef.current = runSequence(steps, resolver);
    return () => {
      animRef.current?.stop();
      animRef.current = null;
    };
  }, [slide]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const intent = keyToIntent(e);
      if (!intent) return;
      e.preventDefault();
      if (intent === 'exit') {
        animRef.current?.stop();
        onExit();
        return;
      }
      if (intent === 'first') {
        setIndex(0);
        return;
      }
      if (intent === 'next') {
        if (onClickRemainingRef.current > 0) {
          onClickRemainingRef.current -= 1;
          animRef.current?.advance();
          return;
        }
        setIndex((i) => Math.min(slides.length - 1, i + 1));
        return;
      }
      if (intent === 'prev') {
        setIndex((i) => Math.max(0, i - 1));
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit, slides.length]);

  const next = slides[index + 1];
  const resolved = useMemo(
    () => (slide ? resolveSlide(slide, layouts, masters) : null),
    [slide, layouts, masters],
  );

  if (!slide) return <div className="h-full w-full bg-black" />;

  const elapsed = now - startedAt;

  return (
    <div className="flex h-screen w-screen flex-col bg-black text-white">
      <div className="flex flex-1 items-center justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SLIDE_WIDTH_EMU} ${SLIDE_HEIGHT_EMU}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-full max-h-full w-full max-w-full"
        >
          <rect
            width={SLIDE_WIDTH_EMU}
            height={SLIDE_HEIGHT_EMU}
            fill={resolved?.background ?? '#ffffff'}
          />
          {slide.shapes.map((sh) =>
            sh.kind === 'table' ? (
              <g key={sh.id} data-shape-id={sh.id}>
                <Table shape={sh} slideId={slide.id} editable={false} />
              </g>
            ) : (
              <Shape key={sh.id} shape={sh} selected={false} editing={false} />
            ),
          )}
        </svg>
      </div>
      {presenter ? (
        <div className="flex items-end justify-between gap-4 border-t border-slate-800 bg-slate-950/80 p-4 text-sm">
          <div className="flex-1">
            <div className="mb-1 text-xs uppercase tracking-wider text-slate-400">Заметки</div>
            <div className="max-h-32 overflow-y-auto whitespace-pre-wrap text-slate-200">
              {slide.notes ?? <span className="text-slate-500">Заметок нет.</span>}
            </div>
          </div>
          {next ? (
            <div className="flex-shrink-0">
              <div className="mb-1 text-right text-xs uppercase tracking-wider text-slate-400">
                Далее
              </div>
              <svg
                viewBox={`0 0 ${SLIDE_WIDTH_EMU} ${SLIDE_HEIGHT_EMU}`}
                preserveAspectRatio="xMidYMid meet"
                className="h-24 w-40 rounded bg-white shadow"
              >
                <rect width={SLIDE_WIDTH_EMU} height={SLIDE_HEIGHT_EMU} fill="#ffffff" />
                {next.shapes.map((sh) =>
                  sh.kind === 'table' ? null : (
                    <Shape key={sh.id} shape={sh} selected={false} editing={false} />
                  ),
                )}
              </svg>
            </div>
          ) : null}
          <div className="flex-shrink-0 text-right">
            <div className="text-xs uppercase tracking-wider text-slate-400">Время</div>
            <div className="font-mono text-2xl tabular-nums">{formatTimer(elapsed)}</div>
            <div className="text-xs text-slate-500">
              Слайд {index + 1} / {slides.length}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
