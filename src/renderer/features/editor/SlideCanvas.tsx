import { useEffect, useMemo, useRef, useState } from 'react';
import { SLIDE_HEIGHT_EMU, SLIDE_WIDTH_EMU } from '../../../shared/emu';
import { Marquee } from '../canvas/Marquee';
import { Shape } from '../canvas/Shape';
import { SelectionHandles } from '../canvas/SelectionHandles';
import { shapesInMarquee, type Rect } from '../canvas/geometry';
import { resolveSlide } from '../slides/cascade';
import { registerBundledFonts } from '../text/fontLoader';
import { TextFrame } from '../text/TextFrame';
import { TextToolbar } from '../text/TextToolbar';
import { useEditorStore } from '../../store/editorStore';

const BASE_WIDTH_PX = 960;
const ASPECT = SLIDE_HEIGHT_EMU / SLIDE_WIDTH_EMU;

export function SlideCanvas(): JSX.Element {
  const slides = useEditorStore((s) => s.slides);
  const layouts = useEditorStore((s) => s.layouts);
  const masters = useEditorStore((s) => s.masters);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const selectedShapeIds = useEditorStore((s) => s.selectedShapeIds);
  const editingShapeId = useEditorStore((s) => s.editingShapeId);
  const zoom = useEditorStore((s) => s.zoom);
  const dispatch = useEditorStore((s) => s.dispatch);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [marquee, setMarquee] = useState<Rect | null>(null);

  useEffect(() => {
    void registerBundledFonts();
  }, []);

  const slide = slides.find((s) => s.id === selectedSlideId);
  const resolved = useMemo(
    () => (slide ? resolveSlide(slide, layouts, masters) : null),
    [slide, layouts, masters],
  );
  const widthPx = BASE_WIDTH_PX * zoom;
  const heightPx = widthPx * ASPECT;
  const emuPerPixel = SLIDE_WIDTH_EMU / widthPx;

  const selectedSet = useMemo(() => new Set(selectedShapeIds), [selectedShapeIds]);
  const selectedShapes = useMemo(
    () => slide?.shapes.filter((s) => selectedSet.has(s.id)) ?? [],
    [slide, selectedSet],
  );

  const toSvgPoint = (clientX: number, clientY: number): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return pt.matrixTransform(ctm.inverse());
  };

  const onCanvasPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.target !== e.currentTarget) return;
    const start = toSvgPoint(e.clientX, e.clientY);
    if (!e.shiftKey) dispatch({ type: 'selection/clear' });

    const move = (ev: PointerEvent) => {
      const cur = toSvgPoint(ev.clientX, ev.clientY);
      const x = Math.min(start.x, cur.x);
      const y = Math.min(start.y, cur.y);
      const w = Math.abs(cur.x - start.x);
      const h = Math.abs(cur.y - start.y);
      setMarquee({ x, y, w, h });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setMarquee((m) => {
        if (m && slide) {
          const ids = shapesInMarquee(slide.shapes, m);
          if (ids.length) dispatch({ type: 'selection/set', shapeIds: ids });
        }
        return null;
      });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const beginDragShape = (shapeId: string) => (e: React.PointerEvent<SVGGElement>) => {
    if (editingShapeId === shapeId) return;
    e.stopPropagation();
    if (e.shiftKey) {
      dispatch({ type: 'selection/toggle', shapeId });
    } else if (!selectedSet.has(shapeId)) {
      dispatch({ type: 'selection/set', shapeIds: [shapeId] });
    }
    const startSvg = toSvgPoint(e.clientX, e.clientY);
    const startPositions = (slide?.shapes ?? [])
      .filter((s) => selectedSet.has(s.id) || s.id === shapeId)
      .map((s) => ({ id: s.id, x: s.x, y: s.y }));

    const move = (ev: PointerEvent) => {
      const cur = toSvgPoint(ev.clientX, ev.clientY);
      const dx = cur.x - startSvg.x;
      const dy = cur.y - startSvg.y;
      for (const p of startPositions) {
        dispatch({
          type: 'shape/update',
          slideId: selectedSlideId,
          shapeId: p.id,
          patch: { x: p.x + dx, y: p.y + dy },
        });
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const onShapeDoubleClick = (shapeId: string) => (e: React.MouseEvent<SVGGElement>) => {
    e.stopPropagation();
    dispatch({ type: 'text/edit/start', shapeId });
  };

  const editingShape =
    editingShapeId && slide ? slide.shapes.find((s) => s.id === editingShapeId) ?? null : null;

  const toolbarShape =
    selectedShapes.length === 1 && selectedShapes[0]?.text ? selectedShapes[0] : null;

  const toolbarPos = useMemo(() => {
    if (!toolbarShape || !svgRef.current) return null;
    const svg = svgRef.current;
    const ctm = svg.getScreenCTM();
    const containerRect = svg.parentElement?.getBoundingClientRect();
    if (!ctm || !containerRect) return null;
    const pt = svg.createSVGPoint();
    pt.x = toolbarShape.x + toolbarShape.w / 2;
    pt.y = toolbarShape.y;
    const screen = pt.matrixTransform(ctm);
    return {
      left: screen.x - containerRect.left,
      top: screen.y - containerRect.top - 8,
    };
  }, [toolbarShape, zoom, slide]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!slide) {
    return <section aria-label="Slide canvas" className="h-full w-full bg-slate-950" />;
  }

  return (
    <section
      aria-label="Slide canvas"
      className="relative flex h-full w-full items-center justify-center overflow-auto bg-slate-950 p-8"
    >
      <div className="relative" style={{ width: widthPx, height: heightPx }}>
        <svg
          ref={svgRef}
          role="img"
          aria-label={slide.name ?? 'Slide'}
          viewBox={`0 0 ${SLIDE_WIDTH_EMU} ${SLIDE_HEIGHT_EMU}`}
          width={widthPx}
          height={heightPx}
          preserveAspectRatio="xMidYMid meet"
          className="bg-white shadow-2xl ring-1 ring-slate-700"
          onPointerDown={onCanvasPointerDown}
        >
          <rect
            width={SLIDE_WIDTH_EMU}
            height={SLIDE_HEIGHT_EMU}
            fill={resolved?.background ?? '#ffffff'}
          />
          {/* Layout-level placeholder shapes (non-interactive in the editor). */}
          {(resolved?.shapes.slice(0, resolved.shapes.length - slide.shapes.length) ?? []).map(
            (shape) => (
              <Shape key={`layout-${shape.id}`} shape={shape} selected={false} editing={false} />
            ),
          )}
          {slide.shapes.map((shape) => (
            <Shape
              key={shape.id}
              shape={shape}
              selected={selectedSet.has(shape.id)}
              editing={editingShapeId === shape.id}
              onPointerDown={beginDragShape(shape.id)}
              onDoubleClick={onShapeDoubleClick(shape.id)}
            />
          ))}
          {editingShape ? <TextFrame shape={editingShape} slideId={slide.id} /> : null}
          {selectedShapes.map((shape) =>
            editingShapeId === shape.id ? null : (
              <SelectionHandles
                key={`handles-${shape.id}`}
                shape={shape}
                slideId={slide.id}
                emuPerPixel={emuPerPixel}
              />
            ),
          )}
          <Marquee rect={marquee} />
        </svg>
        {toolbarShape && toolbarPos ? (
          <TextToolbar shape={toolbarShape} slideId={slide.id} position={toolbarPos} />
        ) : null}
      </div>
    </section>
  );
}
