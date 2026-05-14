import { useEffect, useState } from 'react';

export function App(): JSX.Element {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    if (typeof window !== 'undefined' && window.slidify?.getVersion) {
      window.slidify.getVersion().then((v) => {
        if (!cancelled) setVersion(v);
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex h-full w-full items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-3xl font-bold shadow-lg">
          S
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Slidify</h1>
        <p className="text-sm text-slate-400">
          Offline presentation editor
          {version ? ` · v${version}` : ''}
        </p>
      </div>
    </main>
  );
}
