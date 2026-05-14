export const UNDO_STACK_CAP = 200;

export interface UndoStack<T> {
  past: T[];
  future: T[];
}

export const emptyUndoStack = <T>(): UndoStack<T> => ({ past: [], future: [] });

/**
 * Push the previous state onto `past`, capped at UNDO_STACK_CAP entries.
 * Pushing a new state always clears the redo (`future`) stack.
 */
export function push<T>(stack: UndoStack<T>, prev: T): UndoStack<T> {
  const past =
    stack.past.length >= UNDO_STACK_CAP
      ? [...stack.past.slice(stack.past.length - UNDO_STACK_CAP + 1), prev]
      : [...stack.past, prev];
  return { past, future: [] };
}

export function canUndo<T>(stack: UndoStack<T>): boolean {
  return stack.past.length > 0;
}

export function canRedo<T>(stack: UndoStack<T>): boolean {
  return stack.future.length > 0;
}

/** Pop the most recent past state; the caller passes the current state which becomes the head of `future`. */
export function undo<T>(
  stack: UndoStack<T>,
  current: T,
): { stack: UndoStack<T>; restored: T } | null {
  if (stack.past.length === 0) return null;
  const restored = stack.past[stack.past.length - 1]!;
  return {
    stack: {
      past: stack.past.slice(0, -1),
      future: [...stack.future, current],
    },
    restored,
  };
}

export function redo<T>(
  stack: UndoStack<T>,
  current: T,
): { stack: UndoStack<T>; restored: T } | null {
  if (stack.future.length === 0) return null;
  const restored = stack.future[stack.future.length - 1]!;
  return {
    stack: {
      past: [...stack.past, current],
      future: stack.future.slice(0, -1),
    },
    restored,
  };
}
