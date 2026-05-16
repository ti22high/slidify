import type { Slide } from '../../model/slide';
import type { Shape } from '../../model/shape';

export interface FindOptions {
  /** When true, search is case-sensitive. */
  matchCase?: boolean;
}

export interface FindMatch {
  slideId: string;
  shapeId: string;
  /** Index inside the slide's `shapes` array (handy for stable ordering). */
  shapeIndex: number;
  /** Where the hit sits — direct text body, or a particular table cell. */
  location: { kind: 'text' } | { kind: 'cell'; row: number; col: number };
  /** Character offset of the match inside `value` (handy for tests). */
  start: number;
  /** The raw string the match was found in. */
  value: string;
}

export interface ReplaceResult {
  /** Patches to apply to shapes (text body or table). One per affected shape. */
  patches: {
    slideId: string;
    shapeId: string;
    text?: string;
    table?: { row: number; col: number; text: string }[];
  }[];
  /** Total number of substituted occurrences. */
  count: number;
}

/**
 * Find every occurrence of `query` across the deck's text bodies and table
 * cells. Returns a flat, document-order list of matches.
 */
export function findMatches(slides: Slide[], query: string, opts: FindOptions = {}): FindMatch[] {
  if (!query) return [];
  const out: FindMatch[] = [];
  const needle = opts.matchCase ? query : query.toLowerCase();
  for (const slide of slides) {
    slide.shapes.forEach((shape, shapeIndex) => {
      collectFromShape(slide.id, shape, shapeIndex, needle, opts.matchCase ?? false, out);
    });
  }
  return out;
}

function collectFromShape(
  slideId: string,
  shape: Shape,
  shapeIndex: number,
  needle: string,
  matchCase: boolean,
  out: FindMatch[],
): void {
  const text = shape.text?.text;
  if (text) {
    const hay = matchCase ? text : text.toLowerCase();
    let from = 0;
    for (;;) {
      const idx = hay.indexOf(needle, from);
      if (idx < 0) break;
      out.push({
        slideId,
        shapeId: shape.id,
        shapeIndex,
        location: { kind: 'text' },
        start: idx,
        value: text,
      });
      from = idx + needle.length || idx + 1;
    }
  }
  if (shape.table) {
    for (let r = 0; r < shape.table.rows; r += 1) {
      for (let c = 0; c < shape.table.cols; c += 1) {
        const cell = shape.table.cells[r]?.[c];
        if (!cell?.text) continue;
        const hay = matchCase ? cell.text : cell.text.toLowerCase();
        let from = 0;
        for (;;) {
          const idx = hay.indexOf(needle, from);
          if (idx < 0) break;
          out.push({
            slideId,
            shapeId: shape.id,
            shapeIndex,
            location: { kind: 'cell', row: r, col: c },
            start: idx,
            value: cell.text,
          });
          from = idx + needle.length || idx + 1;
        }
      }
    }
  }
}

/**
 * Compute the set of patches needed to replace every `query` with
 * `replacement` across all slides. Returns one patch per affected shape so
 * the caller can batch them as a single undo step.
 */
export function planReplaceAll(
  slides: Slide[],
  query: string,
  replacement: string,
  opts: FindOptions = {},
): ReplaceResult {
  if (!query) return { patches: [], count: 0 };
  const matchCase = opts.matchCase ?? false;
  let count = 0;
  const patches: ReplaceResult['patches'] = [];
  for (const slide of slides) {
    for (const shape of slide.shapes) {
      let textChanged: string | undefined;
      const cellChanges: { row: number; col: number; text: string }[] = [];
      if (shape.text?.text) {
        const next = replaceAll(shape.text.text, query, replacement, matchCase);
        if (next.text !== shape.text.text) {
          textChanged = next.text;
          count += next.count;
        }
      }
      if (shape.table) {
        for (let r = 0; r < shape.table.rows; r += 1) {
          for (let c = 0; c < shape.table.cols; c += 1) {
            const cell = shape.table.cells[r]?.[c];
            if (!cell?.text) continue;
            const next = replaceAll(cell.text, query, replacement, matchCase);
            if (next.text !== cell.text) {
              cellChanges.push({ row: r, col: c, text: next.text });
              count += next.count;
            }
          }
        }
      }
      if (textChanged !== undefined || cellChanges.length > 0) {
        patches.push({
          slideId: slide.id,
          shapeId: shape.id,
          ...(textChanged !== undefined ? { text: textChanged } : {}),
          ...(cellChanges.length > 0 ? { table: cellChanges } : {}),
        });
      }
    }
  }
  return { patches, count };
}

function replaceAll(
  source: string,
  query: string,
  replacement: string,
  matchCase: boolean,
): { text: string; count: number } {
  if (!query) return { text: source, count: 0 };
  if (matchCase) {
    const parts = source.split(query);
    return { text: parts.join(replacement), count: parts.length - 1 };
  }
  // Case-insensitive scan preserving original casing in non-match runs.
  const lower = source.toLowerCase();
  const needle = query.toLowerCase();
  let out = '';
  let i = 0;
  let count = 0;
  while (i < source.length) {
    const idx = lower.indexOf(needle, i);
    if (idx < 0) {
      out += source.slice(i);
      break;
    }
    out += source.slice(i, idx) + replacement;
    i = idx + needle.length;
    count += 1;
  }
  return { text: out, count };
}
