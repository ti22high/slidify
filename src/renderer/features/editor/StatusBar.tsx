import { useT } from '../../i18n';
import { useFileStore } from '../persistence/fileOps';
import { MAX_ZOOM, MIN_ZOOM, useEditorStore } from '../../store/editorStore';

function basename(p: string): string {
  const slash = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
  return slash >= 0 ? p.slice(slash + 1) : p;
}

export function StatusBar(): JSX.Element {
  const t = useT();
  const slides = useEditorStore((s) => s.slides);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const zoom = useEditorStore((s) => s.zoom);
  const dispatch = useEditorStore((s) => s.dispatch);
  const currentPath = useFileStore((s) => s.currentPath);
  const dirty = useFileStore((s) => s.dirty);
  const lastSavedAt = useFileStore((s) => s.lastSavedAt);

  const currentIndex = Math.max(
    0,
    slides.findIndex((s) => s.id === selectedSlideId),
  );

  const fileLabel = currentPath ? basename(currentPath) : t('status.fileUntitled');
  const savedAtLabel = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <footer className="flex h-8 items-center justify-between border-t border-slate-800 bg-slate-900/80 px-3 text-xs text-slate-400">
      <div className="flex items-center gap-3">
        <span>{t('status.slideOf', { n: currentIndex + 1, total: slides.length })}</span>
        <span className="text-slate-500">·</span>
        <span title={currentPath ?? ''} className="max-w-[280px] truncate">
          {fileLabel}
          {dirty ? ' •' : ''}
        </span>
        <span className={`text-[10px] ${dirty ? 'text-amber-400' : 'text-slate-500'}`}>
          {dirty ? t('status.unsaved') : t('status.saved', { time: savedAtLabel })}
        </span>
      </div>
      <label className="flex items-center gap-2">
        <span className="text-slate-500">{t('status.zoom')}</span>
        <input
          type="range"
          min={MIN_ZOOM * 100}
          max={MAX_ZOOM * 100}
          step={5}
          value={Math.round(zoom * 100)}
          onChange={(e) => dispatch({ type: 'zoom/set', value: Number(e.target.value) / 100 })}
          className="h-1 w-32 cursor-pointer"
          aria-label="Zoom"
        />
        <span className="w-10 text-right tabular-nums">{Math.round(zoom * 100)}%</span>
      </label>
    </footer>
  );
}
