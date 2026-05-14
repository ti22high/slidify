import { describe, expect, it } from 'vitest';
import { initialState, reduce } from '../../src/renderer/store/editorStore';
import type { Shape } from '../../src/renderer/model/shape';

const makeRect = (id: string): Shape => ({
  id,
  kind: 'rect',
  x: 0,
  y: 0,
  w: 100,
  h: 100,
  rotation: 0,
  fill: '#cbd5e1',
  stroke: '#0f172a',
  strokeWidth: 12700,
});

describe('slide/add', () => {
  it('appends a new slide at the end by default', () => {
    const next = reduce(initialState, { type: 'slide/add' });
    expect(next.slides).toHaveLength(2);
    expect(next.selectedSlideId).toBe(next.slides[1]!.id);
    expect(next.slides[1]!.layoutId).toBe(initialState.layouts[0]!.id);
  });

  it('inserts after the given slide id', () => {
    const seed = reduce(initialState, { type: 'slide/add' });
    const next = reduce(seed, {
      type: 'slide/add',
      afterSlideId: seed.slides[0]!.id,
    });
    expect(next.slides).toHaveLength(3);
    expect(next.slides[1]!.id).toBe(next.selectedSlideId);
    expect(next.slides[1]!.id).not.toBe(seed.slides[0]!.id);
  });
});

describe('slide/delete', () => {
  it('removes the slide and selects a neighbour', () => {
    const a = reduce(initialState, { type: 'slide/add' });
    const b = reduce(a, { type: 'slide/add' });
    const before = b.slides.map((s) => s.id);
    const target = before[1]!;
    const next = reduce(
      { ...b, selectedSlideId: target },
      { type: 'slide/delete', slideId: target },
    );
    expect(next.slides.map((s) => s.id)).toEqual([before[0], before[2]]);
    expect(next.selectedSlideId).toBe(before[2]);
  });

  it('refuses to delete the last remaining slide', () => {
    const next = reduce(initialState, {
      type: 'slide/delete',
      slideId: initialState.slides[0]!.id,
    });
    expect(next.slides).toHaveLength(1);
    expect(next.selectedSlideId).toBe(initialState.slides[0]!.id);
  });
});

describe('slide/duplicate', () => {
  it('inserts a deep copy after the source and reassigns shape ids', () => {
    const src = reduce(initialState, {
      type: 'shape/add',
      slideId: initialState.slides[0]!.id,
      shape: makeRect('orig'),
    });
    const next = reduce(src, { type: 'slide/duplicate', slideId: src.slides[0]!.id });
    expect(next.slides).toHaveLength(2);
    expect(next.selectedSlideId).toBe(next.slides[1]!.id);
    const original = next.slides[0]!.shapes[0]!;
    const dup = next.slides[1]!.shapes[0]!;
    expect(dup.id).not.toBe(original.id);
    expect(dup.kind).toBe(original.kind);
    expect(dup.fill).toBe(original.fill);
    // mutating duplicate must not touch the original
    dup.fill = '#ff0000';
    expect(next.slides[0]!.shapes[0]!.fill).toBe(original.fill);
  });
});

describe('slide/reorder', () => {
  it('moves a slide to a new index', () => {
    let s = reduce(initialState, { type: 'slide/add' });
    s = reduce(s, { type: 'slide/add' });
    const ids = s.slides.map((sl) => sl.id);
    const next = reduce(s, { type: 'slide/reorder', fromIndex: 0, toIndex: 2 });
    expect(next.slides.map((sl) => sl.id)).toEqual([ids[1], ids[2], ids[0]]);
  });

  it('is a no-op for out-of-range indices', () => {
    const next = reduce(initialState, { type: 'slide/reorder', fromIndex: 5, toIndex: 0 });
    expect(next.slides.map((s) => s.id)).toEqual(initialState.slides.map((s) => s.id));
  });

  it('is a no-op when fromIndex === toIndex', () => {
    let s = reduce(initialState, { type: 'slide/add' });
    const before = s.slides.map((sl) => sl.id);
    s = reduce(s, { type: 'slide/reorder', fromIndex: 1, toIndex: 1 });
    expect(s.slides.map((sl) => sl.id)).toEqual(before);
  });
});
