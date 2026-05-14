import { create as createStore } from 'zustand';

interface UiStore {
  /** When non-null, the app renders PlayerView instead of EditorLayout. */
  presenting: null | { mode: 'fullscreen' | 'presenter' };
  startPresenting: (mode: 'fullscreen' | 'presenter') => void;
  stopPresenting: () => void;
}

export const useUiStore = createStore<UiStore>((set) => ({
  presenting: null,
  startPresenting: (mode) => set({ presenting: { mode } }),
  stopPresenting: () => set({ presenting: null }),
}));
