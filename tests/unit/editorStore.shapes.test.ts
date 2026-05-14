import { describe, expect, it } from 'vitest';
import { initialState, reduce } from '../../src/renderer/store/editorStore';
import type { Shape } from '../../src/renderer/model/shape';

const makeRect = (id: string): Shape => ({
  id,
  kind: 'rect',
  x: 100,
  y: 100,
  w: 1000,
  h: 500,
  rotation: 0,
  fill: '#cbd5e1',
  stroke: '#0f172a',
  strokeWidth: 12700,
  text: {
    text: '',
    fontFamily: 'Inter',
    fontSize: 18,
    bold: false,
    italic: false,
    color: '#000',
    align: 'center',
  },
});

const slideId = 'slide-1';

describe('shape/add', () => {
  it('appends the shape to the slide and selects it', () => {
    const s = makeRect('a');
    const next = reduce(initialState, { type: 'shape/add', slideId, shape: s });
    expect(next.slides[0]!.shapes).toEqual([s]);
    expect(next.selectedShapeIds).toEqual(['a']);
  });

  it('is a no-op when the slide id is unknown', () => {
    const next = reduce(initialState, {
      type: 'shape/add',
      slideId: 'ghost',
      shape: makeRect('a'),
    });
    expect(next.slides[0]!.shapes).toEqual([]);
    expect(next.selectedShapeIds).toEqual([]);
  });
});

describe('shape/update', () => {
  it('patches a single shape in place', () => {
    const s = reduce(initialState, { type: 'shape/add', slideId, shape: makeRect('a') });
    const next = reduce(s, {
      type: 'shape/update',
      slideId,
      shapeId: 'a',
      patch: { x: 500, rotation: 45 },
    });
    const updated = next.slides[0]!.shapes.find((sh) => sh.id === 'a')!;
    expect(updated.x).toBe(500);
    expect(updated.rotation).toBe(45);
    // unrelated fields untouched
    expect(updated.w).toBe(1000);
  });
});

describe('shape/delete', () => {
  it('removes shapes and prunes selection + editing', () => {
    let s = reduce(initialState, { type: 'shape/add', slideId, shape: makeRect('a') });
    s = reduce(s, { type: 'shape/add', slideId, shape: makeRect('b') });
    s = reduce(s, { type: 'selection/set', shapeIds: ['a', 'b'] });
    const editing = reduce(s, { type: 'text/edit/start', shapeId: 'a' });
    const next = reduce(
      { ...editing, selectedShapeIds: ['a', 'b'] },
      { type: 'shape/delete', slideId, shapeIds: ['a'] },
    );
    expect(next.slides[0]!.shapes.map((sh) => sh.id)).toEqual(['b']);
    expect(next.selectedShapeIds).toEqual(['b']);
    expect(next.editingShapeId).toBeNull();
  });
});

describe('selection/*', () => {
  it('selection/set replaces and clears editing', () => {
    let s = reduce(initialState, { type: 'shape/add', slideId, shape: makeRect('a') });
    s = reduce(s, { type: 'text/edit/start', shapeId: 'a' });
    const next = reduce(s, { type: 'selection/set', shapeIds: ['a'] });
    expect(next.selectedShapeIds).toEqual(['a']);
    expect(next.editingShapeId).toBeNull();
  });

  it('selection/toggle adds when absent, removes when present', () => {
    let s = reduce(initialState, { type: 'shape/add', slideId, shape: makeRect('a') });
    s = reduce(s, { type: 'shape/add', slideId, shape: makeRect('b') });
    s = reduce(s, { type: 'selection/set', shapeIds: ['a'] });
    s = reduce(s, { type: 'selection/toggle', shapeId: 'b' });
    expect(s.selectedShapeIds).toEqual(['a', 'b']);
    s = reduce(s, { type: 'selection/toggle', shapeId: 'a' });
    expect(s.selectedShapeIds).toEqual(['b']);
  });

  it('selection/clear empties selection and editing', () => {
    let s = reduce(initialState, { type: 'shape/add', slideId, shape: makeRect('a') });
    s = reduce(s, { type: 'text/edit/start', shapeId: 'a' });
    const next = reduce(s, { type: 'selection/clear' });
    expect(next.selectedShapeIds).toEqual([]);
    expect(next.editingShapeId).toBeNull();
  });
});

describe('text/*', () => {
  it('text/update patches the text body', () => {
    let s = reduce(initialState, { type: 'shape/add', slideId, shape: makeRect('a') });
    s = reduce(s, {
      type: 'text/update',
      slideId,
      shapeId: 'a',
      patch: { text: 'Hello', bold: true, align: 'right' },
    });
    const shape = s.slides[0]!.shapes[0]!;
    expect(shape.text?.text).toBe('Hello');
    expect(shape.text?.bold).toBe(true);
    expect(shape.text?.align).toBe('right');
  });

  it('text/edit/start sets editing + selects the shape', () => {
    let s = reduce(initialState, { type: 'shape/add', slideId, shape: makeRect('a') });
    s = reduce(s, { type: 'selection/clear' });
    s = reduce(s, { type: 'text/edit/start', shapeId: 'a' });
    expect(s.editingShapeId).toBe('a');
    expect(s.selectedShapeIds).toEqual(['a']);
  });

  it('text/edit/end clears editing', () => {
    let s = reduce(initialState, { type: 'shape/add', slideId, shape: makeRect('a') });
    s = reduce(s, { type: 'text/edit/start', shapeId: 'a' });
    s = reduce(s, { type: 'text/edit/end' });
    expect(s.editingShapeId).toBeNull();
  });
});

describe('slide/select clears selection and editing', () => {
  it('clears across slide switches', () => {
    const twoSlides = {
      ...initialState,
      slides: [
        { id: 'slide-1', layoutId: 'layout-blank', shapes: [makeRect('a')] },
        { id: 'slide-2', layoutId: 'layout-blank', shapes: [] },
      ],
      selectedShapeIds: ['a'],
      editingShapeId: 'a',
    };
    const next = reduce(twoSlides, { type: 'slide/select', slideId: 'slide-2' });
    expect(next.selectedSlideId).toBe('slide-2');
    expect(next.selectedShapeIds).toEqual([]);
    expect(next.editingShapeId).toBeNull();
  });
});
