import { create as mutate } from 'mutative';
import { create as createStore } from 'zustand';
import { SLIDE_HEIGHT_EMU, SLIDE_WIDTH_EMU } from '../../shared/emu';
import type { Shape, ShapeId, TextBody } from '../model/shape';
import type { Slide, SlideId } from '../model/slide';

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;

export interface EditorState {
  slides: Slide[];
  selectedSlideId: SlideId;
  selectedShapeIds: ShapeId[];
  editingShapeId: ShapeId | null;
  zoom: number;
}

export type Action =
  | { type: 'slide/select'; slideId: SlideId }
  | { type: 'zoom/set'; value: number }
  | { type: 'shape/add'; slideId: SlideId; shape: Shape }
  | { type: 'shape/update'; slideId: SlideId; shapeId: ShapeId; patch: Partial<Shape> }
  | { type: 'shape/delete'; slideId: SlideId; shapeIds: ShapeId[] }
  | { type: 'selection/set'; shapeIds: ShapeId[] }
  | { type: 'selection/toggle'; shapeId: ShapeId }
  | { type: 'selection/clear' }
  | { type: 'text/update'; slideId: SlideId; shapeId: ShapeId; patch: Partial<TextBody> }
  | { type: 'text/edit/start'; shapeId: ShapeId }
  | { type: 'text/edit/end' };

export interface EditorStore extends EditorState {
  dispatch: (action: Action) => void;
}

const INITIAL_SLIDE: Slide = { id: 'slide-1', name: 'Slide 1', shapes: [] };

export const initialState: EditorState = {
  slides: [INITIAL_SLIDE],
  selectedSlideId: INITIAL_SLIDE.id,
  selectedShapeIds: [],
  editingShapeId: null,
  zoom: 1,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const findSlide = (slides: Slide[], id: SlideId): Slide | undefined =>
  slides.find((s) => s.id === id);

export function reduce(state: EditorState, action: Action): EditorState {
  return mutate(state, (draft) => {
    switch (action.type) {
      case 'slide/select': {
        if (draft.slides.some((s) => s.id === action.slideId)) {
          draft.selectedSlideId = action.slideId;
          draft.selectedShapeIds = [];
          draft.editingShapeId = null;
        }
        return;
      }
      case 'zoom/set': {
        if (Number.isFinite(action.value)) {
          draft.zoom = clamp(action.value, MIN_ZOOM, MAX_ZOOM);
        }
        return;
      }
      case 'shape/add': {
        const slide = findSlide(draft.slides, action.slideId);
        if (slide) {
          slide.shapes.push(action.shape);
          draft.selectedShapeIds = [action.shape.id];
          draft.editingShapeId = null;
        }
        return;
      }
      case 'shape/update': {
        const slide = findSlide(draft.slides, action.slideId);
        const shape = slide?.shapes.find((s) => s.id === action.shapeId);
        if (shape) {
          Object.assign(shape, action.patch);
        }
        return;
      }
      case 'shape/delete': {
        const slide = findSlide(draft.slides, action.slideId);
        if (!slide) return;
        const ids = new Set(action.shapeIds);
        slide.shapes = slide.shapes.filter((s) => !ids.has(s.id));
        draft.selectedShapeIds = draft.selectedShapeIds.filter((id) => !ids.has(id));
        if (draft.editingShapeId && ids.has(draft.editingShapeId)) {
          draft.editingShapeId = null;
        }
        return;
      }
      case 'selection/set': {
        draft.selectedShapeIds = [...action.shapeIds];
        draft.editingShapeId = null;
        return;
      }
      case 'selection/toggle': {
        const idx = draft.selectedShapeIds.indexOf(action.shapeId);
        if (idx >= 0) {
          draft.selectedShapeIds.splice(idx, 1);
        } else {
          draft.selectedShapeIds.push(action.shapeId);
        }
        return;
      }
      case 'selection/clear': {
        draft.selectedShapeIds = [];
        draft.editingShapeId = null;
        return;
      }
      case 'text/update': {
        const slide = findSlide(draft.slides, action.slideId);
        const shape = slide?.shapes.find((s) => s.id === action.shapeId);
        if (shape && shape.text) {
          Object.assign(shape.text, action.patch);
        }
        return;
      }
      case 'text/edit/start': {
        draft.editingShapeId = action.shapeId;
        draft.selectedShapeIds = [action.shapeId];
        return;
      }
      case 'text/edit/end': {
        draft.editingShapeId = null;
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

let shapeCounter = 0;
export function nextShapeId(): ShapeId {
  shapeCounter += 1;
  return `shape-${Date.now().toString(36)}-${shapeCounter}`;
}

/** Default centred shape for the Insert tab. */
export function makeShape(kind: Shape['kind']): Shape {
  const w = 3000000;
  const h = kind === 'line' || kind === 'arrow' ? 0 : 1800000;
  const x = (SLIDE_WIDTH_EMU - w) / 2;
  const y = (SLIDE_HEIGHT_EMU - (h || 0)) / 2;
  return {
    id: nextShapeId(),
    kind,
    x,
    y,
    w,
    h: h || 0,
    rotation: 0,
    fill: kind === 'line' || kind === 'arrow' ? 'none' : '#cbd5e1',
    stroke: '#0f172a',
    strokeWidth: 19050,
    text:
      kind === 'rect' || kind === 'ellipse'
        ? {
            text: '',
            fontFamily: 'Inter',
            fontSize: 18,
            bold: false,
            italic: false,
            color: '#0f172a',
            align: 'center',
          }
        : undefined,
  };
}
