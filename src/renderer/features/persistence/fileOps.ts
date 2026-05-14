import { useEffect } from 'react';
import { create as createStore } from 'zustand';
import {
  initialState,
  subscribeToDispatch,
  useEditorStore,
  type EditorState,
} from '../../store/editorStore';
import { listMedia, registerBytes } from '../media/mediaCache';

interface FileStore {
  currentPath: string | null;
  /** Set whenever a document-mutating action runs after the last save / open. */
  dirty: boolean;
  /** Wall-clock ms of the last successful save / open. */
  lastSavedAt: number | null;
  setPath: (p: string | null) => void;
  setDirty: (d: boolean) => void;
  markSaved: () => void;
}

export const useFileStore = createStore<FileStore>((set) => ({
  currentPath: null,
  dirty: false,
  lastSavedAt: null,
  setPath: (p) => set({ currentPath: p }),
  setDirty: (d) => set({ dirty: d }),
  markSaved: () => set({ dirty: false, lastSavedAt: Date.now() }),
}));

function collectMedia(): { mediaRef: string; bytes: ArrayBuffer; mime: string }[] {
  const out: { mediaRef: string; bytes: ArrayBuffer; mime: string }[] = [];
  for (const m of listMedia()) {
    const buf = m.bytes.buffer.slice(m.bytes.byteOffset, m.bytes.byteOffset + m.bytes.byteLength);
    out.push({ mediaRef: m.mediaRef, bytes: buf, mime: m.mime });
  }
  return out;
}

function snapshotState(): EditorState {
  const s = useEditorStore.getState();
  return {
    masters: s.masters,
    layouts: s.layouts,
    slides: s.slides,
    selectedSlideId: s.selectedSlideId,
    selectedShapeIds: [],
    editingShapeId: null,
    zoom: s.zoom,
  };
}

export async function doSave(saveAs: boolean): Promise<void> {
  if (typeof window === 'undefined' || !window.slidify?.saveDoc) return;
  const target = saveAs ? null : useFileStore.getState().currentPath;
  const state = snapshotState();
  const media = collectMedia();
  const res = await window.slidify.saveDoc({ targetPath: target, state, media });
  if (res?.path) {
    useFileStore.getState().setPath(res.path);
    useFileStore.getState().markSaved();
  }
}

export async function doOpen(): Promise<void> {
  if (typeof window === 'undefined' || !window.slidify?.openDoc) return;
  const res = await window.slidify.openDoc();
  if (!res) return;
  applyLoaded(res.path, res.state, res.media);
}

/** Replace the active document with bytes that came from a drag-drop or file picker. */
export function applyLoaded(
  path: string | null,
  state: unknown,
  media: { mediaRef: string; bytes: ArrayBuffer; mime: string }[],
): void {
  for (const m of media) {
    registerBytes(m.mediaRef, new Uint8Array(m.bytes), m.mime);
  }
  useEditorStore.getState().dispatch({ type: 'state/replace', state: state as EditorState });
  useFileStore.getState().setPath(path);
  useFileStore.getState().markSaved();
}

export function doNew(): void {
  useEditorStore.getState().dispatch({ type: 'state/replace', state: initialState });
  useFileStore.getState().setPath(null);
  useFileStore.getState().markSaved();
}

/** Listens to native-menu commands forwarded from the main process. */
export function useFileMenuCommands(): void {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.slidify?.onMenuCommand) return undefined;
    const unsub = window.slidify.onMenuCommand((cmd) => {
      if (cmd === 'new') doNew();
      else if (cmd === 'open') void doOpen();
      else if (cmd === 'save') void doSave(false);
      else if (cmd === 'saveAs') void doSave(true);
    });
    return unsub;
  }, []);
}

/** Mark the document dirty on every WAL-logged dispatch. Mount once in App. */
export function useDirtyTracker(): void {
  useEffect(() => {
    const unsub = subscribeToDispatch(() => {
      if (!useFileStore.getState().dirty) useFileStore.getState().setDirty(true);
    });
    return unsub;
  }, []);
}

export function useCurrentFilePath(): string | null {
  return useFileStore((s) => s.currentPath);
}
