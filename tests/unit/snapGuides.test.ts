import { describe, expect, it } from 'vitest';
import {
  collectGuideLines,
  combinedBbox,
  snapDelta,
} from '../../src/renderer/features/canvas/snapGuides';
import type { Shape } from '../../src/renderer/model/shape';

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

const SLIDE = { w: 1000, h: 700 };

describe('collectGuideLines', () => {
  it('emits slide edges + centre + each other-shape edges + centre', () => {
    const lines = collectGuideLines([mk('a', 100, 200, 50, 50)], SLIDE);
    expect(lines.x).toEqual([0, 500, 1000, 100, 125, 150]);
    expect(lines.y).toEqual([0, 350, 700, 200, 225, 250]);
  });

  it('with no others returns only slide lines', () => {
    const lines = collectGuideLines([], SLIDE);
    expect(lines.x).toEqual([0, 500, 1000]);
    expect(lines.y).toEqual([0, 350, 700]);
  });
});

describe('snapDelta', () => {
  it('returns raw delta when nothing is within threshold', () => {
    const out = snapDelta(
      { x: 100, y: 100, w: 50, h: 50 },
      { x: 30, y: 30 },
      { x: [0, 500, 1000], y: [0, 350, 700] },
      4,
    );
    expect(out.delta).toEqual({ x: 30, y: 30 });
    expect(out.guides.vertical).toEqual([]);
    expect(out.guides.horizontal).toEqual([]);
  });

  it('snaps the left edge when within threshold of a vertical line', () => {
    // moved.x = 100 + 33 = 133; nearest line 130; threshold 5 → snap +(-3) = +30
    const out = snapDelta({ x: 100, y: 0, w: 50, h: 50 }, { x: 33, y: 0 }, { x: [130], y: [] }, 5);
    expect(out.delta.x).toBe(30);
    expect(out.guides.vertical).toEqual([130]);
  });

  it('snaps the centre to the slide centre', () => {
    // bbox 200×100 starting at (0,0); centre starts at x=100. With raw dx=395 the
    // centre lands at 495 — within 6 of slide centre (500) → snap +5.
    const out = snapDelta(
      { x: 0, y: 0, w: 200, h: 100 },
      { x: 395, y: 0 },
      { x: [0, 500, 1000], y: [] },
      6,
    );
    expect(out.delta.x).toBe(400);
    expect(out.guides.vertical).toEqual([500]);
  });

  it('snaps right edge to right slide boundary', () => {
    const out = snapDelta(
      { x: 700, y: 0, w: 100, h: 100 },
      { x: 197, y: 0 },
      { x: [1000], y: [] },
      5,
    );
    // moved.right = 800 + 197 = 997; snap +3 → 1000.
    expect(out.delta.x).toBe(200);
    expect(out.guides.vertical).toEqual([1000]);
  });

  it('snaps both axes simultaneously', () => {
    const out = snapDelta(
      { x: 100, y: 100, w: 50, h: 50 },
      { x: 2, y: 3 },
      { x: [100], y: [100] },
      5,
    );
    expect(out.delta).toEqual({ x: 0, y: 0 });
    expect(out.guides.vertical).toEqual([100]);
    expect(out.guides.horizontal).toEqual([100]);
  });
});

describe('combinedBbox', () => {
  it('unions the rects', () => {
    expect(combinedBbox([mk('a', 0, 0, 100, 100), mk('b', 200, 50, 50, 200)])).toEqual({
      x: 0,
      y: 0,
      w: 250,
      h: 250,
    });
  });

  it('empty input returns zero rect', () => {
    expect(combinedBbox([])).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });
});
