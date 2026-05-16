import type { Emu } from '../../shared/emu';

export type ShapeId = string;
export type ShapeKind =
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'image'
  | 'table'
  | 'data'
  | 'chart';
export type TextAlign = 'left' | 'center' | 'right';

export interface TextBody {
  text: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  color: string;
  align: TextAlign;
}

export interface ImagePayload {
  /** Relative path inside the .slidify ZIP, e.g. `media/img-abc.png`. */
  mediaRef: string;
  /** Image mime type — png / jpeg / gif / webp / svg. */
  mime: string;
  /** Intrinsic width / height in pixels, captured at insert time. */
  naturalWidth: number;
  naturalHeight: number;
  alt?: string;
}

export interface TableCell {
  text: string;
  fill?: string;
  align?: TextAlign;
}

export interface TablePayload {
  rows: number;
  cols: number;
  /** Row-major. `cells[r][c]`. */
  cells: TableCell[][];
}

export interface DataPayload {
  /** Id into the renderer-side dataset registry. */
  datasetId: string;
  /** Path inside the .slidify ZIP, e.g. `data/sales.xlsx`. */
  dataRef: string;
  /** Sheet within the workbook. */
  sheetName: string;
  /** How many rows to preview in the slide. */
  rowLimit: number;
}

export interface AnimationStepDef {
  preset: string;
  trigger: 'onClick' | 'withPrevious' | 'afterPrevious';
  durationMs?: number;
}

export interface Shape {
  id: ShapeId;
  kind: ShapeKind;
  x: Emu;
  y: Emu;
  w: Emu;
  h: Emu;
  rotation: number;
  /** Mirror horizontally around the shape's vertical centerline (GSlides / PPTX `flipH`). */
  flipH?: boolean;
  /** Mirror vertically around the shape's horizontal centerline (GSlides / PPTX `flipV`). */
  flipV?: boolean;
  fill: string;
  stroke: string;
  strokeWidth: Emu;
  /** 0..1 — applied as SVG `opacity` on the rendered <g>. Default = 1. */
  opacity?: number;
  text?: TextBody;
  image?: ImagePayload;
  table?: TablePayload;
  data?: DataPayload;
  chart?: import('./chart').ChartPayload;
  animations?: AnimationStepDef[];
}

export const DEFAULT_TEXT_BODY: TextBody = {
  text: '',
  fontFamily: 'Inter',
  fontSize: 18,
  bold: false,
  italic: false,
  color: '#0f172a',
  align: 'left',
};
