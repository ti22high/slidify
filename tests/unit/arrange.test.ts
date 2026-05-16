import { describe, expect, it } from 'vitest';
import {
  alignShapes,
  boundingBox,
  distributeShapes,
  rotateByDegrees,
} from '../../src/renderer/features/arrange/arrange';
import type { Shape } from '../../src/renderer/model/shape';
import { initialState, reduce } from '../../src/renderer/store/editorStore';

const mk = (id: string, x: number, y: number, w = 100, h = 100): Shape => ({
  id,
  kind: 'rect',
  x,
  y,
  w,
  h,
  rotation: 0,
  fill: '#fff',
  stroke: '#000',
  strokeWidth: 12700,
});

describe('boundingBox', () => {
  it('returns the union rect of all shape bboxes', () => {
    const bb = boundingBox([mk('a', 0, 0, 100, 100), mk('b', 50, 200, 50, 50)]);
    expect(bb).toEqual({ x: 0, y: 0, w: 100, h: 250 });
  });

  it('returns zero rect for empty input', () => {
    expect(boundingBox([])).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });
});

describe('alignShapes', () => {
  it('aligns left edges to the leftmost x', () => {
    const out = alignShapes([mk('a', 0, 0), mk('b', 50, 0), mk('c', 100, 0)], 'left');
    expect(out.map((p) => p.patch.x)).toEqual([0, 0, 0]);
    expect(out.map((p) => p.patch.y)).toEqual([0, 0, 0]);
  });

  it('aligns right edges to the rightmost x+w', () => {
    const out = alignShapes(
      [mk('a', 0, 0, 100, 100), mk('b', 50, 0, 50, 100), mk('c', 200, 0, 80, 100)],
      'right',
    );
    expect(out[0]!.patch.x).toBe(180);
    expect(out[1]!.patch.x).toBe(230);
    expect(out[2]!.patch.x).toBe(200);
  });

  it('centers horizontally on the bounding-box midline', () => {
    const out = alignShapes([mk('a', 0, 0, 100, 100), mk('b', 0, 200, 200, 100)], 'centerH');
    expect(out[0]!.patch.x).toBe(50);
    expect(out[1]!.patch.x).toBe(0);
  });

  it('aligns bottom edges', () => {
    const out = alignShapes([mk('a', 0, 0, 100, 100), mk('b', 0, 50, 100, 100)], 'bottom');
    expect(out[0]!.patch.y).toBe(50);
    expect(out[1]!.patch.y).toBe(50);
  });

  it('returns empty when fewer than 2 shapes', () => {
    expect(alignShapes([mk('a', 0, 0)], 'left')).toEqual([]);
  });
});

describe('distributeShapes', () => {
  it('places inner shapes with equal gaps horizontally', () => {
    // First at 0..100, last at 400..500, with two more of width 100 in between.
    // Total inner-shape width = 400, span 500, gap = (500-400)/3 ≈ 33.33.
    const out = distributeShapes(
      [mk('a', 0, 0), mk('b', 200, 0), mk('c', 250, 0), mk('d', 400, 0)],
      'horizontal',
    );
    const xs = out.map((p) => p.patch.x);
    expect(xs[0]).toBe(0);
    expect(xs[xs.length - 1]).toBe(400);
    // Even gaps between consecutive shapes.
    const gaps = [xs[1]! - (xs[0]! + 100), xs[2]! - (xs[1]! + 100), xs[3]! - (xs[2]! + 100)];
    expect(gaps[0]).toBeCloseTo(gaps[1]!);
    expect(gaps[1]).toBeCloseTo(gaps[2]!);
  });

  it('returns empty when fewer than 3 shapes', () => {
    expect(distributeShapes([mk('a', 0, 0), mk('b', 10, 0)], 'horizontal')).toEqual([]);
  });
});

describe('rotateByDegrees', () => {
  it('adds delta and wraps within (-360, 360)', () => {
    const out = rotateByDegrees(
      [
        { ...mk('a', 0, 0), rotation: 350 },
        { ...mk('b', 0, 0), rotation: -45 },
      ],
      90,
    );
    expect(out[0]!.rotation).toBe(80); // 440 % 360 = 80
    expect(out[1]!.rotation).toBe(45);
  });

  it('normalises a 360° wrap to 0', () => {
    const out = rotateByDegrees([{ ...mk('a', 0, 0), rotation: 270 }], 90);
    expect(out[0]!.rotation).toBe(0);
  });
});

describe('editorStore arrange actions', () => {
  function withTwoShapes() {
    const slideId = initialState.selectedSlideId;
    let state = initialState;
    state = reduce(state, {
      type: 'shape/add',
      slideId,
      shape: mk('a', 0, 0, 100, 100),
    });
    state = reduce(state, {
      type: 'shape/add',
      slideId,
      shape: mk('b', 200, 50, 100, 100),
    });
    state = reduce(state, { type: 'selection/set', shapeIds: ['a', 'b'] });
    return { state, slideId };
  }

  it('arrange/align top moves both to minY', () => {
    const { state, slideId } = withTwoShapes();
    const next = reduce(state, {
      type: 'arrange/align',
      slideId,
      shapeIds: ['a', 'b'],
      mode: 'top',
    });
    const shapes = next.slides.find((s) => s.id === slideId)!.shapes;
    expect(shapes[0]!.y).toBe(0);
    expect(shapes[1]!.y).toBe(0);
  });

  it('arrange/distribute horizontal evens spacing', () => {
    const slideId = initialState.selectedSlideId;
    let state = initialState;
    state = reduce(state, { type: 'shape/add', slideId, shape: mk('a', 0, 0) });
    state = reduce(state, { type: 'shape/add', slideId, shape: mk('b', 150, 0) });
    state = reduce(state, { type: 'shape/add', slideId, shape: mk('c', 400, 0) });
    const next = reduce(state, {
      type: 'arrange/distribute',
      slideId,
      shapeIds: ['a', 'b', 'c'],
      mode: 'horizontal',
    });
    const shapes = next.slides.find((s) => s.id === slideId)!.shapes;
    const [a, b, c] = shapes;
    const g1 = b!.x - (a!.x + a!.w);
    const g2 = c!.x - (b!.x + b!.w);
    expect(g1).toBeCloseTo(g2);
  });

  it('arrange/rotateBy bumps rotation for all selected shapes', () => {
    const { state, slideId } = withTwoShapes();
    const next = reduce(state, {
      type: 'arrange/rotateBy',
      slideId,
      shapeIds: ['a', 'b'],
      delta: 90,
    });
    const shapes = next.slides.find((s) => s.id === slideId)!.shapes;
    expect(shapes[0]!.rotation).toBe(90);
    expect(shapes[1]!.rotation).toBe(90);
  });
});
