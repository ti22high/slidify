import type { Emu } from '../../shared/emu';

export type ShapeId = string;
export type ShapeKind = 'rect' | 'ellipse' | 'line' | 'arrow';
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
