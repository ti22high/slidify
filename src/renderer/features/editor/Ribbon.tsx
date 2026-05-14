import { useRef, useState } from 'react';
import { useT, useI18nStore } from '../../i18n';
import { importXlsxIntoSlide } from '../data/importXlsx';
import { insertImageFromFile } from '../media/ImageDrop';
import { makeShape, makeTableShape, useEditorStore } from '../../store/editorStore';
import { useUiStore } from '../../store/uiStore';
import { THEMES } from '../../themes';
import { PRESET_NAMES, categoryOf, type PresetName } from '../presentation/presets';

const TABS = ['insert', 'design', 'animations', 'present'] as const;
type Tab = (typeof TABS)[number];

const INSERT_BUTTONS = [
  { labelKey: 'ribbon.insert.rectangle', kind: 'rect' },
  { labelKey: 'ribbon.insert.ellipse', kind: 'ellipse' },
  { labelKey: 'ribbon.insert.line', kind: 'line' },
  { labelKey: 'ribbon.insert.arrow', kind: 'arrow' },
] as const;

export function Ribbon(): JSX.Element {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);
  const [activeTab, setActiveTab] = useState<Tab>('insert');
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const dispatch = useEditorStore((s) => s.dispatch);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <nav
      aria-label="Editor toolbar"
      className="flex h-12 items-center gap-1 border-b border-slate-800 bg-slate-900/80 px-2"
    >
      <div className="px-3 text-sm font-semibold tracking-tight text-slate-200">
        {t('ribbon.brand')}
      </div>
      <div className="mx-2 h-6 w-px bg-slate-800" />
      <ul className="flex items-center gap-1">
        {TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <li key={tab}>
              <button
                type="button"
                onClick={() => setActiveTab(tab)}
                aria-pressed={active}
                className={`rounded px-3 py-1.5 text-sm ${
                  active
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                {t(`ribbon.tab.${tab}`)}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mx-2 h-6 w-px bg-slate-800" />
      <div className="flex flex-1 items-center gap-1 overflow-x-auto">
        {activeTab === 'insert' ? (
          <>
            {INSERT_BUTTONS.map((b) => (
              <button
                key={b.kind}
                type="button"
                onClick={() =>
                  dispatch({
                    type: 'shape/add',
                    slideId: selectedSlideId,
                    shape: makeShape(b.kind),
                  })
                }
                className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
              >
                + {t(b.labelKey)}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: 'shape/add',
                  slideId: selectedSlideId,
                  shape: makeTableShape(3, 3),
                })
              }
              className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
            >
              + {t('ribbon.insert.table')}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
            >
              + {t('ribbon.insert.image')}
            </button>
            <button
              type="button"
              onClick={() => void importXlsxIntoSlide(selectedSlideId)}
              className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
            >
              + {t('ribbon.insert.xlsx')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void insertImageFromFile(file, selectedSlideId);
                e.target.value = '';
              }}
            />
          </>
        ) : activeTab === 'design' ? (
          <DesignTab />
        ) : activeTab === 'animations' ? (
          <AnimationsTab />
        ) : (
          <PresentTab />
        )}
      </div>
      <button
        type="button"
        onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}
        title="Locale"
        className="ml-2 rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
      >
        {t('ribbon.locale')}
      </button>
    </nav>
  );
}

function DesignTab(): JSX.Element {
  const t = useT();
  const dispatch = useEditorStore((s) => s.dispatch);
  const currentBg = useEditorStore((s) => s.masters[0]?.background);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400">{t('ribbon.design.hint')}</span>
      {THEMES.map((theme) => {
        const active = currentBg === theme.background;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => dispatch({ type: 'theme/apply', background: theme.background })}
            title={theme.name}
            aria-pressed={active}
            className={`flex items-center gap-1 rounded border px-2 py-1 text-xs ${
              active
                ? 'border-sky-500 bg-slate-800 text-slate-100'
                : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span
              className="inline-block h-3 w-3 rounded-full ring-1 ring-slate-600"
              style={{ background: theme.background }}
            />
            <span
              className="inline-block h-3 w-3 rounded-full ring-1 ring-slate-600"
              style={{ background: theme.accent }}
            />
            {theme.name}
          </button>
        );
      })}
    </div>
  );
}

function AnimationsTab(): JSX.Element {
  const t = useT();
  const dispatch = useEditorStore((s) => s.dispatch);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const selectedShapeIds = useEditorStore((s) => s.selectedShapeIds);
  const slides = useEditorStore((s) => s.slides);
  const [preset, setPreset] = useState<PresetName>('fadeIn');
  const [trigger, setTrigger] = useState<'onClick' | 'withPrevious' | 'afterPrevious'>('onClick');

  if (selectedShapeIds.length !== 1) {
    return <span className="text-xs text-slate-500">{t('ribbon.animations.empty')}</span>;
  }
  const shapeId = selectedShapeIds[0]!;
  const shape = slides.find((s) => s.id === selectedSlideId)?.shapes.find((s) => s.id === shapeId);
  const list = shape?.animations ?? [];

  return (
    <div className="flex items-center gap-2">
      <select
        value={preset}
        onChange={(e) => setPreset(e.target.value as PresetName)}
        className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-xs text-slate-100"
      >
        {PRESET_NAMES.map((p) => (
          <option key={p} value={p}>
            {p} ({categoryOf(p)})
          </option>
        ))}
      </select>
      <select
        value={trigger}
        onChange={(e) => setTrigger(e.target.value as typeof trigger)}
        className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-xs text-slate-100"
      >
        <option value="onClick">{t('ribbon.animations.trigger.onClick')}</option>
        <option value="withPrevious">{t('ribbon.animations.trigger.withPrevious')}</option>
        <option value="afterPrevious">{t('ribbon.animations.trigger.afterPrevious')}</option>
      </select>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: 'shape/animation/add',
            slideId: selectedSlideId,
            shapeId,
            animation: { preset, trigger },
          })
        }
        className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
      >
        + {t('ribbon.animations.add')}
      </button>
      {list.length > 0 && (
        <ul className="flex items-center gap-1 text-xs text-slate-300">
          {list.map((a, i) => (
            <li
              key={i}
              className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5"
            >
              <span>{a.preset}</span>
              <button
                type="button"
                aria-label="remove"
                onClick={() =>
                  dispatch({
                    type: 'shape/animation/remove',
                    slideId: selectedSlideId,
                    shapeId,
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
  );
}

function PresentTab(): JSX.Element {
  const t = useT();
  const start = useUiStore((s) => s.startPresenting);
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => start('fullscreen')}
        className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
      >
        ▶ {t('ribbon.present.start')}
      </button>
      <button
        type="button"
        onClick={() => start('presenter')}
        className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
      >
        ⎚ {t('ribbon.present.presenter')}
      </button>
    </div>
  );
}
