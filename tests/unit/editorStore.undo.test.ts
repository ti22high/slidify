import { describe, expect, it } from 'vitest';
import { initialState, step } from '../../src/renderer/store/editorStore';
import { emptyUndoStack } from '../../src/renderer/store/undoStack';
import type { Shape } from '../../src/renderer/model/shape';

const makeRect = (id: string): Shape => ({
  id,
  kind: 'rect',
  x: 0,
  y: 0,
  w: 100,
  h: 100,
  rotation: 0,
  fill: '#000',
  stroke: '#000',
  strokeWidth: 1,
});

describe('step (store transition with undo stack)', () => {
  it('records document-mutating actions onto the past stack', () => {
    const out = step(initialState, emptyUndoStack(), {
      type: 'shape/add',
      slideId: initialState.slides[0]!.id,
      shape: makeRect('a'),
    });
    expect(out.recorded).toBe(true);
    expect(out.history.past).toHaveLength(1);
    expect(out.state.slides[0]!.shapes.map((s) => s.id)).toEqual(['a']);
  });

  it('does not record UI-state actions', () => {
    const out = step(initialState, emptyUndoStack(), { type: 'zoom/set', value: 2 });
    expect(out.recorded).toBe(false);
    expect(out.history.past).toHaveLength(0);
  });

  it('undo restores the prior state and pushes current onto future', () => {
    const slideId = initialState.slides[0]!.id;
    const added = step(initialState, emptyUndoStack(), {
      type: 'shape/add',
      slideId,
      shape: makeRect('a'),
    });
    const undone = step(added.state, added.history, { type: 'undo' });
    expect(undone.state.slides[0]!.shapes).toEqual([]);
    expect(undone.history.past).toHaveLength(0);
    expect(undone.history.future).toHaveLength(1);
  });

  it('redo replays the undone state', () => {
    const slideId = initialState.slides[0]!.id;
    const added = step(initialState, emptyUndoStack(), {
      type: 'shape/add',
      slideId,
      shape: makeRect('a'),
    });
    const undone = step(added.state, added.history, { type: 'undo' });
    const redone = step(undone.state, undone.history, { type: 'redo' });
    expect(redone.state.slides[0]!.shapes.map((s) => s.id)).toEqual(['a']);
    expect(redone.history.future).toHaveLength(0);
  });

  it('a new mutation after undo clears the redo branch', () => {
    const slideId = initialState.slides[0]!.id;
    const a = step(initialState, emptyUndoStack(), {
      type: 'shape/add',
      slideId,
      shape: makeRect('a'),
    });
    const b = step(a.state, a.history, {
      type: 'shape/add',
      slideId,
      shape: makeRect('b'),
    });
    const undone = step(b.state, b.history, { type: 'undo' });
    const fork = step(undone.state, undone.history, {
      type: 'shape/add',
      slideId,
      shape: makeRect('c'),
    });
    expect(fork.history.future).toHaveLength(0);
    expect(fork.state.slides[0]!.shapes.map((s) => s.id)).toEqual(['a', 'c']);
  });

  it('undo on an empty past is a no-op', () => {
    const out = step(initialState, emptyUndoStack(), { type: 'undo' });
    expect(out.state).toBe(initialState);
    expect(out.recorded).toBe(false);
  });
});
