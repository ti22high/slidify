import { create as mutate } from 'mutative';
import { create as createStore } from 'zustand';
import { SLIDE_HEIGHT_EMU, SLIDE_WIDTH_EMU } from '../../shared/emu';
import { DEFAULT_LAYOUT, type SlideLayout } from '../model/layout';
import { DEFAULT_LAYOUT_ID } from '../model/layout';
import { DEFAULT_MASTER, type SlideMaster } from '../model/master';
import type { Shape, ShapeId, TextBody } from '../model/shape';
import type { Slide, SlideId } from '../model/slide';
import {
  canRedo as canRedoStack,
  canUndo as canUndoStack,
  emptyUndoStack,
  push as pushStack,
  redo as redoStack,
  undo as undoStack,
  type UndoStack,
} from './undoStack';

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;

export interface EditorState {
  masters: SlideMaster[];
  layouts: SlideLayout[];
  slides: Slide[];
  selectedSlideId: SlideId;
  selectedShapeIds: ShapeId[];
  editingShapeId: ShapeId | null;
  zoom: number;
}

export type Action =
  | { type: 'slide/select'; slideId: SlideId }
  | { type: 'slide/add'; afterSlideId?: SlideId }
  | { type: 'slide/delete'; slideId: SlideId }
  | { type: 'slide/duplicate'; slideId: SlideId }
  | { type: 'slide/reorder'; fromIndex: number; toIndex: number }
  | { type: 'zoom/set'; value: number }
  | { type: 'shape/add'; slideId: SlideId; shape: Shape }
  | { type: 'shape/update'; slideId: SlideId; shapeId: ShapeId; patch: Partial<Shape> }
  | { type: 'shape/delete'; slideId: SlideId; shapeIds: ShapeId[] }
  | { type: 'selection/set'; shapeIds: ShapeId[] }
  | { type: 'selection/toggle'; shapeId: ShapeId }
  | { type: 'selection/clear' }
  | { type: 'text/update'; slideId: SlideId; shapeId: ShapeId; patch: Partial<TextBody> }
  | { type: 'text/edit/start'; shapeId: ShapeId }
  | { type: 'text/edit/end' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'state/replace'; state: EditorState };

/**
 * Document-mutating actions are pushed onto the undo stack and emitted to the WAL.
 * UI-state actions (selection, zoom, slide-select, text editing toggles) are not.
 */
export function isDocumentMutating(action: Action): boolean {
  switch (action.type) {
    case 'slide/add':
    case 'slide/delete':
    case 'slide/duplicate':
    case 'slide/reorder':
    case 'shape/add':
    case 'shape/update':
    case 'shape/delete':
    case 'text/update':
      return true;
    default:
      return false;
  }
}

export interface EditorStore extends EditorState {
  history: UndoStack<EditorState>;
  canUndo: boolean;
  canRedo: boolean;
  dispatch: (action: Action) => void;
}

let slideCounter = 0;
let shapeCounter = 0;

export function nextSlideId(): SlideId {
  slideCounter += 1;
  return `slide-${Date.now().toString(36)}-${slideCounter}`;
}

export function nextShapeId(): ShapeId {
  shapeCounter += 1;
  return `shape-${Date.now().toString(36)}-${shapeCounter}`;
}

const INITIAL_SLIDE: Slide = {
  id: 'slide-1',
  name: 'Slide 1',
  layoutId: DEFAULT_LAYOUT_ID,
  shapes: [],
};

export const initialState: EditorState = {
  masters: [DEFAULT_MASTER],
  layouts: [DEFAULT_LAYOUT],
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

function makeEmptySlide(layoutId: string, index: number): Slide {
  return {
    id: nextSlideId(),
    name: `Slide ${index + 1}`,
    layoutId,
    shapes: [],
  };
}

function deepCloneShape(shape: Shape): Shape {
  return {
    ...shape,
    id: nextShapeId(),
    text: shape.text ? { ...shape.text } : undefined,
  };
}

export function reduce(state: EditorState, action: Action): EditorState {
  if (action.type === 'undo' || action.type === 'redo') return state;
  if (action.type === 'state/replace') return action.state;
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
      case 'slide/add': {
        const layoutId = draft.layouts[0]?.id ?? DEFAULT_LAYOUT_ID;
        let insertAt = draft.slides.length;
        if (action.afterSlideId) {
          const idx = draft.slides.findIndex((s) => s.id === action.afterSlideId);
          if (idx >= 0) insertAt = idx + 1;
        }
        const slide = makeEmptySlide(layoutId, insertAt);
        draft.slides.splice(insertAt, 0, slide);
        draft.selectedSlideId = slide.id;
        draft.selectedShapeIds = [];
        draft.editingShapeId = null;
        return;
      }
      case 'slide/delete': {
        if (draft.slides.length <= 1) return;
        const idx = draft.slides.findIndex((s) => s.id === action.slideId);
        if (idx < 0) return;
        draft.slides.splice(idx, 1);
        if (draft.selectedSlideId === action.slideId) {
          const nextIdx = Math.min(idx, draft.slides.length - 1);
          draft.selectedSlideId = draft.slides[nextIdx]!.id;
          draft.selectedShapeIds = [];
          draft.editingShapeId = null;
        }
        return;
      }
      case 'slide/duplicate': {
        const idx = draft.slides.findIndex((s) => s.id === action.slideId);
        if (idx < 0) return;
        const src = draft.slides[idx]!;
        const copy: Slide = {
          id: nextSlideId(),
          name: src.name ? `${src.name} copy` : undefined,
          layoutId: src.layoutId,
          shapes: src.shapes.map(deepCloneShape),
        };
        draft.slides.splice(idx + 1, 0, copy);
        draft.selectedSlideId = copy.id;
        draft.selectedShapeIds = [];
        draft.editingShapeId = null;
        return;
      }
      case 'slide/reorder': {
        const { fromIndex, toIndex } = action;
        if (
          fromIndex < 0 ||
          fromIndex >= draft.slides.length ||
          toIndex < 0 ||
          toIndex >= draft.slides.length ||
          fromIndex === toIndex
        ) {
          return;
        }
        const [moved] = draft.slides.splice(fromIndex, 1);
        if (moved) draft.slides.splice(toIndex, 0, moved);
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

interface DispatchOutcome {
  state: EditorState;
  history: UndoStack<EditorState>;
  /** True iff the dispatch produced a brand-new document mutation (worth WAL-logging). */
  recorded: boolean;
}

/**
 * Pure transition: applies an action and updates the undo stack.
 * The Zustand store wires this into `set`; main-process replay can call it directly.
 */
export function step(
  state: EditorState,
  history: UndoStack<EditorState>,
  action: Action,
): DispatchOutcome {
  if (action.type === 'undo') {
    const popped = undoStack(history, state);
    if (!popped) return { state, history, recorded: false };
    return { state: popped.restored, history: popped.stack, recorded: false };
  }
  if (action.type === 'redo') {
    const popped = redoStack(history, state);
    if (!popped) return { state, history, recorded: false };
    return { state: popped.restored, history: popped.stack, recorded: false };
  }
  if (action.type === 'state/replace') {
    return { state: action.state, history: emptyUndoStack(), recorded: false };
  }
  const next = reduce(state, action);
  if (next === state) return { state, history, recorded: false };
  if (!isDocumentMutating(action)) {
    return { state: next, history, recorded: false };
  }
  return { state: next, history: pushStack(history, state), recorded: true };
}

type DispatchObserver = (action: Action, nextState: EditorState) => void;
const observers: DispatchObserver[] = [];

export function subscribeToDispatch(observer: DispatchObserver): () => void {
  observers.push(observer);
  return () => {
    const idx = observers.indexOf(observer);
    if (idx >= 0) observers.splice(idx, 1);
  };
}

export const useEditorStore = createStore<EditorStore>((set, get) => ({
  ...initialState,
  history: emptyUndoStack(),
  canUndo: false,
  canRedo: false,
  dispatch: (action) => {
    const prev = get();
    const { dispatch: _d, history, canUndo: _u, canRedo: _r, ...currentState } = prev;
    const outcome = step(currentState, history, action);
    const nextSlice = {
      ...outcome.state,
      history: outcome.history,
      canUndo: canUndoStack(outcome.history),
      canRedo: canRedoStack(outcome.history),
    };
    set(nextSlice);
    if (outcome.recorded) {
      for (const obs of observers) obs(action, outcome.state);
    }
  },
}));

/** Default centred shape for the Insert tab. Tables and images use their own factories. */
export function makeShape(kind: 'rect' | 'ellipse' | 'line' | 'arrow'): Shape {
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

export function makeTableShape(rows: number, cols: number): Shape {
  const w = 6 * 914400; // 6 inches
  const h = rows * 600000;
  return {
    id: nextShapeId(),
    kind: 'table',
    x: (SLIDE_WIDTH_EMU - w) / 2,
    y: (SLIDE_HEIGHT_EMU - h) / 2,
    w,
    h,
    rotation: 0,
    fill: '#ffffff',
    stroke: '#0f172a',
    strokeWidth: 9525,
    text: {
      text: '',
      fontFamily: 'Inter',
      fontSize: 14,
      bold: false,
      italic: false,
      color: '#0f172a',
      align: 'left',
    },
    table: {
      rows,
      cols,
      cells: Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ text: '' }))),
    },
  };
}
