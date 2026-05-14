import { useEffect, useState } from 'react';
import { useT } from '../../i18n';
import { useEditorStore } from '../../store/editorStore';

interface MenuPosition {
  x: number;
  y: number;
  shapeId: string | null;
}

let openMenu: ((pos: MenuPosition) => void) | null = null;

export function openContextMenu(x: number, y: number, shapeId: string | null): void {
  if (openMenu) openMenu({ x, y, shapeId });
}

export function ContextMenu(): JSX.Element | null {
  const t = useT();
  const [pos, setPos] = useState<MenuPosition | null>(null);
  const dispatch = useEditorStore((s) => s.dispatch);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const selectedShapeIds = useEditorStore((s) => s.selectedShapeIds);

  useEffect(() => {
    openMenu = (p) => setPos(p);
    return () => {
      openMenu = null;
    };
  }, []);

  useEffect(() => {
    if (!pos) return undefined;
    const close = () => setPos(null);
    window.addEventListener('pointerdown', close, { capture: true });
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('pointerdown', close, { capture: true });
      window.removeEventListener('keydown', close);
    };
  }, [pos]);

  if (!pos) return null;
  const ids = pos.shapeId
    ? Array.from(new Set([...selectedShapeIds, pos.shapeId]))
    : selectedShapeIds;
  const hasSelection = ids.length > 0;

  const action = (fn: () => void) => () => {
    fn();
    setPos(null);
  };

  return (
    <div
      role="menu"
      className="fixed z-[60] min-w-[200px] rounded-md border border-slate-700 bg-slate-900/95 py-1 text-xs text-slate-200 shadow-2xl"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Item
        label={t('ctx.bringFront')}
        disabled={!hasSelection}
        onClick={action(() =>
          dispatch({ type: 'shape/zorder', slideId: selectedSlideId, shapeIds: ids, to: 'front' }),
        )}
      />
      <Item
        label={t('ctx.bringForward')}
        disabled={!hasSelection}
        onClick={action(() =>
          dispatch({
            type: 'shape/zorder',
            slideId: selectedSlideId,
            shapeIds: ids,
            to: 'forward',
          }),
        )}
      />
      <Item
        label={t('ctx.sendBackward')}
        disabled={!hasSelection}
        onClick={action(() =>
          dispatch({
            type: 'shape/zorder',
            slideId: selectedSlideId,
            shapeIds: ids,
            to: 'backward',
          }),
        )}
      />
      <Item
        label={t('ctx.sendBack')}
        disabled={!hasSelection}
        onClick={action(() =>
          dispatch({ type: 'shape/zorder', slideId: selectedSlideId, shapeIds: ids, to: 'back' }),
        )}
      />
      <Separator />
      <Item
        label={t('ctx.duplicate')}
        disabled={!hasSelection}
        onClick={action(() => {
          // delegate to clipboard-style duplicate via shape/add of a clone
          const slide = useEditorStore.getState().slides.find((s) => s.id === selectedSlideId);
          if (!slide) return;
          const targets = slide.shapes.filter((s) => ids.includes(s.id));
          const newIds: string[] = [];
          for (const s of targets) {
            const c = {
              ...s,
              id: `shape-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
              x: s.x + 200000,
              y: s.y + 200000,
            };
            newIds.push(c.id);
            dispatch({ type: 'shape/add', slideId: selectedSlideId, shape: c });
          }
          dispatch({ type: 'selection/set', shapeIds: newIds });
        })}
      />
      <Item
        label={t('ctx.delete')}
        disabled={!hasSelection}
        onClick={action(() =>
          dispatch({ type: 'shape/delete', slideId: selectedSlideId, shapeIds: ids }),
        )}
      />
    </div>
  );
}

function Item({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}): JSX.Element {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className="block w-full px-3 py-1 text-left hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function Separator(): JSX.Element {
  return <div className="my-1 h-px bg-slate-800" />;
}
