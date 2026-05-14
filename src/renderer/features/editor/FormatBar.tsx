import type { ChartKind } from '../../model/chart';
import type { Shape, TextAlign, TextBody } from '../../model/shape';
import { useT } from '../../i18n';
import { useEditorStore } from '../../store/editorStore';
import { addColumn, addRow, removeColumn, removeRow } from '../table/tableOps';

const FONTS = ['Inter', 'Roboto', 'NotoSans', 'Arial', 'Calibri', 'Times New Roman'] as const;
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];

/**
 * Docked, context-aware formatting bar under the ribbon. Mirrors the
 * Google Slides toolbar idea: controls are always visible; the
 * specific ones change with the selection.
 */
export function FormatBar(): JSX.Element {
  const t = useT();
  const dispatch = useEditorStore((s) => s.dispatch);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const selectedShapeIds = useEditorStore((s) => s.selectedShapeIds);
  const slides = useEditorStore((s) => s.slides);

  const slide = slides.find((s) => s.id === selectedSlideId);
  const shape =
    selectedShapeIds.length === 1
      ? slide?.shapes.find((sh) => sh.id === selectedShapeIds[0])
      : undefined;

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      data-text-toolbar="1"
      onMouseDown={(e) => {
        // Preserve focus on the underlying contentEditable for non-form-control clicks.
        const tgt = e.target as HTMLElement;
        if (tgt.tagName !== 'SELECT' && tgt.tagName !== 'INPUT') {
          e.preventDefault();
        }
      }}
      className="flex h-10 items-center gap-1 overflow-x-auto border-b border-slate-800 bg-slate-900/70 px-3 text-xs text-slate-200"
    >
      <TextSection shape={shape} slideId={selectedSlideId} dispatch={dispatch} t={t} />
      <Divider />
      {shape ? (
        <ShapeStyleSection shape={shape} slideId={selectedSlideId} dispatch={dispatch} />
      ) : null}
      {shape?.kind === 'table' ? (
        <>
          <Divider />
          <TableSection shape={shape} slideId={selectedSlideId} dispatch={dispatch} />
        </>
      ) : null}
      {shape?.kind === 'chart' ? (
        <>
          <Divider />
          <ChartSection shape={shape} slideId={selectedSlideId} dispatch={dispatch} />
        </>
      ) : null}
      {!shape ? <span className="ml-2 text-slate-500">{t('format.placeholder')}</span> : null}
    </div>
  );
}

function Divider(): JSX.Element {
  return <div className="mx-1 h-5 w-px bg-slate-700" />;
}

interface SectionProps {
  shape: Shape;
  slideId: string;
  dispatch: ReturnType<typeof useEditorStore.getState>['dispatch'];
}

function TextSection({
  shape,
  slideId,
  dispatch,
  t,
}: {
  shape: Shape | undefined;
  slideId: string;
  dispatch: SectionProps['dispatch'];
  t: ReturnType<typeof useT>;
}): JSX.Element {
  const editable = !!shape && !!shape.text && shape.kind !== 'data' && shape.kind !== 'chart';
  const text = editable ? shape!.text! : null;
  const patch = (p: Partial<TextBody>) => {
    if (!editable || !shape) return;
    dispatch({ type: 'text/update', slideId, shapeId: shape.id, patch: p });
  };
  return (
    <>
      <select
        aria-label={t('format.fontFamily')}
        title={t('format.fontFamily')}
        disabled={!editable}
        value={text?.fontFamily ?? 'Inter'}
        onChange={(e) => patch({ fontFamily: e.target.value })}
        className="rounded border border-slate-700 bg-slate-800 px-2 py-1 disabled:opacity-50"
      >
        {FONTS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <select
        aria-label={t('format.fontSize')}
        title={t('format.fontSize')}
        disabled={!editable}
        value={text?.fontSize ?? 18}
        onChange={(e) => patch({ fontSize: Number(e.target.value) })}
        className="w-16 rounded border border-slate-700 bg-slate-800 px-2 py-1 disabled:opacity-50"
      >
        {SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <Divider />
      <Toggle
        label="B"
        title={t('format.bold')}
        disabled={!editable}
        pressed={text?.bold ?? false}
        onClick={() => patch({ bold: !text?.bold })}
        className="font-bold"
      />
      <Toggle
        label="I"
        title={t('format.italic')}
        disabled={!editable}
        pressed={text?.italic ?? false}
        onClick={() => patch({ italic: !text?.italic })}
        className="italic"
      />
      <label
        title={t('format.color')}
        className={`ml-1 flex items-center gap-1 rounded px-1.5 py-1 ${
          editable ? 'hover:bg-slate-800' : 'opacity-50'
        }`}
      >
        <span className="text-slate-400">A</span>
        <input
          type="color"
          aria-label={t('format.color')}
          disabled={!editable}
          value={text?.color ?? '#0f172a'}
          onChange={(e) => patch({ color: e.target.value })}
          className="h-4 w-5 cursor-pointer rounded border border-slate-700 bg-transparent disabled:cursor-not-allowed"
        />
      </label>
      <Divider />
      {(['left', 'center', 'right'] as TextAlign[]).map((a) => (
        <Toggle
          key={a}
          label={a === 'left' ? '⟸' : a === 'center' ? '≡' : '⟹'}
          title={t(`format.align${a[0]!.toUpperCase()}${a.slice(1)}`)}
          disabled={!editable}
          pressed={text?.align === a}
          onClick={() => patch({ align: a })}
        />
      ))}
    </>
  );
}

function ShapeStyleSection({ shape, slideId, dispatch }: SectionProps): JSX.Element {
  const update = (patch: Partial<Shape>) =>
    dispatch({ type: 'shape/update', slideId, shapeId: shape.id, patch });
  return (
    <>
      <label className="flex items-center gap-1 rounded px-1.5 py-1 hover:bg-slate-800">
        <span className="text-slate-400">Fill</span>
        <input
          type="color"
          value={shape.fill === 'none' ? '#ffffff' : shape.fill}
          onChange={(e) => update({ fill: e.target.value })}
          className="h-4 w-5 cursor-pointer rounded border border-slate-700 bg-transparent"
        />
      </label>
      <label className="flex items-center gap-1 rounded px-1.5 py-1 hover:bg-slate-800">
        <span className="text-slate-400">Stroke</span>
        <input
          type="color"
          value={shape.stroke === 'none' ? '#000000' : shape.stroke}
          onChange={(e) => update({ stroke: e.target.value })}
          className="h-4 w-5 cursor-pointer rounded border border-slate-700 bg-transparent"
        />
      </label>
      <label className="flex items-center gap-1 rounded px-1.5 py-1">
        <span className="text-slate-400">px</span>
        <input
          type="number"
          step="0.5"
          min="0"
          value={(shape.strokeWidth / 12700).toFixed(1)}
          onChange={(e) => update({ strokeWidth: Math.max(0, Number(e.target.value)) * 12700 })}
          className="w-14 rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-slate-100"
        />
      </label>
      <label className="flex items-center gap-1 rounded px-1.5 py-1">
        <span className="text-slate-400">α</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round((shape.opacity ?? 1) * 100)}
          onChange={(e) => update({ opacity: Number(e.target.value) / 100 })}
          className="h-1 w-20 cursor-pointer"
        />
      </label>
    </>
  );
}

function TableSection({ shape, slideId, dispatch }: SectionProps): JSX.Element {
  if (!shape.table) return <></>;
  const patch = (table: Shape['table']) =>
    dispatch({ type: 'shape/update', slideId, shapeId: shape.id, patch: { table } });
  return (
    <>
      <SmallBtn label="+ ряд" onClick={() => patch(addRow(shape.table!))} />
      <SmallBtn
        label="− ряд"
        onClick={() => patch(removeRow(shape.table!, shape.table!.rows - 1))}
      />
      <SmallBtn label="+ кол" onClick={() => patch(addColumn(shape.table!))} />
      <SmallBtn
        label="− кол"
        onClick={() => patch(removeColumn(shape.table!, shape.table!.cols - 1))}
      />
    </>
  );
}

function ChartSection({ shape, slideId, dispatch }: SectionProps): JSX.Element {
  if (!shape.chart) return <></>;
  return (
    <select
      aria-label="Chart type"
      value={shape.chart.kind}
      onChange={(e) =>
        dispatch({
          type: 'shape/update',
          slideId,
          shapeId: shape.id,
          patch: { chart: { ...shape.chart!, kind: e.target.value as ChartKind } },
        })
      }
      className="rounded border border-slate-700 bg-slate-800 px-2 py-1"
    >
      <option value="bar">bar</option>
      <option value="line">line</option>
      <option value="pie">pie</option>
    </select>
  );
}

function SmallBtn({ label, onClick }: { label: string; onClick: () => void }): JSX.Element {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
    >
      {label}
    </button>
  );
}

function Toggle({
  label,
  title,
  pressed,
  onClick,
  disabled,
  className,
}: {
  label: string;
  title: string;
  pressed: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}): JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        // Preserve focus on the contentEditable so typing isn't interrupted.
        e.preventDefault();
      }}
      onClick={onClick}
      className={`rounded px-2 py-1 text-slate-200 ${
        pressed ? 'bg-sky-600 text-white' : 'hover:bg-slate-800'
      } disabled:cursor-not-allowed disabled:opacity-40 ${className ?? ''}`}
    >
      {label}
    </button>
  );
}
