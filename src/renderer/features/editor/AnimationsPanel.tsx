import { useState } from 'react';
import { useT } from '../../i18n';
import { useEditorStore } from '../../store/editorStore';
import { useUiStore } from '../../store/uiStore';
import { PRESET_NAMES, categoryOf, type PresetName } from '../presentation/presets';

/**
 * Floating Animations panel — toggled from View → Animations. Replaces the
 * old Ribbon "Анимация" tab. Same logic, lifted into a panel so the rest of
 * the editor chrome can stay in the classic menu-bar idiom.
 */
export function AnimationsPanel(): JSX.Element | null {
  const t = useT();
  const open = useUiStore((s) => s.animationsPanel);
  const setOpen = useUiStore((s) => s.setAnimationsPanel);
  const dispatch = useEditorStore((s) => s.dispatch);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const selectedShapeIds = useEditorStore((s) => s.selectedShapeIds);
  const slides = useEditorStore((s) => s.slides);
  const [preset, setPreset] = useState<PresetName>('fadeIn');
  const [trigger, setTrigger] = useState<'onClick' | 'withPrevious' | 'afterPrevious'>('onClick');

  if (!open) return null;

  const shape =
    selectedShapeIds.length === 1
      ? slides
          .find((s) => s.id === selectedSlideId)
          ?.shapes.find((s) => s.id === selectedShapeIds[0])
      : undefined;
  const list = shape?.animations ?? [];

  return (
    <aside
      aria-label="Animations"
      className="absolute right-[300px] top-24 z-30 w-72 rounded-md border border-slate-700 bg-slate-900/95 p-3 text-xs text-slate-200 shadow-xl"
    >
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">{t('ribbon.tab.animations')}</h2>
        <button
          type="button"
          aria-label="close"
          onClick={() => setOpen(false)}
          className="rounded px-1.5 py-0.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        >
          ✕
        </button>
      </header>
      {!shape ? (
        <p className="text-slate-500">{t('ribbon.animations.empty')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-slate-500">{t('menu.animation.preset')}</span>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as PresetName)}
              className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
            >
              {PRESET_NAMES.map((p) => (
                <option key={p} value={p}>
                  {p} ({categoryOf(p)})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-slate-500">{t('menu.animation.trigger')}</span>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as typeof trigger)}
              className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
            >
              <option value="onClick">{t('ribbon.animations.trigger.onClick')}</option>
              <option value="withPrevious">{t('ribbon.animations.trigger.withPrevious')}</option>
              <option value="afterPrevious">{t('ribbon.animations.trigger.afterPrevious')}</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: 'shape/animation/add',
                slideId: selectedSlideId,
                shapeId: shape.id,
                animation: { preset, trigger },
              })
            }
            className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-slate-200 hover:bg-slate-800"
          >
            + {t('ribbon.animations.add')}
          </button>
          {list.length > 0 && (
            <ul className="flex flex-col gap-1 border-t border-slate-800 pt-2">
              {list.map((a, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded border border-slate-700 bg-slate-800/40 px-2 py-1"
                >
                  <span>
                    {a.preset}{' '}
                    <span className="text-slate-500">
                      ({t(`ribbon.animations.trigger.${a.trigger}`)})
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label="remove"
                    onClick={() =>
                      dispatch({
                        type: 'shape/animation/remove',
                        slideId: selectedSlideId,
                        shapeId: shape.id,
                        index: i,
                      })
                    }
                    className="text-slate-400 hover:text-rose-400"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
}
