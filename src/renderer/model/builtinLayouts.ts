import { EMU_PER_INCH, SLIDE_HEIGHT_EMU, SLIDE_WIDTH_EMU } from '../../shared/emu';
import { DEFAULT_LAYOUT, DEFAULT_LAYOUT_ID, type SlideLayout } from './layout';
import { DEFAULT_MASTER_ID } from './master';
import type { Shape, TextAlign } from './shape';

/**
 * Eleven built-in slide layouts mirroring the Google Slides defaults.
 * Each layout is rendered by the cascade as "ghost" placeholder text under
 * the actual slide content — a visual hint of where the title / body go.
 *
 * Placeholders are non-interactive (the canvas renderer skips pointer
 * handlers for layout shapes); they exist only as visual scaffolding.
 */

const IN = (v: number): number => Math.round(v * EMU_PER_INCH);

const PLACEHOLDER_FILL = 'none';
const PLACEHOLDER_STROKE = 'none';
const PLACEHOLDER_COLOR = '#94a3b8'; // slate-400 — visibly "hint" grey

interface PlaceholderArgs {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  fontSize: number;
  align?: TextAlign;
  bold?: boolean;
}

function placeholder(p: PlaceholderArgs): Shape {
  return {
    id: p.id,
    kind: 'rect',
    x: p.x,
    y: p.y,
    w: p.w,
    h: p.h,
    rotation: 0,
    fill: PLACEHOLDER_FILL,
    stroke: PLACEHOLDER_STROKE,
    strokeWidth: 0,
    text: {
      text: p.text,
      fontFamily: 'Inter',
      fontSize: p.fontSize,
      bold: p.bold ?? false,
      italic: false,
      color: PLACEHOLDER_COLOR,
      align: p.align ?? 'left',
    },
  };
}

const SLIDE_W = SLIDE_WIDTH_EMU;
const SLIDE_H = SLIDE_HEIGHT_EMU;
const MARGIN = IN(0.5);
const INNER_W = SLIDE_W - 2 * MARGIN;

function makeLayout(id: string, name: string, shapes: Shape[]): SlideLayout {
  return { id, name, masterId: DEFAULT_MASTER_ID, shapes };
}

export const LAYOUT_BLANK: SlideLayout = DEFAULT_LAYOUT;

export const LAYOUT_TITLE: SlideLayout = makeLayout('layout-title', 'Title slide', [
  placeholder({
    id: 'ph-title-title',
    x: MARGIN,
    y: IN(2.5),
    w: INNER_W,
    h: IN(1.5),
    text: 'Click to add title',
    fontSize: 60,
    align: 'center',
    bold: true,
  }),
  placeholder({
    id: 'ph-title-subtitle',
    x: MARGIN,
    y: IN(4.2),
    w: INNER_W,
    h: IN(1),
    text: 'Click to add subtitle',
    fontSize: 24,
    align: 'center',
  }),
]);

export const LAYOUT_TITLE_BODY: SlideLayout = makeLayout('layout-title-body', 'Title and body', [
  placeholder({
    id: 'ph-tb-title',
    x: MARGIN,
    y: IN(0.4),
    w: INNER_W,
    h: IN(1),
    text: 'Click to add title',
    fontSize: 40,
    bold: true,
  }),
  placeholder({
    id: 'ph-tb-body',
    x: MARGIN,
    y: IN(1.6),
    w: INNER_W,
    h: SLIDE_H - IN(2.1),
    text: 'Click to add body text',
    fontSize: 18,
  }),
]);

export const LAYOUT_TITLE_TWO_COLUMNS: SlideLayout = makeLayout(
  'layout-title-two-columns',
  'Title + two columns',
  [
    placeholder({
      id: 'ph-2col-title',
      x: MARGIN,
      y: IN(0.4),
      w: INNER_W,
      h: IN(1),
      text: 'Click to add title',
      fontSize: 40,
      bold: true,
    }),
    placeholder({
      id: 'ph-2col-left',
      x: MARGIN,
      y: IN(1.6),
      w: (INNER_W - IN(0.5)) / 2,
      h: SLIDE_H - IN(2.1),
      text: 'Click to add column 1',
      fontSize: 18,
    }),
    placeholder({
      id: 'ph-2col-right',
      x: MARGIN + (INNER_W - IN(0.5)) / 2 + IN(0.5),
      y: IN(1.6),
      w: (INNER_W - IN(0.5)) / 2,
      h: SLIDE_H - IN(2.1),
      text: 'Click to add column 2',
      fontSize: 18,
    }),
  ],
);

export const LAYOUT_TITLE_ONLY: SlideLayout = makeLayout('layout-title-only', 'Title only', [
  placeholder({
    id: 'ph-title-only',
    x: MARGIN,
    y: IN(0.4),
    w: INNER_W,
    h: IN(1),
    text: 'Click to add title',
    fontSize: 40,
    bold: true,
  }),
]);

export const LAYOUT_SECTION_HEADER: SlideLayout = makeLayout(
  'layout-section-header',
  'Section header',
  [
    placeholder({
      id: 'ph-sec-title',
      x: MARGIN,
      y: IN(2.8),
      w: INNER_W,
      h: IN(1.5),
      text: 'Section title',
      fontSize: 60,
      bold: true,
      align: 'left',
    }),
    placeholder({
      id: 'ph-sec-desc',
      x: MARGIN,
      y: IN(4.5),
      w: INNER_W,
      h: IN(1),
      text: 'Section description',
      fontSize: 20,
    }),
  ],
);

export const LAYOUT_CAPTION: SlideLayout = makeLayout('layout-caption', 'Caption', [
  placeholder({
    id: 'ph-cap-image',
    x: MARGIN,
    y: IN(0.5),
    w: INNER_W,
    h: SLIDE_H - IN(2.2),
    text: 'Image placeholder',
    fontSize: 16,
    align: 'center',
  }),
  placeholder({
    id: 'ph-cap-caption',
    x: MARGIN,
    y: SLIDE_H - IN(1.5),
    w: INNER_W,
    h: IN(1),
    text: 'Caption',
    fontSize: 20,
    align: 'center',
  }),
]);

export const LAYOUT_CENTERED_TITLE: SlideLayout = makeLayout(
  'layout-centered-title',
  'Centered title',
  [
    placeholder({
      id: 'ph-ct-title',
      x: MARGIN,
      y: (SLIDE_H - IN(1.5)) / 2,
      w: INNER_W,
      h: IN(1.5),
      text: 'Click to add title',
      fontSize: 72,
      align: 'center',
      bold: true,
    }),
  ],
);

export const LAYOUT_BIG_NUMBER: SlideLayout = makeLayout('layout-big-number', 'Big number', [
  placeholder({
    id: 'ph-bn-number',
    x: MARGIN,
    y: IN(1.5),
    w: INNER_W,
    h: IN(3),
    text: '123',
    fontSize: 200,
    align: 'center',
    bold: true,
  }),
  placeholder({
    id: 'ph-bn-label',
    x: MARGIN,
    y: IN(5),
    w: INNER_W,
    h: IN(1),
    text: 'Click to add label',
    fontSize: 24,
    align: 'center',
  }),
]);

export const LAYOUT_COMPARISON: SlideLayout = makeLayout('layout-comparison', 'Comparison', [
  placeholder({
    id: 'ph-cmp-title',
    x: MARGIN,
    y: IN(0.4),
    w: INNER_W,
    h: IN(1),
    text: 'Click to add title',
    fontSize: 36,
    bold: true,
  }),
  placeholder({
    id: 'ph-cmp-left-h',
    x: MARGIN,
    y: IN(1.6),
    w: (INNER_W - IN(0.5)) / 2,
    h: IN(0.6),
    text: 'Heading 1',
    fontSize: 22,
    bold: true,
  }),
  placeholder({
    id: 'ph-cmp-left-b',
    x: MARGIN,
    y: IN(2.3),
    w: (INNER_W - IN(0.5)) / 2,
    h: SLIDE_H - IN(2.8),
    text: 'Body 1',
    fontSize: 18,
  }),
  placeholder({
    id: 'ph-cmp-right-h',
    x: MARGIN + (INNER_W - IN(0.5)) / 2 + IN(0.5),
    y: IN(1.6),
    w: (INNER_W - IN(0.5)) / 2,
    h: IN(0.6),
    text: 'Heading 2',
    fontSize: 22,
    bold: true,
  }),
  placeholder({
    id: 'ph-cmp-right-b',
    x: MARGIN + (INNER_W - IN(0.5)) / 2 + IN(0.5),
    y: IN(2.3),
    w: (INNER_W - IN(0.5)) / 2,
    h: SLIDE_H - IN(2.8),
    text: 'Body 2',
    fontSize: 18,
  }),
]);

export const LAYOUT_TITLE_CONTENT: SlideLayout = makeLayout(
  'layout-title-content',
  'Title + content',
  [
    placeholder({
      id: 'ph-tc-title',
      x: MARGIN,
      y: IN(0.4),
      w: INNER_W,
      h: IN(1),
      text: 'Click to add title',
      fontSize: 40,
      bold: true,
    }),
    placeholder({
      id: 'ph-tc-content',
      x: MARGIN,
      y: IN(1.6),
      w: INNER_W,
      h: SLIDE_H - IN(2.1),
      text: 'Insert image, chart, or table here',
      fontSize: 16,
      align: 'center',
    }),
  ],
);

/** Eleven built-in layouts in display order. */
export const BUILTIN_LAYOUTS: SlideLayout[] = [
  LAYOUT_BLANK,
  LAYOUT_TITLE,
  LAYOUT_TITLE_BODY,
  LAYOUT_TITLE_TWO_COLUMNS,
  LAYOUT_TITLE_ONLY,
  LAYOUT_SECTION_HEADER,
  LAYOUT_CAPTION,
  LAYOUT_CENTERED_TITLE,
  LAYOUT_BIG_NUMBER,
  LAYOUT_COMPARISON,
  LAYOUT_TITLE_CONTENT,
];

export { DEFAULT_LAYOUT_ID };
