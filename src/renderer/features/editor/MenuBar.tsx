import { useEffect, useRef, useState } from 'react';
import { useT, useI18nStore } from '../../i18n';
import { importXlsxIntoSlide } from '../data/importXlsx';
import { insertImageFromFile } from '../media/ImageDrop';
import {
  makeChartShape,
  makeShape,
  makeTableShape,
  makeTextShape,
  useEditorStore,
  MIN_ZOOM,
  MAX_ZOOM,
} from '../../store/editorStore';
import { useDataStore } from '../../store/dataStore';
import { useUiStore } from '../../store/uiStore';
import { THEMES } from '../../themes';
import { doNew, doOpen, doSave } from '../persistence/fileOps';

type MenuId =
  | 'file'
  | 'edit'
  | 'view'
  | 'insert'
  | 'format'
  | 'slide'
  | 'arrange'
  | 'tools'
  | 'help';

const MENUS: MenuId[] = [
  'file',
  'edit',
  'view',
  'insert',
  'format',
  'slide',
  'arrange',
  'tools',
  'help',
];

/**
 * Classic Google-Slides-style top menu bar. Replaces the tabbed Ribbon
 * with named dropdowns (File / Edit / View / Insert / Format / Slide /
 * Arrange / Tools / Help) so familiar users land in a familiar shell.
 */
export function MenuBar(): JSX.Element {
  const [open, setOpen] = useState<MenuId | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);
  const startPresenting = useUiStore((s) => s.startPresenting);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <nav
      ref={wrapRef}
      aria-label="Menu bar"
      className="flex h-9 items-center border-b border-slate-800 bg-slate-900/90 px-2 text-sm text-slate-200"
    >
      <div className="px-2 text-sm font-semibold tracking-tight text-slate-100">
        {t('ribbon.brand')}
      </div>
      <div className="mx-2 h-5 w-px bg-slate-800" />
      <ul className="flex items-center">
        {MENUS.map((id) => {
          const active = open === id;
          return (
            <li key={id} className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={active}
                onClick={() => setOpen(active ? null : id)}
                onMouseEnter={() => {
                  if (open && open !== id) setOpen(id);
                }}
                className={`rounded px-2.5 py-1 ${
                  active ? 'bg-slate-800 text-slate-100' : 'hover:bg-slate-800/70'
                }`}
              >
                {t(`menu.${id}`)}
              </button>
              {active ? <MenuDropdown id={id} close={() => setOpen(null)} /> : null}
            </li>
          );
        })}
      </ul>
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}
        title={t('menu.help.toggleLocale')}
        aria-label={t('menu.help.toggleLocale')}
        className="mr-2 rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
      >
        {t('ribbon.locale')}
      </button>
      <button
        type="button"
        onClick={() => startPresenting('fullscreen')}
        title={t('menu.present.button')}
        className="rounded bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500"
      >
        ▶ {t('menu.present.button')}
      </button>
    </nav>
  );
}

interface DropdownProps {
  id: MenuId;
  close: () => void;
}

function MenuDropdown({ id, close }: DropdownProps): JSX.Element {
  return (
    <div
      role="menu"
      className="absolute left-0 top-full z-40 mt-1 min-w-[220px] rounded-md border border-slate-700 bg-slate-900/95 py-1 text-xs text-slate-200 shadow-xl backdrop-blur"
      onClick={close}
    >
      {id === 'file' && <FileMenu />}
      {id === 'edit' && <EditMenu />}
      {id === 'view' && <ViewMenu />}
      {id === 'insert' && <InsertMenu />}
      {id === 'format' && <FormatMenu />}
      {id === 'slide' && <SlideMenu />}
      {id === 'arrange' && <ArrangeMenu />}
      {id === 'tools' && <ToolsMenu />}
      {id === 'help' && <HelpMenu />}
    </div>
  );
}

function Item({
  label,
  onClick,
  shortcut,
  disabled,
}: {
  label: string;
  onClick?: () => void;
  shortcut?: string;
  disabled?: boolean;
}): JSX.Element {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-6 px-3 py-1.5 text-left ${
        disabled
          ? 'cursor-not-allowed text-slate-500'
          : 'text-slate-200 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span>{label}</span>
      {shortcut ? <span className="text-[10px] text-slate-500">{shortcut}</span> : null}
    </button>
  );
}

function Separator(): JSX.Element {
  return <div role="separator" className="my-1 h-px bg-slate-800" />;
}

function SectionLabel({ label }: { label: string }): JSX.Element {
  return (
    <div className="px-3 pb-0.5 pt-1.5 text-[10px] uppercase tracking-wider text-slate-500">
      {label}
    </div>
  );
}

const CMD = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform) ? '⌘' : 'Ctrl';

// ────────────────────────────────────────────────────────────────────────────
// File
// ────────────────────────────────────────────────────────────────────────────

function FileMenu(): JSX.Element {
  const t = useT();
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  return (
    <>
      <Item label={t('menu.file.new')} onClick={() => doNew()} shortcut={`${CMD}+N`} />
      <Item label={t('menu.file.open')} onClick={() => void doOpen()} shortcut={`${CMD}+O`} />
      <Separator />
      <Item label={t('menu.file.save')} onClick={() => void doSave(false)} shortcut={`${CMD}+S`} />
      <Item
        label={t('menu.file.saveAs')}
        onClick={() => void doSave(true)}
        shortcut={`${CMD}+⇧+S`}
      />
      <Separator />
      <Item
        label={t('menu.file.importXlsx')}
        onClick={() => void importXlsxIntoSlide(selectedSlideId)}
      />
      <Separator />
      <Item label={t('menu.file.importPptx')} disabled />
      <Item label={t('menu.file.exportPptx')} disabled />
      <Item label={t('menu.file.exportPdf')} disabled />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Edit
// ────────────────────────────────────────────────────────────────────────────

function EditMenu(): JSX.Element {
  const t = useT();
  const dispatch = useEditorStore((s) => s.dispatch);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const selectedShapeIds = useEditorStore((s) => s.selectedShapeIds);
  const slides = useEditorStore((s) => s.slides);
  const slide = slides.find((s) => s.id === selectedSlideId);
  const someSelected = selectedShapeIds.length > 0;
  const openFindReplace = useUiStore((s) => s.setFindReplaceOpen);

  return (
    <>
      <Item
        label={t('menu.edit.undo')}
        onClick={() => dispatch({ type: 'undo' })}
        shortcut={`${CMD}+Z`}
      />
      <Item
        label={t('menu.edit.redo')}
        onClick={() => dispatch({ type: 'redo' })}
        shortcut={`${CMD}+⇧+Z`}
      />
      <Separator />
      <Item
        label={t('menu.edit.selectAll')}
        onClick={() =>
          dispatch({
            type: 'selection/set',
            shapeIds: slide?.shapes.map((s) => s.id) ?? [],
          })
        }
        shortcut={`${CMD}+A`}
      />
      <Item
        label={t('menu.edit.duplicate')}
        disabled={!someSelected}
        onClick={() => dispatch({ type: 'slide/duplicate', slideId: selectedSlideId })}
        shortcut={`${CMD}+D`}
      />
      <Item
        label={t('menu.edit.delete')}
        disabled={!someSelected}
        onClick={() =>
          dispatch({
            type: 'shape/delete',
            slideId: selectedSlideId,
            shapeIds: selectedShapeIds,
          })
        }
        shortcut="Del"
      />
      <Separator />
      <Item
        label={t('menu.edit.findReplace')}
        onClick={() => openFindReplace(true)}
        shortcut={`${CMD}+F`}
      />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// View
// ────────────────────────────────────────────────────────────────────────────

function ViewMenu(): JSX.Element {
  const t = useT();
  const dispatch = useEditorStore((s) => s.dispatch);
  const zoom = useEditorStore((s) => s.zoom);
  const setAnimationsPanel = useUiStore((s) => s.setAnimationsPanel);
  const animationsPanel = useUiStore((s) => s.animationsPanel);
  const startPresenting = useUiStore((s) => s.startPresenting);
  return (
    <>
      <Item
        label={t('menu.view.zoomIn')}
        onClick={() => dispatch({ type: 'zoom/set', value: Math.min(MAX_ZOOM, zoom * 1.1) })}
        shortcut={`${CMD}++`}
      />
      <Item
        label={t('menu.view.zoomOut')}
        onClick={() => dispatch({ type: 'zoom/set', value: Math.max(MIN_ZOOM, zoom / 1.1) })}
        shortcut={`${CMD}+-`}
      />
      <Item
        label={t('menu.view.zoomReset')}
        onClick={() => dispatch({ type: 'zoom/set', value: 1 })}
        shortcut={`${CMD}+0`}
      />
      <Separator />
      <Item
        label={animationsPanel ? t('menu.view.hideAnimations') : t('menu.view.showAnimations')}
        onClick={() => setAnimationsPanel(!animationsPanel)}
      />
      <Separator />
      <Item
        label={t('menu.view.present')}
        onClick={() => startPresenting('fullscreen')}
        shortcut="F5"
      />
      <Item label={t('menu.view.presenter')} onClick={() => startPresenting('presenter')} />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Insert
// ────────────────────────────────────────────────────────────────────────────

function InsertMenu(): JSX.Element {
  const t = useT();
  const dispatch = useEditorStore((s) => s.dispatch);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const openShapeLibrary = useUiStore((s) => s.setShapeLibraryOpen);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <Item
        label={t('ribbon.insert.text')}
        onClick={() => {
          const shape = makeTextShape();
          dispatch({ type: 'shape/add', slideId: selectedSlideId, shape });
          setTimeout(() => dispatch({ type: 'text/edit/start', shapeId: shape.id }), 0);
        }}
      />
      <Item label={t('ribbon.insert.image')} onClick={() => fileInputRef.current?.click()} />
      <Separator />
      <SectionLabel label={t('menu.insert.shapes')} />
      <Item
        label={t('ribbon.insert.rectangle')}
        onClick={() =>
          dispatch({ type: 'shape/add', slideId: selectedSlideId, shape: makeShape('rect') })
        }
      />
      <Item
        label={t('ribbon.insert.ellipse')}
        onClick={() =>
          dispatch({ type: 'shape/add', slideId: selectedSlideId, shape: makeShape('ellipse') })
        }
      />
      <Item
        label={t('ribbon.insert.line')}
        onClick={() =>
          dispatch({ type: 'shape/add', slideId: selectedSlideId, shape: makeShape('line') })
        }
      />
      <Item
        label={t('ribbon.insert.arrow')}
        onClick={() =>
          dispatch({ type: 'shape/add', slideId: selectedSlideId, shape: makeShape('arrow') })
        }
      />
      <Item label={t('menu.insert.shapeLibrary')} onClick={() => openShapeLibrary(true)} />
      <Separator />
      <Item
        label={t('ribbon.insert.table')}
        onClick={() =>
          dispatch({ type: 'shape/add', slideId: selectedSlideId, shape: makeTableShape(3, 3) })
        }
      />
      <Item
        label={t('ribbon.insert.xlsx')}
        onClick={() => void importXlsxIntoSlide(selectedSlideId)}
      />
      <Item
        label={t('ribbon.insert.chart')}
        onClick={() => {
          const datasets = Object.values(useDataStore.getState().datasets);
          const ds = datasets[datasets.length - 1];
          if (!ds) {
            alert(t('ribbon.insert.chartNeedsData'));
            return;
          }
          const series = ds.headers[1] ?? 'Series';
          dispatch({
            type: 'shape/add',
            slideId: selectedSlideId,
            shape: makeChartShape(ds.id, series),
          });
        }}
      />
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
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Format (themes live here in GSlides idiom — Slide → Apply theme — but we
// fold them in here as the only colour-scheme entry point for now.)
// ────────────────────────────────────────────────────────────────────────────

function FormatMenu(): JSX.Element {
  const t = useT();
  const dispatch = useEditorStore((s) => s.dispatch);
  const currentBg = useEditorStore((s) => s.masters[0]?.background);
  return (
    <>
      <SectionLabel label={t('menu.format.theme')} />
      {THEMES.map((theme) => {
        const active = currentBg === theme.background;
        return (
          <button
            key={theme.id}
            type="button"
            role="menuitem"
            onClick={() =>
              dispatch({
                type: 'theme/apply',
                background: theme.background,
                accent: theme.accent,
                text: theme.text,
                headingFont: theme.headingFont,
                bodyFont: theme.bodyFont,
              })
            }
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-800 ${
              active ? 'text-white' : 'text-slate-200'
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
            <span className="flex-1">{theme.name}</span>
            {active ? <span className="text-[10px] text-sky-400">●</span> : null}
          </button>
        );
      })}
      <Separator />
      <Item label={t('menu.format.hint')} disabled />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Slide
// ────────────────────────────────────────────────────────────────────────────

function SlideMenu(): JSX.Element {
  const t = useT();
  const dispatch = useEditorStore((s) => s.dispatch);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const slides = useEditorStore((s) => s.slides);
  const layouts = useEditorStore((s) => s.layouts);
  const currentLayoutId = slides.find((s) => s.id === selectedSlideId)?.layoutId;
  const idx = slides.findIndex((s) => s.id === selectedSlideId);
  const hasPrev = idx > 0;
  const hasNext = idx < slides.length - 1;

  return (
    <>
      <Item
        label={t('menu.slide.new')}
        onClick={() => dispatch({ type: 'slide/add', afterSlideId: selectedSlideId })}
      />
      <Item
        label={t('menu.slide.duplicate')}
        onClick={() => dispatch({ type: 'slide/duplicate', slideId: selectedSlideId })}
        shortcut={`${CMD}+D`}
      />
      <Item
        label={t('menu.slide.delete')}
        disabled={slides.length <= 1}
        onClick={() => dispatch({ type: 'slide/delete', slideId: selectedSlideId })}
      />
      <Separator />
      <SectionLabel label={t('menu.slide.applyLayout')} />
      {layouts.map((l) => {
        const active = l.id === currentLayoutId;
        return (
          <button
            key={l.id}
            type="button"
            role="menuitem"
            onClick={() =>
              dispatch({ type: 'slide/setLayout', slideId: selectedSlideId, layoutId: l.id })
            }
            className={`flex w-full items-center justify-between px-3 py-1.5 text-left ${
              active ? 'text-white' : 'text-slate-200'
            } hover:bg-slate-800 hover:text-white`}
          >
            <span>{l.name}</span>
            {active ? <span className="text-[10px] text-sky-400">●</span> : null}
          </button>
        );
      })}
      <Separator />
      <Item
        label={t('menu.slide.previous')}
        disabled={!hasPrev}
        onClick={() => {
          const target = slides[idx - 1];
          if (target) dispatch({ type: 'slide/select', slideId: target.id });
        }}
        shortcut="←"
      />
      <Item
        label={t('menu.slide.next')}
        disabled={!hasNext}
        onClick={() => {
          const target = slides[idx + 1];
          if (target) dispatch({ type: 'slide/select', slideId: target.id });
        }}
        shortcut="→"
      />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Arrange
// ────────────────────────────────────────────────────────────────────────────

function ArrangeMenu(): JSX.Element {
  const t = useT();
  const dispatch = useEditorStore((s) => s.dispatch);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const selectedShapeIds = useEditorStore((s) => s.selectedShapeIds);
  const noSelection = selectedShapeIds.length === 0;
  const lessThan2 = selectedShapeIds.length < 2;
  const lessThan3 = selectedShapeIds.length < 3;

  const zorder = (to: 'front' | 'forward' | 'backward' | 'back') =>
    dispatch({
      type: 'shape/zorder',
      slideId: selectedSlideId,
      shapeIds: selectedShapeIds,
      to,
    });
  const align = (mode: 'left' | 'centerH' | 'right' | 'top' | 'middleV' | 'bottom') =>
    dispatch({
      type: 'arrange/align',
      slideId: selectedSlideId,
      shapeIds: selectedShapeIds,
      mode,
    });
  const distribute = (mode: 'horizontal' | 'vertical') =>
    dispatch({
      type: 'arrange/distribute',
      slideId: selectedSlideId,
      shapeIds: selectedShapeIds,
      mode,
    });
  const rotate = (delta: number) =>
    dispatch({
      type: 'arrange/rotateBy',
      slideId: selectedSlideId,
      shapeIds: selectedShapeIds,
      delta,
    });

  return (
    <>
      <SectionLabel label={t('menu.arrange.order')} />
      <Item label={t('ctx.bringFront')} disabled={noSelection} onClick={() => zorder('front')} />
      <Item
        label={t('ctx.bringForward')}
        disabled={noSelection}
        onClick={() => zorder('forward')}
      />
      <Item
        label={t('ctx.sendBackward')}
        disabled={noSelection}
        onClick={() => zorder('backward')}
      />
      <Item label={t('ctx.sendBack')} disabled={noSelection} onClick={() => zorder('back')} />
      <Separator />
      <SectionLabel label={t('menu.arrange.align')} />
      <Item
        label={t('menu.arrange.alignLeft')}
        disabled={lessThan2}
        onClick={() => align('left')}
      />
      <Item
        label={t('menu.arrange.alignCenterH')}
        disabled={lessThan2}
        onClick={() => align('centerH')}
      />
      <Item
        label={t('menu.arrange.alignRight')}
        disabled={lessThan2}
        onClick={() => align('right')}
      />
      <Item label={t('menu.arrange.alignTop')} disabled={lessThan2} onClick={() => align('top')} />
      <Item
        label={t('menu.arrange.alignMiddleV')}
        disabled={lessThan2}
        onClick={() => align('middleV')}
      />
      <Item
        label={t('menu.arrange.alignBottom')}
        disabled={lessThan2}
        onClick={() => align('bottom')}
      />
      <Separator />
      <SectionLabel label={t('menu.arrange.distribute')} />
      <Item
        label={t('menu.arrange.distributeH')}
        disabled={lessThan3}
        onClick={() => distribute('horizontal')}
      />
      <Item
        label={t('menu.arrange.distributeV')}
        disabled={lessThan3}
        onClick={() => distribute('vertical')}
      />
      <Separator />
      <SectionLabel label={t('menu.arrange.rotate')} />
      <Item label={t('menu.arrange.rotateCw')} disabled={noSelection} onClick={() => rotate(90)} />
      <Item
        label={t('menu.arrange.rotateCcw')}
        disabled={noSelection}
        onClick={() => rotate(-90)}
      />
      <Item
        label={t('menu.arrange.flipH')}
        disabled={noSelection}
        onClick={() =>
          dispatch({
            type: 'arrange/flip',
            slideId: selectedSlideId,
            shapeIds: selectedShapeIds,
            axis: 'h',
          })
        }
      />
      <Item
        label={t('menu.arrange.flipV')}
        disabled={noSelection}
        onClick={() =>
          dispatch({
            type: 'arrange/flip',
            slideId: selectedSlideId,
            shapeIds: selectedShapeIds,
            axis: 'v',
          })
        }
      />
      <Separator />
      {/* TODO: Group / Ungroup — see ROADMAP §6 (needs composite-shape model). */}
      <Item label={t('menu.arrange.group')} disabled />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Tools
// ────────────────────────────────────────────────────────────────────────────

function ToolsMenu(): JSX.Element {
  const t = useT();
  const openFindReplace = useUiStore((s) => s.setFindReplaceOpen);
  return (
    <>
      <Item label={t('menu.tools.wordCount')} disabled />
      <Item
        label={t('menu.tools.findReplace')}
        onClick={() => openFindReplace(true)}
        shortcut={`${CMD}+F`}
      />
      <Item label={t('menu.tools.spellCheck')} disabled />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Help
// ────────────────────────────────────────────────────────────────────────────

function HelpMenu(): JSX.Element {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    void window.slidify?.getVersion?.().then((v) => setVersion(v ?? null));
  }, []);

  return (
    <>
      <Item
        label={t('menu.help.toggleLocale')}
        onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}
      />
      <Separator />
      <Item label={t('menu.help.about', { version: version ?? '—' })} disabled />
    </>
  );
}
