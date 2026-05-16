import type { Shape } from '../../model/shape';

export type AlignMode = 'left' | 'centerH' | 'right' | 'top' | 'middleV' | 'bottom';
export type DistributeMode = 'horizontal' | 'vertical';

interface XY {
  x: number;
  y: number;
}

/**
 * Pure geometry helpers for the Arrange menu. Each function returns a list of
 * `{ id, x, y }` patches; the caller dispatches them as a single batched
 * action so the operation is one undo step.
 *
 * All math operates on the axis-aligned bounding box (`x, y, w, h`); rotation
 * is preserved verbatim. This matches Google Slides / PowerPoint behaviour
 * where Align uses the un-rotated bbox.
 */
export function alignShapes(shapes: Shape[], mode: AlignMode): { id: string; patch: XY }[] {
  if (shapes.length < 2) return [];
  const bbox = boundingBox(shapes);
  return shapes.map((s) => {
    const patch: XY = { x: s.x, y: s.y };
    switch (mode) {
      case 'left':
        patch.x = bbox.x;
        break;
      case 'centerH':
        patch.x = bbox.x + (bbox.w - s.w) / 2;
        break;
      case 'right':
        patch.x = bbox.x + bbox.w - s.w;
        break;
      case 'top':
        patch.y = bbox.y;
        break;
      case 'middleV':
        patch.y = bbox.y + (bbox.h - s.h) / 2;
        break;
      case 'bottom':
        patch.y = bbox.y + bbox.h - s.h;
        break;
    }
    return { id: s.id, patch };
  });
}

/**
 * Spread the inner shapes (excluding the two extremes) so that the gap
 * between consecutive shapes is equal. Edge shapes stay put. Requires
 * at least 3 shapes — otherwise there's nothing to distribute.
 */
export function distributeShapes(
  shapes: Shape[],
  mode: DistributeMode,
): { id: string; patch: XY }[] {
  if (shapes.length < 3) return [];
  const axis = mode === 'horizontal' ? 'x' : 'y';
  const size = mode === 'horizontal' ? 'w' : 'h';
  const sorted = [...shapes].sort((a, b) => a[axis] - b[axis]);
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const span = last[axis] + last[size] - first[axis];
  const totalSize = sorted.reduce((sum, s) => sum + s[size], 0);
  const totalGap = span - totalSize;
  const gap = totalGap / (sorted.length - 1);
  let cursor = first[axis];
  return sorted.map((s) => {
    const patch: XY = { x: s.x, y: s.y };
    patch[axis] = cursor;
    cursor += s[size] + gap;
    return { id: s.id, patch };
  });
}

/** Rotate each shape in place by `delta` degrees. */
export function rotateByDegrees(
  shapes: Shape[],
  delta: number,
): { id: string; rotation: number }[] {
  return shapes.map((s) => ({
    id: s.id,
    rotation: normalizeAngle(s.rotation + delta),
  }));
}

export type FlipAxis = 'h' | 'v';

/** Toggle flipH or flipV on each shape. */
export function flipShapes(
  shapes: Shape[],
  axis: FlipAxis,
): { id: string; flipH?: boolean; flipV?: boolean }[] {
  return shapes.map((s) =>
    axis === 'h' ? { id: s.id, flipH: !s.flipH } : { id: s.id, flipV: !s.flipV },
  );
}

export function boundingBox(shapes: Shape[]): { x: number; y: number; w: number; h: number } {
  if (shapes.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of shapes) {
    if (s.x < minX) minX = s.x;
    if (s.y < minY) minY = s.y;
    if (s.x + s.w > maxX) maxX = s.x + s.w;
    if (s.y + s.h > maxY) maxY = s.y + s.h;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function normalizeAngle(deg: number): number {
  // Keep rotation in (-360, 360); 360-multiples collapse to 0.
  const r = deg % 360;
  return Object.is(r, -0) ? 0 : r;
}
