export function Inspector(): JSX.Element {
  return (
    <aside
      aria-label="Inspector"
      className="flex h-full w-[280px] flex-col border-l border-slate-800 bg-slate-900/60"
    >
      <header className="h-9 border-b border-slate-800 px-3 text-xs font-semibold uppercase tracking-wider leading-9 text-slate-400">
        Inspector
      </header>
      <div className="flex-1 p-3 text-xs text-slate-500">
        Select something on the slide to edit its properties.
      </div>
    </aside>
  );
}
