import { useEffect, useMemo, useState } from 'react';
import { useT } from '../../i18n';
import { useEditorStore } from '../../store/editorStore';
import { useUiStore } from '../../store/uiStore';
import { findMatches, planReplaceAll } from './findReplace';

/**
 * Find & replace panel — searches every text body and table cell across
 * the deck. Toggled from Edit / Tools menu and Cmd+F. Replace operations
 * dispatch one batched action so a full "Replace all" is a single undo.
 */
export function FindReplacePanel(): JSX.Element | null {
  const t = useT();
  const open = useUiStore((s) => s.findReplaceOpen);
  const setOpen = useUiStore((s) => s.setFindReplaceOpen);
  const slides = useEditorStore((s) => s.slides);
  const dispatch = useEditorStore((s) => s.dispatch);
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const matches = useMemo(
    () => findMatches(slides, query, { matchCase }),
    [slides, query, matchCase],
  );

  // Keep currentIndex in range when the match list shrinks.
  useEffect(() => {
    if (currentIndex >= matches.length) setCurrentIndex(0);
  }, [matches.length, currentIndex]);

  if (!open) return null;

  const navigate = (delta: number) => {
    if (matches.length === 0) return;
    const next = (currentIndex + delta + matches.length) % matches.length;
    setCurrentIndex(next);
    const m = matches[next]!;
    dispatch({ type: 'slide/select', slideId: m.slideId });
    dispatch({ type: 'selection/set', shapeIds: [m.shapeId] });
  };

  const replaceAll = () => {
    const { patches, count } = planReplaceAll(slides, query, replacement, { matchCase });
    if (count === 0) return;
    dispatch({ type: 'findReplace/replaceAll', patches });
    setCurrentIndex(0);
  };

  return (
    <aside
      aria-label="Find and replace"
      className="absolute right-[300px] top-24 z-30 w-80 rounded-md border border-slate-700 bg-slate-900/95 p-3 text-xs text-slate-200 shadow-xl"
    >
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">{t('findReplace.title')}</h2>
        <button
          type="button"
          aria-label="close"
          onClick={() => setOpen(false)}
          className="rounded px-1.5 py-0.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        >
          ✕
        </button>
      </header>
      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-0.5">
          <span className="text-slate-500">{t('findReplace.find')}</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                navigate(e.shiftKey ? -1 : 1);
              }
              if (e.key === 'Escape') setOpen(false);
            }}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-slate-500">{t('findReplace.replace')}</span>
          <input
            type="text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
          />
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={matchCase}
            onChange={(e) => setMatchCase(e.target.checked)}
          />
          <span className="text-slate-300">{t('findReplace.matchCase')}</span>
        </label>
        <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-2">
          <span className="text-slate-400">
            {matches.length === 0
              ? t('findReplace.noMatches')
              : t('findReplace.indexOf', {
                  index: currentIndex + 1,
                  total: matches.length,
                })}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={matches.length === 0}
              onClick={() => navigate(-1)}
              className="rounded border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹ {t('findReplace.prev')}
            </button>
            <button
              type="button"
              disabled={matches.length === 0}
              onClick={() => navigate(1)}
              className="rounded border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('findReplace.next')} ›
            </button>
          </div>
        </div>
        <button
          type="button"
          disabled={matches.length === 0}
          onClick={replaceAll}
          className="rounded bg-sky-600 px-2 py-1 text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('findReplace.replaceAll')}
        </button>
      </div>
    </aside>
  );
}
