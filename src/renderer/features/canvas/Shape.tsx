import type { CSSProperties } from 'react';
import { EMU_PER_POINT } from '../../../shared/emu';
import type { Shape as ShapeModel } from '../../model/shape';

interface Props {
  shape: ShapeModel;
  selected: boolean;
  editing: boolean;
  onPointerDown?: (e: React.PointerEvent<SVGGElement>) => void;
  onDoubleClick?: (e: React.MouseEvent<SVGGElement>) => void;
}

function transformFor(shape: ShapeModel): string | undefined {
  if (!shape.rotation) return undefined;
  return `rotate(${shape.rotation} ${shape.x + shape.w / 2} ${shape.y + shape.h / 2})`;
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
  }

  const text = shape.text;

  return (
    <g
      transform={t}
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
          fill={text.color}
        >
          {text.text}
        </text>
      ) : null}
    </g>
  );
}
