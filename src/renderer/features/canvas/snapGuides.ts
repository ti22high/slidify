import type { Shape } from '../../model/shape';

export interface Bbox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SnapLines {
  /** Vertical snap candidates (X coordinates). */
  x: number[];
  /** Horizontal snap candidates (Y coordinates). */
  y: number[];
}

export interface SnapResult {
  /** Drag delta adjusted to snap the bbox edges/centres to nearby lines. */
  delta: { x: number; y: number };
  /** Snap lines that became active (one per axis at most). Empty when no snap fired. */
  guides: { vertical: number[]; horizontal: number[] };
}

/**
 * Collect the L / centre / R and T / centre / B lines for every other shape
 * on the slide, plus the slide boundaries and centre lines. Used as snap
 * targets while dragging.
 */
export function collectGuideLines(others: Shape[], slide: { w: number; h: number }): SnapLines {
  const x = [0, slide.w / 2, slide.w];
  const y = [0, slide.h / 2, slide.h];
  for (const s of others) {
    x.push(s.x, s.x + s.w / 2, s.x + s.w);
    y.push(s.y, s.y + s.h / 2, s.y + s.h);
  }
  return { x, y };
}

/**
 * Adjust a raw drag delta so that the moved bounding box snaps to the
 * nearest candidate line on each axis, when within `threshold` EMU.
 *
 * Returns the (possibly-unchanged) delta and the snap lines that fired.
 * The caller renders the guides for visual feedback and applies the delta
 * to all dragged shapes.
 */
export function snapDelta(
  bbox: Bbox,
  rawDelta: { x: number; y: number },
  lines: SnapLines,
  threshold: number,
): SnapResult {
  const moved = { x: bbox.x + rawDelta.x, y: bbox.y + rawDelta.y, w: bbox.w, h: bbox.h };
  const xCandidates = [moved.x, moved.x + moved.w / 2, moved.x + moved.w];
  const yCandidates = [moved.y, moved.y + moved.h / 2, moved.y + moved.h];

  const bestX = nearestSnap(xCandidates, lines.x, threshold);
  const bestY = nearestSnap(yCandidates, lines.y, threshold);

  return {
    delta: {
      x: rawDelta.x + bestX.offset,
      y: rawDelta.y + bestY.offset,
    },
    guides: {
      vertical: bestX.line !== null ? [bestX.line] : [],
      horizontal: bestY.line !== null ? [bestY.line] : [],
    },
  };
}

interface AxisSnap {
  offset: number;
  line: number | null;
}

function nearestSnap(points: number[], lines: number[], threshold: number): AxisSnap {
  let best: AxisSnap = { offset: 0, line: null };
  let bestDist = threshold;
  for (const p of points) {
    for (const line of lines) {
      const d = line - p;
      const abs = Math.abs(d);
      if (abs <= bestDist) {
        bestDist = abs;
        best = { offset: d, line };
      }
    }
  }
  return best;
}

/** Combined bounding box of all dragged shapes — same math as arrange.boundingBox. */
export function combinedBbox(shapes: { x: number; y: number; w: number; h: number }[]): Bbox {
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
