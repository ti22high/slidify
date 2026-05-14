import { describe, expect, it } from 'vitest';
import {
  canRedo,
  canUndo,
  emptyUndoStack,
  push,
  redo,
  undo,
  UNDO_STACK_CAP,
} from '../../src/renderer/store/undoStack';

describe('undoStack', () => {
  it('starts empty', () => {
    const s = emptyUndoStack<number>();
    expect(canUndo(s)).toBe(false);
    expect(canRedo(s)).toBe(false);
  });

  it('push appends and clears the redo stack', () => {
    let s = emptyUndoStack<number>();
    s = push(s, 1);
    s = push(s, 2);
    expect(s.past).toEqual([1, 2]);
    s = redo(s, 2)?.stack ?? s; // no-op, future is empty
    expect(s.future).toEqual([]);
  });

  it('undo pops the most recent past entry', () => {
    let s = emptyUndoStack<number>();
    s = push(s, 1);
    s = push(s, 2);
    const r = undo(s, 3);
    expect(r).not.toBeNull();
    expect(r!.restored).toBe(2);
    expect(r!.stack.past).toEqual([1]);
    expect(r!.stack.future).toEqual([3]);
  });

  it('redo replays from future', () => {
    let s = emptyUndoStack<number>();
    s = push(s, 1);
    const u = undo(s, 2)!;
    const r = redo(u.stack, u.restored)!;
    expect(r.restored).toBe(2);
    expect(r.stack.past).toEqual([1]);
    expect(r.stack.future).toEqual([]);
  });

  it('pushing after an undo clears the future', () => {
    let s = emptyUndoStack<number>();
    s = push(s, 1);
    const u = undo(s, 2)!;
    // After undo: past=[], future=[2]. Push a new "current" state, simulating
    // a fresh mutation that should fork off the redo branch.
    const next = push(u.stack, 99);
    expect(next.past).toEqual([99]);
    expect(next.future).toEqual([]);
  });

  it(`caps the past stack at UNDO_STACK_CAP (${UNDO_STACK_CAP})`, () => {
    let s = emptyUndoStack<number>();
    for (let i = 0; i < UNDO_STACK_CAP + 50; i += 1) s = push(s, i);
    expect(s.past).toHaveLength(UNDO_STACK_CAP);
    expect(s.past[0]).toBe(50);
    expect(s.past[s.past.length - 1]).toBe(UNDO_STACK_CAP + 49);
  });

  it('undo on empty returns null', () => {
    expect(undo(emptyUndoStack<number>(), 0)).toBeNull();
  });

  it('redo on empty returns null', () => {
    expect(redo(emptyUndoStack<number>(), 0)).toBeNull();
  });
});
