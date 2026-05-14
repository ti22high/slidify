import { describe, expect, it } from 'vitest';
import {
  initialState,
  MAX_ZOOM,
  MIN_ZOOM,
  reduce,
  useEditorStore,
} from '../../src/renderer/store/editorStore';

describe('editorStore — reduce', () => {
  it('seeds one slide selected at zoom 1', () => {
    expect(initialState.slides).toHaveLength(1);
    expect(initialState.selectedSlideId).toBe(initialState.slides[0]!.id);
    expect(initialState.zoom).toBe(1);
  });

  it('slide/select switches the selected slide when the id exists', () => {
    const state = {
      ...initialState,
      slides: [{ id: 'slide-1' }, { id: 'slide-2' }],
    };
    const next = reduce(state, { type: 'slide/select', slideId: 'slide-2' });
    expect(next.selectedSlideId).toBe('slide-2');
  });

  it('slide/select is a no-op for unknown ids', () => {
    const next = reduce(initialState, { type: 'slide/select', slideId: 'ghost' });
    expect(next.selectedSlideId).toBe(initialState.selectedSlideId);
  });

  it('zoom/set updates zoom within bounds', () => {
    const next = reduce(initialState, { type: 'zoom/set', value: 1.5 });
    expect(next.zoom).toBe(1.5);
  });

  it('zoom/set clamps below MIN_ZOOM', () => {
    const next = reduce(initialState, { type: 'zoom/set', value: 0.01 });
    expect(next.zoom).toBe(MIN_ZOOM);
  });

  it('zoom/set clamps above MAX_ZOOM', () => {
    const next = reduce(initialState, { type: 'zoom/set', value: 10 });
    expect(next.zoom).toBe(MAX_ZOOM);
  });

  it('zoom/set ignores non-finite values', () => {
    const next = reduce(initialState, { type: 'zoom/set', value: Number.NaN });
    expect(next.zoom).toBe(initialState.zoom);
  });

  it('reduce returns a new state reference on mutation', () => {
    const next = reduce(initialState, { type: 'zoom/set', value: 2 });
    expect(next).not.toBe(initialState);
  });
});

describe('editorStore — Zustand binding', () => {
  it('dispatch routes actions through reduce and preserves itself on state', () => {
    const before = useEditorStore.getState();
    before.dispatch({ type: 'zoom/set', value: 2 });
    const after = useEditorStore.getState();

    expect(after.zoom).toBe(2);
    expect(after.dispatch).toBe(before.dispatch);

    after.dispatch({ type: 'zoom/set', value: 1 });
    expect(useEditorStore.getState().zoom).toBe(1);
  });
});
