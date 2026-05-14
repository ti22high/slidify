import type { Shape } from '../../model/shape';
import { useEditorStore } from '../../store/editorStore';
import { setCell } from './tableOps';

interface Props {
  shape: Shape;
  slideId: string;
  editable: boolean;
}

export function Table({ shape, slideId, editable }: Props): JSX.Element | null {
  const dispatch = useEditorStore((s) => s.dispatch);
  const table = shape.table;
  if (!table) return null;

  const t = shape.rotation
    ? `rotate(${shape.rotation} ${shape.x + shape.w / 2} ${shape.y + shape.h / 2})`
    : undefined;

  const onCellInput = (row: number, col: number, value: string) => {
    if (!editable) return;
    const next = setCell(table, row, col, { text: value });
    dispatch({ type: 'shape/update', slideId, shapeId: shape.id, patch: { table: next } });
  };

  return (
    <g transform={t}>
      <foreignObject x={shape.x} y={shape.y} width={shape.w} height={shape.h}>
        <table
          style={{
            width: '100%',
            height: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            fontFamily: shape.text?.fontFamily ?? 'Inter',
            fontSize: `${shape.text?.fontSize ?? 14}pt`,
            color: shape.text?.color ?? '#0f172a',
            background: shape.fill === 'none' ? 'transparent' : shape.fill,
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
                    {editable ? (
                      <input
                        value={cell.text}
                        onChange={(e) => onCellInput(r, c, e.target.value)}
                        onPointerDown={(e) => e.stopPropagation()}
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
                    ) : (
                      <span>{cell.text}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </foreignObject>
    </g>
  );
}
