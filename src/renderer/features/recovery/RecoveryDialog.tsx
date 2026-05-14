import { useEffect, useState } from 'react';
import { useT } from '../../i18n';
import type { Action, EditorState } from '../../store/editorStore';
import { initialState, reduce, useEditorStore } from '../../store/editorStore';
import type { RecoverableSessionInfo } from '../../../shared/ipc';

function replayOps(snapshotState: unknown | null, ops: { action: unknown }[]): EditorState | null {
  let state: EditorState = (snapshotState as EditorState | null) ?? initialState;
  for (const entry of ops) {
    try {
      state = reduce(state, entry.action as Action);
    } catch {
      return null;
    }
  }
  return state;
}

export function RecoveryDialog(): JSX.Element | null {
  const t = useT();
  const [sessions, setSessions] = useState<RecoverableSessionInfo[] | null>(null);
  const dispatch = useEditorStore((s) => s.dispatch);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.slidify?.recoveryScan) return;
    void window.slidify.recoveryScan().then((found) => {
      setSessions(found);
    });
  }, []);

  if (!sessions || sessions.length === 0) return null;

  const restore = async (info: RecoverableSessionInfo) => {
    const payload = await window.slidify.recoveryLoad(info.docId);
    const replayed = replayOps(payload.snapshotState, payload.ops);
    if (replayed) {
      dispatch({ type: 'state/replace', state: replayed });
    }
    await window.slidify.recoveryDiscard(info.docId);
    setSessions((cur) => (cur ?? []).filter((s) => s.docId !== info.docId));
  };

  const discard = async (info: RecoverableSessionInfo) => {
    await window.slidify.recoveryDiscard(info.docId);
    setSessions((cur) => (cur ?? []).filter((s) => s.docId !== info.docId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80">
      <div className="w-[480px] rounded-lg border border-slate-700 bg-slate-900 p-5 text-sm text-slate-200 shadow-2xl">
        <h2 className="text-base font-semibold text-slate-100">{t('recovery.title')}</h2>
        <p className="mt-1 text-xs text-slate-400">{t('recovery.body', { n: sessions.length })}</p>
        <ul className="mt-3 flex flex-col gap-2">
          {sessions.map((s) => (
            <li
              key={s.docId}
              className="flex items-center justify-between gap-2 rounded border border-slate-800 bg-slate-950/40 px-3 py-2"
            >
              <div>
                <div className="font-mono text-xs text-slate-300">{s.docId}</div>
                <div className="text-xs text-slate-500">
                  {t('recovery.ops', { n: s.ops })} · {new Date(s.walMtime).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => void restore(s)}
                  className="rounded bg-sky-600 px-2 py-1 text-xs text-white hover:bg-sky-500"
                >
                  {t('recovery.restore')}
                </button>
                <button
                  type="button"
                  onClick={() => void discard(s)}
                  className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                >
                  {t('recovery.discard')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
