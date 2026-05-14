import type { Emu } from '../../shared/emu';

export type ShapeId = string;
export type ShapeKind = 'rect' | 'ellipse' | 'line' | 'arrow' | 'image' | 'table';
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

export interface Shape {
  id: ShapeId;
  kind: ShapeKind;
  x: Emu;
  y: Emu;
  w: Emu;
  h: Emu;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: Emu;
  text?: TextBody;
  image?: ImagePayload;
  table?: TablePayload;
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
