import { useEffect } from 'react';
import { create as createStore } from 'zustand';
import { initialState, useEditorStore, type EditorState } from '../../store/editorStore';
import { listMedia, registerBytes } from '../media/mediaCache';

interface FileStore {
  currentPath: string | null;
  setPath: (p: string | null) => void;
}

const useFileStore = createStore<FileStore>((set) => ({
  currentPath: null,
  setPath: (p) => set({ currentPath: p }),
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
  if (res?.path) useFileStore.getState().setPath(res.path);
}

export async function doOpen(): Promise<void> {
  if (typeof window === 'undefined' || !window.slidify?.openDoc) return;
  const res = await window.slidify.openDoc();
  if (!res) return;
  for (const m of res.media) {
    registerBytes(m.mediaRef, new Uint8Array(m.bytes), m.mime);
  }
  const state = res.state as EditorState;
  useEditorStore.getState().dispatch({ type: 'state/replace', state });
  useFileStore.getState().setPath(res.path);
}

export function doNew(): void {
  useEditorStore.getState().dispatch({ type: 'state/replace', state: initialState });
  useFileStore.getState().setPath(null);
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

export function useCurrentFilePath(): string | null {
  return useFileStore((s) => s.currentPath);
}
