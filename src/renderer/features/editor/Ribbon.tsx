const TABS = ['Insert', 'Design', 'Animations', 'Present'] as const;

export function Ribbon(): JSX.Element {
  return (
    <nav
      aria-label="Editor toolbar"
      className="flex h-12 items-center gap-1 border-b border-slate-800 bg-slate-900/80 px-2"
    >
      <div className="px-3 text-sm font-semibold tracking-tight text-slate-200">Slidify</div>
      <div className="mx-2 h-6 w-px bg-slate-800" />
      <ul className="flex items-center gap-1">
        {TABS.map((tab) => (
          <li key={tab}>
            <button
              type="button"
              className="rounded px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
