/* eslint-disable no-console */
/**
 * Sprint 12 perf script — exercises the editor store with a 50-slide deck.
 * Prints average dispatch latency for shape/add and shape/update.
 *
 * Run via: pnpm exec tsx scripts/perf-50-slide.ts
 */
import { performance } from 'node:perf_hooks';
import { initialState, reduce, step, type EditorState } from '../src/renderer/store/editorStore';
import { emptyUndoStack } from '../src/renderer/store/undoStack';
import type { Shape } from '../src/renderer/model/shape';

function makeRect(id: string, x: number, y: number): Shape {
  return {
    id,
    kind: 'rect',
    x,
    y,
    w: 1000000,
    h: 600000,
    rotation: 0,
    fill: '#0ea5e9',
    stroke: '#0f172a',
    strokeWidth: 12700,
  };
}

function bench<T>(label: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const elapsed = performance.now() - start;
  console.log(`${label.padEnd(40)} ${elapsed.toFixed(1)} ms`);
  return result;
}

let state: EditorState = initialState;
let history = emptyUndoStack<EditorState>();

bench('add 49 slides', () => {
  for (let i = 0; i < 49; i += 1) {
    state = reduce(state, { type: 'slide/add' });
  }
});

bench('add 10 shapes per slide (500 ops)', () => {
  for (const slide of state.slides) {
    for (let i = 0; i < 10; i += 1) {
      const out = step(state, history, {
        type: 'shape/add',
        slideId: slide.id,
        shape: makeRect(`shape-${slide.id}-${i}`, i * 100, i * 80),
      });
      state = out.state;
      history = out.history;
    }
  }
});

bench('translate every shape (500 update dispatches)', () => {
  for (const slide of state.slides) {
    for (const shape of slide.shapes) {
      const out = step(state, history, {
        type: 'shape/update',
        slideId: slide.id,
        shapeId: shape.id,
        patch: { x: shape.x + 10 },
      });
      state = out.state;
      history = out.history;
    }
  }
});

bench('undo 100 steps', () => {
  for (let i = 0; i < 100; i += 1) {
    const out = step(state, history, { type: 'undo' });
    state = out.state;
    history = out.history;
  }
});

console.log(`\nFinal: ${state.slides.length} slides, history.past=${history.past.length}`);
