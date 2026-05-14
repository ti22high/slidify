import { useEffect, useRef } from 'react';
import type { Shape } from '../../model/shape';
import { useEditorStore } from '../../store/editorStore';

interface Props {
  shape: Shape;
  slideId: string;
}

export function TextFrame({ shape, slideId }: Props): JSX.Element | null {
  const ref = useRef<HTMLDivElement | null>(null);
  const dispatch = useEditorStore((s) => s.dispatch);
  const text = shape.text;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerText !== (text?.text ?? '')) {
      el.innerText = text?.text ?? '';
    }
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    // Select all so the first keystroke replaces a placeholder like "Текст".
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [shape.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!text) return null;

  const commit = (value: string) => {
    dispatch({ type: 'text/update', slideId, shapeId: shape.id, patch: { text: value } });
  };

  const t = shape.rotation
    ? `rotate(${shape.rotation} ${shape.x + shape.w / 2} ${shape.y + shape.h / 2})`
    : undefined;

  return (
    <g transform={t}>
      <foreignObject x={shape.x} y={shape.y} width={shape.w} height={shape.h}>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => commit((e.currentTarget as HTMLDivElement).innerText)}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              dispatch({ type: 'text/edit/end' });
            }
          }}
          onBlur={(e) => {
            // Keep edit mode alive if focus is moving to the floating toolbar.
            const next = e.relatedTarget as Element | null;
            if (next && next.closest('[data-text-toolbar="1"]')) return;
            dispatch({ type: 'text/edit/end' });
          }}
          style={{
            width: '100%',
            height: '100%',
            outline: 'none',
            padding: '4px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: text.align,
            fontFamily: text.fontFamily,
            fontSize: `${text.fontSize}pt`,
            fontWeight: text.bold ? 700 : 400,
            fontStyle: text.italic ? 'italic' : 'normal',
            color: text.color,
            background: 'transparent',
            cursor: 'text',
          }}
        />
      </foreignObject>
    </g>
  );
}
