import { useEffect, useMemo, useRef, useState } from 'react';
import { SLIDE_HEIGHT_EMU, SLIDE_WIDTH_EMU } from '../../../shared/emu';
import { Marquee } from '../canvas/Marquee';
import { Shape } from '../canvas/Shape';
import { SelectionHandles } from '../canvas/SelectionHandles';
import { shapesInMarquee, type Rect } from '../canvas/geometry';
import { openContextMenu } from './ContextMenu';
import { DataPreview } from '../data/DataPreview';
import { ImageDropOverlay } from '../media/ImageDrop';
import { resolveSlide } from '../slides/cascade';
import { Table } from '../table/Table';
import { registerBundledFonts } from '../text/fontLoader';
import { TextFrame } from '../text/TextFrame';
import { useEditorStore } from '../../store/editorStore';

const BASE_WIDTH_PX = 960;
/** Workspace padding around the slide so shapes can be dragged outside. */
const WORKSPACE_MARGIN_EMU = 1828800; // ≈ 2 inches each side
const WORKSPACE_WIDTH_EMU = SLIDE_WIDTH_EMU + WORKSPACE_MARGIN_EMU * 2;
const WORKSPACE_HEIGHT_EMU = SLIDE_HEIGHT_EMU + WORKSPACE_MARGIN_EMU * 2;
const WORKSPACE_ASPECT = WORKSPACE_HEIGHT_EMU / WORKSPACE_WIDTH_EMU;

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
  const slideWidthPx = BASE_WIDTH_PX * zoom;
  // Workspace area = slide + margin on each side so shapes can be dragged outside.
  const widthPx = slideWidthPx * (WORKSPACE_WIDTH_EMU / SLIDE_WIDTH_EMU);
  const heightPx = widthPx * WORKSPACE_ASPECT;
  const emuPerPixel = SLIDE_WIDTH_EMU / slideWidthPx;

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
    // Read the live state after the dispatch above so newly-toggled ids are in
    // the drag set.
    const liveSelected = new Set(useEditorStore.getState().selectedShapeIds);
    if (!liveSelected.has(shapeId)) liveSelected.add(shapeId);
    const startPositions = (slide?.shapes ?? [])
      .filter((s) => liveSelected.has(s.id))
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
  // Text frame overlay is only meaningful for shapes that have a flat text body
  // and are not tables (tables are edited in-place via Table.tsx).
  const editingTextShape =
    editingShape && editingShape.kind !== 'table' && editingShape.text ? editingShape : null;

  void zoom; // referenced so toolbar position re-evaluates if needed.

  if (!slide) {
    return <section aria-label="Slide canvas" className="h-full w-full bg-slate-300" />;
  }

  return (
    <section
      aria-label="Slide canvas"
      className="relative flex h-full w-full items-center justify-center overflow-auto bg-slate-300 p-8"
    >
      <ImageDropOverlay slideId={slide.id} />
      <div className="relative" style={{ width: widthPx, height: heightPx }}>
        <svg
          ref={svgRef}
          role="img"
          aria-label={slide.name ?? 'Slide'}
          viewBox={`${-WORKSPACE_MARGIN_EMU} ${-WORKSPACE_MARGIN_EMU} ${WORKSPACE_WIDTH_EMU} ${WORKSPACE_HEIGHT_EMU}`}
          width={widthPx}
          height={heightPx}
          preserveAspectRatio="xMidYMid meet"
          className="block"
          onPointerDown={onCanvasPointerDown}
          onContextMenu={(e) => {
            e.preventDefault();
            const target = (e.target as Element).closest('[data-shape-id]') as Element | null;
            const id = target?.getAttribute('data-shape-id') ?? null;
            if (id && !selectedSet.has(id)) {
              dispatch({ type: 'selection/set', shapeIds: [id] });
            }
            openContextMenu(e.clientX, e.clientY, id);
          }}
        >
          <defs>
            <filter id="slide-shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="50000" stdDeviation="40000" floodOpacity="0.25" />
            </filter>
          </defs>
          {/* Workspace background (light gray, fills the SVG viewport). */}
          <rect
            x={-WORKSPACE_MARGIN_EMU}
            y={-WORKSPACE_MARGIN_EMU}
            width={WORKSPACE_WIDTH_EMU}
            height={WORKSPACE_HEIGHT_EMU}
            fill="#cbd5e1"
          />
          {/* Slide rect (white, sits inside the workspace). */}
          <rect
            x={0}
            y={0}
            width={SLIDE_WIDTH_EMU}
            height={SLIDE_HEIGHT_EMU}
            fill={resolved?.background ?? '#ffffff'}
            stroke="#94a3b8"
            strokeWidth={6350}
            filter="url(#slide-shadow)"
          />
          {/* Layout-level placeholder shapes (non-interactive in the editor). */}
          {(resolved?.shapes.slice(0, resolved.shapes.length - slide.shapes.length) ?? []).map(
            (shape) => (
              <Shape key={`layout-${shape.id}`} shape={shape} selected={false} editing={false} />
            ),
          )}
          {slide.shapes.map((shape) => {
            if (shape.kind === 'table') {
              return (
                <g
                  key={shape.id}
                  onPointerDown={beginDragShape(shape.id)}
                  onDoubleClick={onShapeDoubleClick(shape.id)}
                  data-shape-id={shape.id}
                >
                  <Table shape={shape} slideId={slide.id} editable={editingShapeId === shape.id} />
                </g>
              );
            }
            if (shape.kind === 'data' && shape.data) {
              return (
                <g key={shape.id} onPointerDown={beginDragShape(shape.id)} data-shape-id={shape.id}>
                  <foreignObject x={shape.x} y={shape.y} width={shape.w} height={shape.h}>
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <DataPreview
                        datasetId={shape.data.datasetId}
                        rowLimit={shape.data.rowLimit}
                      />
                    </div>
                  </foreignObject>
                </g>
              );
            }
            return (
              <Shape
                key={shape.id}
                shape={shape}
                selected={selectedSet.has(shape.id)}
                editing={editingShapeId === shape.id}
                onPointerDown={beginDragShape(shape.id)}
                onDoubleClick={onShapeDoubleClick(shape.id)}
              />
            );
          })}
          {editingTextShape ? <TextFrame shape={editingTextShape} slideId={slide.id} /> : null}
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
      </div>
    </section>
  );
}
