import type { Shape, TextAlign, TextBody } from '../../model/shape';
import { useEditorStore } from '../../store/editorStore';

const FONTS = ['Inter', 'Roboto', 'NotoSans'] as const;
const SIZES = [10, 12, 14, 16, 18, 24, 32, 48, 72];

interface Props {
  shape: Shape;
  slideId: string;
  position: { left: number; top: number };
}

export function TextToolbar({ shape, slideId, position }: Props): JSX.Element | null {
  const dispatch = useEditorStore((s) => s.dispatch);
  const text = shape.text;
  if (!text) return null;

  const patch = (p: Partial<TextBody>) => {
    dispatch({ type: 'text/update', slideId, shapeId: shape.id, patch: p });
  };

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      data-text-toolbar="1"
      tabIndex={-1}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => {
        // Only prevent default for non-form controls so selects / inputs still receive focus.
        const target = e.target as HTMLElement;
        if (target.tagName !== 'SELECT' && target.tagName !== 'INPUT') {
          e.preventDefault();
        }
      }}
      className="pointer-events-auto flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900/95 px-2 py-1 text-xs text-slate-200 shadow-lg backdrop-blur"
      style={{
        position: 'absolute',
        left: position.left,
        top: position.top,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <select
        aria-label="Font family"
        value={text.fontFamily}
        onChange={(e) => patch({ fontFamily: e.target.value })}
        className="rounded bg-slate-800 px-1 py-0.5 text-slate-100"
      >
        {FONTS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <select
        aria-label="Font size"
        value={text.fontSize}
        onChange={(e) => patch({ fontSize: Number(e.target.value) })}
        className="rounded bg-slate-800 px-1 py-0.5 text-slate-100"
      >
        {SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="button"
        aria-pressed={text.bold}
        onClick={() => patch({ bold: !text.bold })}
        className={`rounded px-2 py-0.5 font-bold ${text.bold ? 'bg-sky-600 text-white' : 'hover:bg-slate-800'}`}
      >
        B
      </button>
      <button
        type="button"
        aria-pressed={text.italic}
        onClick={() => patch({ italic: !text.italic })}
        className={`rounded px-2 py-0.5 italic ${text.italic ? 'bg-sky-600 text-white' : 'hover:bg-slate-800'}`}
      >
        I
      </button>
      <input
        type="color"
        aria-label="Text color"
        value={text.color}
        onChange={(e) => patch({ color: e.target.value })}
        className="h-5 w-6 cursor-pointer rounded border border-slate-700 bg-transparent"
      />
      <div className="mx-1 h-4 w-px bg-slate-700" />
      {(['left', 'center', 'right'] as TextAlign[]).map((a) => (
        <button
          key={a}
          type="button"
          aria-pressed={text.align === a}
          aria-label={`Align ${a}`}
          onClick={() => patch({ align: a })}
          className={`rounded px-2 py-0.5 ${text.align === a ? 'bg-sky-600 text-white' : 'hover:bg-slate-800'}`}
        >
          {a === 'left' ? '⟸' : a === 'center' ? '≡' : '⟹'}
        </button>
      ))}
    </div>
  );
}
