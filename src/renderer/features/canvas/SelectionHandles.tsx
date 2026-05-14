import type { Shape } from '../../model/shape';
import { useEditorStore } from '../../store/editorStore';
import { resizeRect, type ResizeHandle } from './geometry';

const HANDLES: { id: ResizeHandle; cx: (s: Shape) => number; cy: (s: Shape) => number }[] = [
  { id: 'nw', cx: (s) => s.x, cy: (s) => s.y },
  { id: 'n', cx: (s) => s.x + s.w / 2, cy: (s) => s.y },
  { id: 'ne', cx: (s) => s.x + s.w, cy: (s) => s.y },
  { id: 'e', cx: (s) => s.x + s.w, cy: (s) => s.y + s.h / 2 },
  { id: 'se', cx: (s) => s.x + s.w, cy: (s) => s.y + s.h },
  { id: 's', cx: (s) => s.x + s.w / 2, cy: (s) => s.y + s.h },
  { id: 'sw', cx: (s) => s.x, cy: (s) => s.y + s.h },
  { id: 'w', cx: (s) => s.x, cy: (s) => s.y + s.h / 2 },
];

const HANDLE_SIZE_EMU = 90000;
const ROTATION_OFFSET_EMU = 360000;

interface Props {
  shape: Shape;
  slideId: string;
  emuPerPixel: number;
}

export function SelectionHandles({ shape, slideId, emuPerPixel }: Props): JSX.Element {
  const dispatch = useEditorStore((s) => s.dispatch);

  const t = shape.rotation
    ? `rotate(${shape.rotation} ${shape.x + shape.w / 2} ${shape.y + shape.h / 2})`
    : undefined;

  const beginResize = (handle: ResizeHandle) => (e: React.PointerEvent<SVGRectElement>) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const start: Shape = { ...shape };

    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) * emuPerPixel;
      const dy = (ev.clientY - startY) * emuPerPixel;
      const next = resizeRect(start, handle, dx, dy, {
        lockAspect: ev.shiftKey,
      });
      dispatch({
        type: 'shape/update',
        slideId,
        shapeId: shape.id,
        patch: { x: next.x, y: next.y, w: next.w, h: next.h },
      });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const beginRotate = (e: React.PointerEvent<SVGCircleElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const cx = shape.x + shape.w / 2;
    const cy = shape.y + shape.h / 2;
    const svg = (e.currentTarget.ownerSVGElement ?? null) as SVGSVGElement | null;
    if (!svg) return;

    const toSvg = (clientX: number, clientY: number): { x: number; y: number } => {
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: clientX, y: clientY };
      const inv = ctm.inverse();
      const r = pt.matrixTransform(inv);
      return { x: r.x, y: r.y };
    };

    const move = (ev: PointerEvent) => {
      const p = toSvg(ev.clientX, ev.clientY);
      const angle = (Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI + 90;
      dispatch({
        type: 'shape/update',
        slideId,
        shapeId: shape.id,
        patch: { rotation: Math.round(angle) },
      });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const handleSize = HANDLE_SIZE_EMU;
  const strokeWidth = handleSize / 6;

  return (
    <g transform={t} pointerEvents="all">
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.w}
        height={shape.h}
        fill="none"
        stroke="#0ea5e9"
        strokeWidth={strokeWidth}
        strokeDasharray={`${handleSize} ${handleSize / 2}`}
        pointerEvents="none"
      />
      <line
        x1={shape.x + shape.w / 2}
        y1={shape.y}
        x2={shape.x + shape.w / 2}
        y2={shape.y - ROTATION_OFFSET_EMU}
        stroke="#0ea5e9"
        strokeWidth={strokeWidth}
        pointerEvents="none"
      />
      <circle
        cx={shape.x + shape.w / 2}
        cy={shape.y - ROTATION_OFFSET_EMU}
        r={handleSize}
        fill="#fff"
        stroke="#0ea5e9"
        strokeWidth={strokeWidth}
        style={{ cursor: 'grab' }}
        onPointerDown={beginRotate}
      />
      {HANDLES.map((h) => (
        <rect
          key={h.id}
          x={h.cx(shape) - handleSize / 2}
          y={h.cy(shape) - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="#fff"
          stroke="#0ea5e9"
          strokeWidth={strokeWidth}
          style={{ cursor: `${h.id}-resize` }}
          onPointerDown={beginResize(h.id)}
        />
      ))}
    </g>
  );
}
