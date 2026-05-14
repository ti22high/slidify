import type { Emu } from '../../../shared/emu';

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface Rect {
  x: Emu;
  y: Emu;
  w: Emu;
  h: Emu;
}

export interface ResizeOptions {
  /** Preserve aspect ratio (Shift). Anchors on the opposite corner for corner handles. */
  lockAspect?: boolean;
  /** Minimum dimension after resize (default 1 EMU — effectively zero). */
  minSize?: Emu;
}

const MIN = 1;

/**
 * Resize a rectangle by dragging one of its 8 handles by (dx, dy).
 * dx/dy are in the rectangle's local (unrotated) frame, in EMU.
 *
 * Width/height are kept positive: when a side crosses the opposite edge,
 * the rectangle stays anchored at the cursor's drag point and shrinks to
 * the minimum size on the other axis.
 */
export function resizeRect(
  rect: Rect,
  handle: ResizeHandle,
  dx: Emu,
  dy: Emu,
  opts: ResizeOptions = {},
): Rect {
  const min = opts.minSize ?? MIN;
  let { x, y, w, h } = rect;

  const movesLeft = handle === 'nw' || handle === 'w' || handle === 'sw';
  const movesRight = handle === 'ne' || handle === 'e' || handle === 'se';
  const movesTop = handle === 'nw' || handle === 'n' || handle === 'ne';
  const movesBottom = handle === 'sw' || handle === 's' || handle === 'se';

  if (movesLeft) {
    const newX = x + dx;
    const newW = w - dx;
    if (newW < min) {
      x = x + w - min;
      w = min;
    } else {
      x = newX;
      w = newW;
    }
  } else if (movesRight) {
    const newW = w + dx;
    w = newW < min ? min : newW;
  }

  if (movesTop) {
    const newY = y + dy;
    const newH = h - dy;
    if (newH < min) {
      y = y + h - min;
      h = min;
    } else {
      y = newY;
      h = newH;
    }
  } else if (movesBottom) {
    const newH = h + dy;
    h = newH < min ? min : newH;
  }

  if (
    opts.lockAspect &&
    (handle === 'nw' || handle === 'ne' || handle === 'se' || handle === 'sw')
  ) {
    const aspect = rect.w / rect.h;
    if (aspect > 0) {
      const targetH = w / aspect;
      const deltaH = targetH - h;
      if (movesTop) y -= deltaH;
      h = targetH;
    }
  }

  return { x, y, w, h };
}

export interface Point {
  x: number;
  y: number;
}

/** Rotate `p` around `center` by `degrees`. */
export function rotatePoint(p: Point, center: Point, degrees: number): Point {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/** Axis-aligned bounding box of `rect` after rotating around its centre. */
export function rotatedBounds(rect: Rect, degrees: number): Rect {
  if (degrees % 360 === 0) return rect;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const corners: Point[] = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h },
  ].map((p) => rotatePoint(p, { x: cx, y: cy }, degrees));
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** True iff `inner` is fully contained in `outer`. */
export function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

/** True iff `a` and `b` overlap (touching counts). */
export function rectIntersects(a: Rect, b: Rect): boolean {
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}

/** Marquee selection: returns ids of shapes whose rotated bounds fall inside the marquee. */
export function shapesInMarquee<T extends Rect & { id: string; rotation?: number }>(
  shapes: readonly T[],
  marquee: Rect,
): string[] {
  return shapes
    .filter((s) => rectContains(marquee, rotatedBounds(s, s.rotation ?? 0)))
    .map((s) => s.id);
}
