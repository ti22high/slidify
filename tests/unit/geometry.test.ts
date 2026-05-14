import { describe, expect, it } from 'vitest';
import {
  rectContains,
  rectIntersects,
  resizeRect,
  rotatePoint,
  rotatedBounds,
  shapesInMarquee,
  type Rect,
} from '../../src/renderer/features/canvas/geometry';

const base: Rect = { x: 100, y: 100, w: 200, h: 100 };

describe('resizeRect', () => {
  it('se grows width + height by (dx, dy)', () => {
    expect(resizeRect(base, 'se', 50, 30)).toEqual({ x: 100, y: 100, w: 250, h: 130 });
  });
  it('e grows width only', () => {
    expect(resizeRect(base, 'e', 50, 9999)).toEqual({ x: 100, y: 100, w: 250, h: 100 });
  });
  it('s grows height only', () => {
    expect(resizeRect(base, 's', 9999, 30)).toEqual({ x: 100, y: 100, w: 200, h: 130 });
  });
  it('nw moves the origin and shrinks both axes', () => {
    expect(resizeRect(base, 'nw', 20, 10)).toEqual({ x: 120, y: 110, w: 180, h: 90 });
  });
  it('w moves x and shrinks width', () => {
    expect(resizeRect(base, 'w', 30, 9999)).toEqual({ x: 130, y: 100, w: 170, h: 100 });
  });
  it('n moves y and shrinks height', () => {
    expect(resizeRect(base, 'n', 9999, 40)).toEqual({ x: 100, y: 140, w: 200, h: 60 });
  });
  it('ne grows width, moves y, shrinks height', () => {
    expect(resizeRect(base, 'ne', 50, 30)).toEqual({ x: 100, y: 130, w: 250, h: 70 });
  });
  it('sw moves x, shrinks width, grows height', () => {
    expect(resizeRect(base, 'sw', 20, 30)).toEqual({ x: 120, y: 100, w: 180, h: 130 });
  });

  it('clamps width to minimum when dragging w past the right edge', () => {
    const r = resizeRect(base, 'w', 500, 0, { minSize: 5 });
    expect(r.w).toBe(5);
    expect(r.x).toBe(base.x + base.w - 5);
  });

  it('clamps height to minimum when dragging s upward', () => {
    const r = resizeRect(base, 's', 0, -500, { minSize: 5 });
    expect(r.h).toBe(5);
  });

  it('lockAspect with se keeps the original aspect ratio', () => {
    // aspect = 2:1; widening by 100 → height should grow by 50
    const r = resizeRect(base, 'se', 100, 0, { lockAspect: true });
    expect(r.w).toBe(300);
    expect(r.h).toBeCloseTo(150);
    expect(r.x).toBe(100);
    expect(r.y).toBe(100);
  });

  it('lockAspect with nw anchors on the opposite corner', () => {
    const r = resizeRect(base, 'nw', -100, 0, { lockAspect: true });
    expect(r.w).toBe(300);
    expect(r.h).toBeCloseTo(150);
    // bottom-right stays at (300, 200)
    expect(r.x + r.w).toBe(300);
    expect(r.y + r.h).toBeCloseTo(200);
  });
});

describe('rotatePoint / rotatedBounds', () => {
  it('rotates 90deg around origin', () => {
    const p = rotatePoint({ x: 1, y: 0 }, { x: 0, y: 0 }, 90);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(1);
  });
  it('rotatedBounds is identity for 0deg', () => {
    expect(rotatedBounds(base, 0)).toEqual(base);
  });
  it('rotatedBounds for 90deg swaps width and height', () => {
    const r = rotatedBounds(base, 90);
    expect(r.w).toBeCloseTo(100);
    expect(r.h).toBeCloseTo(200);
  });
});

describe('rectContains / rectIntersects / shapesInMarquee', () => {
  it('rectContains is true when inner sits fully inside', () => {
    expect(rectContains({ x: 0, y: 0, w: 100, h: 100 }, { x: 10, y: 10, w: 50, h: 50 })).toBe(true);
  });
  it('rectContains is false when inner pokes out', () => {
    expect(rectContains({ x: 0, y: 0, w: 100, h: 100 }, { x: 60, y: 60, w: 50, h: 50 })).toBe(
      false,
    );
  });
  it('rectIntersects detects overlap', () => {
    expect(rectIntersects({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(rectIntersects({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 20, w: 5, h: 5 })).toBe(false);
  });
  it('shapesInMarquee returns only fully enclosed shapes', () => {
    const shapes = [
      { id: 'a', x: 10, y: 10, w: 20, h: 20 },
      { id: 'b', x: 80, y: 10, w: 20, h: 20 },
      { id: 'c', x: 25, y: 25, w: 5, h: 5 },
    ];
    expect(shapesInMarquee(shapes, { x: 0, y: 0, w: 50, h: 50 })).toEqual(['a', 'c']);
  });
});
