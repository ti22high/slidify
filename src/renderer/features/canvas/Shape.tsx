import type { CSSProperties } from 'react';
import { useSyncExternalStore } from 'react';
import { EMU_PER_POINT } from '../../../shared/emu';
import type { Shape as ShapeModel } from '../../model/shape';
import { getMediaUrl, subscribeMedia } from '../media/mediaCache';
import { presetPath } from './shapePresets';

interface Props {
  shape: ShapeModel;
  selected: boolean;
  editing: boolean;
  onPointerDown?: (e: React.PointerEvent<SVGGElement>) => void;
  onDoubleClick?: (e: React.MouseEvent<SVGGElement>) => void;
}

function textDecorationFor(text: {
  underline?: boolean;
  strikethrough?: boolean;
}): string | undefined {
  const parts: string[] = [];
  if (text.underline) parts.push('underline');
  if (text.strikethrough) parts.push('line-through');
  return parts.length ? parts.join(' ') : undefined;
}

function transformFor(shape: ShapeModel): string | undefined {
  const cx = shape.x + shape.w / 2;
  const cy = shape.y + shape.h / 2;
  const parts: string[] = [];
  if (shape.rotation) parts.push(`rotate(${shape.rotation} ${cx} ${cy})`);
  if (shape.flipH || shape.flipV) {
    const sx = shape.flipH ? -1 : 1;
    const sy = shape.flipV ? -1 : 1;
    // Mirror around (cx, cy): translate to centre, scale, translate back.
    parts.push(`translate(${cx} ${cy}) scale(${sx} ${sy}) translate(${-cx} ${-cy})`);
  }
  return parts.length ? parts.join(' ') : undefined;
}

function ImageBody({
  x,
  y,
  w,
  h,
  mediaRef,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  mediaRef?: string;
}): JSX.Element | null {
  const url = useSyncExternalStore(
    subscribeMedia,
    () => (mediaRef ? getMediaUrl(mediaRef) : undefined),
    () => undefined,
  );
  if (!mediaRef) return null;
  if (!url) {
    return (
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="#e2e8f0"
        stroke="#94a3b8"
        strokeWidth={9525}
        strokeDasharray="38100 19050"
      />
    );
  }
  return <image x={x} y={y} width={w} height={h} href={url} preserveAspectRatio="xMidYMid meet" />;
}

export function Shape({
  shape,
  selected,
  editing,
  onPointerDown,
  onDoubleClick,
}: Props): JSX.Element {
  const t = transformFor(shape);
  const fill = shape.fill === 'none' ? 'none' : shape.fill;
  const cursor: CSSProperties['cursor'] = editing ? 'text' : 'move';

  let body: JSX.Element;
  switch (shape.kind) {
    case 'rect': {
      body = (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.w}
          height={shape.h}
          fill={fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
        />
      );
      break;
    }
    case 'ellipse': {
      body = (
        <ellipse
          cx={shape.x + shape.w / 2}
          cy={shape.y + shape.h / 2}
          rx={shape.w / 2}
          ry={shape.h / 2}
          fill={fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
        />
      );
      break;
    }
    case 'preset': {
      const d = shape.presetGeom ? presetPath(shape.presetGeom, shape.w, shape.h) : '';
      body = (
        <path
          d={d}
          transform={`translate(${shape.x} ${shape.y})`}
          fill={fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
        />
      );
      break;
    }
    case 'line':
    case 'arrow': {
      const x1 = shape.x;
      const y1 = shape.y + shape.h / 2;
      const x2 = shape.x + shape.w;
      const y2 = shape.y + shape.h / 2;
      body = (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          markerEnd={shape.kind === 'arrow' ? `url(#slidify-arrow-${shape.id})` : undefined}
        />
      );
      break;
    }
    case 'image': {
      body = (
        <ImageBody
          x={shape.x}
          y={shape.y}
          w={shape.w}
          h={shape.h}
          mediaRef={shape.image?.mediaRef}
        />
      );
      break;
    }
    case 'table':
    case 'data':
    case 'chart': {
      // table -> Table.tsx; data -> DataPreview; chart -> Chart.tsx.
      // Stub a bounding box so selection/handles still work in SlideCanvas.
      body = (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.w}
          height={shape.h}
          fill="none"
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
        />
      );
      break;
    }
  }

  const text = shape.text;

  return (
    <g
      transform={t}
      opacity={shape.opacity ?? 1}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      style={{ cursor }}
      data-shape-id={shape.id}
      data-selected={selected || undefined}
    >
      {shape.kind === 'arrow' ? (
        <defs>
          <marker
            id={`slidify-arrow-${shape.id}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={shape.stroke} />
          </marker>
        </defs>
      ) : null}
      {body}
      {text && !editing && text.text ? (
        <text
          x={shape.x + shape.w / 2}
          y={shape.y + shape.h / 2}
          textAnchor={text.align === 'left' ? 'start' : text.align === 'right' ? 'end' : 'middle'}
          dominantBaseline="middle"
          fontFamily={text.fontFamily}
          fontSize={text.fontSize * EMU_PER_POINT}
          fontWeight={text.bold ? 700 : 400}
          fontStyle={text.italic ? 'italic' : 'normal'}
          textDecoration={textDecorationFor(text)}
          fill={text.color}
        >
          {text.text}
        </text>
      ) : null}
    </g>
  );
}
