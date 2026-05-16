import { useEffect, useRef } from 'react';
import { SLIDE_HEIGHT_EMU, SLIDE_WIDTH_EMU } from '../../../shared/emu';
import type { Shape, TableCell } from '../../model/shape';
import { setCell } from '../table/tableOps';
import { useEditorStore } from '../../store/editorStore';

interface Props {
  /** The shape being edited, if any. */
  shape: Shape | null;
  /** EMU → CSS-pixel scale. */
  scalePxPerEmu: number;
  /** SLIDE_WIDTH_EMU / SLIDE_HEIGHT_EMU offsets needed to align with workspace margin. */
  marginEmu: number;
  slideId: string;
}

/**
 * Renders text / table editors as HTML overlays positioned over the slide
 * canvas. Bypassing `<foreignObject>` fixes long-standing macOS issues
 * with contentEditable / input focus inside SVG.
 */
export function EditOverlay({
  shape,
  scalePxPerEmu,
  marginEmu,
  slideId,
}: Props): JSX.Element | null {
  if (!shape) return null;
  const left = (shape.x + marginEmu) * scalePxPerEmu;
  const top = (shape.y + marginEmu) * scalePxPerEmu;
  const width = shape.w * scalePxPerEmu;
  const height = shape.h * scalePxPerEmu;
  const rotation = shape.rotation;

  const base: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width,
    height,
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
    transformOrigin: 'center center',
    zIndex: 30,
    pointerEvents: 'auto',
  };

  if (shape.kind === 'table' && shape.table) {
    return <TableEditor shape={shape} slideId={slideId} style={base} />;
  }
  if (shape.text) {
    return (
      <TextEditor shape={shape} slideId={slideId} style={base} scalePxPerEmu={scalePxPerEmu} />
    );
  }
  return null;
}

function TextEditor({
  shape,
  slideId,
  style,
  scalePxPerEmu,
}: {
  shape: Shape;
  slideId: string;
  style: React.CSSProperties;
  scalePxPerEmu: number;
}): JSX.Element {
  const dispatch = useEditorStore((s) => s.dispatch);
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const text = shape.text!;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [shape.id]);

  // Approximate point size in CSS px: 1 pt = 1/72 in, 1 in = 914400 EMU,
  // and the slide is `slideWidthEmu / scalePxPerEmu` px wide, so
  // 1 pt = 12700 EMU on the slide, drawn at 12700*scale CSS px.
  const fontPx = (text.fontSize * 12700 * scalePxPerEmu) / 1;

  const onBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const next = e.relatedTarget as Element | null;
    if (next && next.closest('[data-text-toolbar="1"]')) return;
    dispatch({ type: 'text/edit/end' });
  };

  return (
    <textarea
      ref={ref}
      value={text.text}
      onChange={(e) =>
        dispatch({
          type: 'text/update',
          slideId,
          shapeId: shape.id,
          patch: { text: e.target.value },
        })
      }
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          dispatch({ type: 'text/edit/end' });
        }
      }}
      onBlur={onBlur}
      placeholder="Введите текст…"
      style={{
        ...style,
        resize: 'none',
        border: '2px solid #0ea5e9',
        outline: 'none',
        padding: '4px',
        background: shape.fill === 'none' ? 'transparent' : shape.fill,
        color: text.color,
        fontFamily: text.fontFamily,
        fontSize: `${fontPx}px`,
        fontWeight: text.bold ? 700 : 400,
        fontStyle: text.italic ? 'italic' : 'normal',
        textDecoration:
          [text.underline ? 'underline' : null, text.strikethrough ? 'line-through' : null]
            .filter(Boolean)
            .join(' ') || undefined,
        textAlign: text.align,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    />
  );
}

function TableEditor({
  shape,
  slideId,
  style,
}: {
  shape: Shape;
  slideId: string;
  style: React.CSSProperties;
}): JSX.Element {
  const dispatch = useEditorStore((s) => s.dispatch);
  const table = shape.table!;

  const update = (row: number, col: number, patch: Partial<TableCell>) => {
    dispatch({
      type: 'shape/update',
      slideId,
      shapeId: shape.id,
      patch: { table: setCell(table, row, col, patch) },
    });
  };

  const onBlur = (e: React.FocusEvent<HTMLTableElement>) => {
    const next = e.relatedTarget as Element | null;
    if (next && next.closest('[data-text-toolbar="1"]')) return;
    // Commit on full blur outside the table.
    const stays = next && (e.currentTarget as Element).contains(next);
    if (stays) return;
    dispatch({ type: 'text/edit/end' });
  };

  return (
    <table
      onPointerDown={(e) => e.stopPropagation()}
      onBlur={onBlur}
      style={{
        ...style,
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
        background: shape.fill === 'none' ? 'transparent' : shape.fill,
        fontFamily: shape.text?.fontFamily ?? 'Inter',
        fontSize: `${shape.text?.fontSize ?? 14}pt`,
        color: shape.text?.color ?? '#0f172a',
        border: '2px solid #0ea5e9',
      }}
    >
      <tbody>
        {table.cells.map((row, r) => (
          <tr key={r}>
            {row.map((cell, c) => (
              <td
                key={c}
                style={{
                  border: `1px solid ${shape.stroke}`,
                  padding: '2px 4px',
                  textAlign: cell.align ?? 'left',
                  background: cell.fill ?? 'transparent',
                  verticalAlign: 'middle',
                  overflow: 'hidden',
                }}
              >
                <input
                  value={cell.text}
                  onChange={(e) => update(r, c, { text: e.target.value })}
                  onPointerDown={(e) => e.stopPropagation()}
                  autoFocus={r === 0 && c === 0}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    font: 'inherit',
                    color: 'inherit',
                    textAlign: 'inherit',
                    padding: 0,
                  }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Sentinel constants exported for SlideCanvas calculations. */
export const OVERLAY_CONSTANTS = { SLIDE_WIDTH_EMU, SLIDE_HEIGHT_EMU };
