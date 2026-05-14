import { create as mutate } from 'mutative';
import { create as createStore } from 'zustand';
import type { Slide, SlideId } from '../model/slide';

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;

export interface EditorState {
  slides: Slide[];
  selectedSlideId: SlideId;
  zoom: number;
}

export type Action =
  | { type: 'slide/select'; slideId: SlideId }
  | { type: 'zoom/set'; value: number };

export interface EditorStore extends EditorState {
  dispatch: (action: Action) => void;
}

const INITIAL_SLIDE: Slide = { id: 'slide-1', name: 'Slide 1' };

export const initialState: EditorState = {
  slides: [INITIAL_SLIDE],
  selectedSlideId: INITIAL_SLIDE.id,
  zoom: 1,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export function reduce(state: EditorState, action: Action): EditorState {
  return mutate(state, (draft) => {
    switch (action.type) {
      case 'slide/select': {
        if (draft.slides.some((s) => s.id === action.slideId)) {
          draft.selectedSlideId = action.slideId;
        }
        return;
      }
      case 'zoom/set': {
        if (Number.isFinite(action.value)) {
          draft.zoom = clamp(action.value, MIN_ZOOM, MAX_ZOOM);
        }
        return;
      }
    }
  });
}

export const useEditorStore = createStore<EditorStore>((set) => ({
  ...initialState,
  dispatch: (action) =>
    set((state) => {
      const { dispatch: _dispatch, ...current } = state;
      return reduce(current, action);
    }),
}));
