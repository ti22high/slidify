import { useEffect, useRef } from 'react';
import type { Action, EditorState } from '../../store/editorStore';
import { subscribeToDispatch, useEditorStore } from '../../store/editorStore';

export const SNAPSHOT_OP_INTERVAL = 100;
export const SNAPSHOT_TIME_INTERVAL_MS = 5 * 60 * 1000;

/** Generate a per-session doc id until Sprint 5 wires real save / open. */
function newDocId(): string {
  return `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Pipes document-mutating actions to the main process WAL and periodically
 * requests an atomic snapshot. No-ops in environments without `window.slidify`
 * (e.g. unit tests).
 */
export function useAutosaveBridge(): void {
  const docIdRef = useRef<string>(newDocId());

  useEffect(() => {
    if (typeof window === 'undefined' || !window.slidify?.autosaveAppend) return undefined;
    const docId = docIdRef.current;
    let opsSinceSnapshot = 0;
    let lastSnapshot = Date.now();

    const flushSnapshot = (state: EditorState) => {
      opsSinceSnapshot = 0;
      lastSnapshot = Date.now();
      void window.slidify.autosaveSnapshot(docId, state);
    };

    // Seed an initial snapshot once the bridge boots.
    flushSnapshot(useEditorStore.getState());

    const unsubscribe = subscribeToDispatch((action: Action, state: EditorState) => {
      void window.slidify.autosaveAppend(docId, { ts: Date.now(), action });
      opsSinceSnapshot += 1;
      if (
        opsSinceSnapshot >= SNAPSHOT_OP_INTERVAL ||
        Date.now() - lastSnapshot >= SNAPSHOT_TIME_INTERVAL_MS
      ) {
        flushSnapshot(state);
      }
    });

    const onBeforeUnload = () => {
      void window.slidify.autosaveMarkClean(docId);
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);
}
