/**
 * Internal model used by the PPTX reader (Sprint 7) and writer (Sprint 8).
 *
 * Every node carries an optional `unknownXml` field — a list of verbatim XML
 * strings for children we did not recognise. The writer reattaches them so
 * round-trips are lossless even when we add support for new elements later.
 */

export type Emu = number;

export interface UnknownXmlHolder {
  unknownXml?: string[];
}

export interface Xfrm extends UnknownXmlHolder {
  x: Emu;
  y: Emu;
  cx: Emu;
  cy: Emu;
  rot?: number;
  flipH?: boolean;
  flipV?: boolean;
}

export interface SolidFill {
  kind: 'solid';
  /** Either an explicit srgb hex (without leading #) or a theme scheme color name. */
  color: string;
  scheme?: boolean;
}

export interface BlipFill {
  kind: 'blip';
  /** Relationship id (`r:embed`) referring to a media part in the rels. */
  rEmbed: string;
}

export type Fill = SolidFill | BlipFill | { kind: 'none' };

export interface TextRun extends UnknownXmlHolder {
  text: string;
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
}

export interface TextParagraph extends UnknownXmlHolder {
  runs: TextRun[];
  align?: 'l' | 'ctr' | 'r' | 'just';
}

export interface TextBody extends UnknownXmlHolder {
  paragraphs: TextParagraph[];
}

export interface PptxShape extends UnknownXmlHolder {
  kind: 'sp' | 'pic' | 'graphicFrame' | 'cxnSp' | 'grpSp';
  id: string;
  name?: string;
  xfrm?: Xfrm;
  prstGeom?: string;
  fill?: Fill;
  stroke?: Fill;
  text?: TextBody;
  /** For `pic`: the relationship id of the embedded image. */
  rEmbed?: string;
  /** For `grpSp`: child shapes. */
  children?: PptxShape[];
}

export interface ThemeColors {
  /** Map from scheme color name (e.g. `accent1`, `bg1`) to srgb hex (without `#`). */
  byName: Record<string, string>;
}

export interface PptxSlideMaster extends UnknownXmlHolder {
  id: string;
  shapes: PptxShape[];
}

export interface PptxSlideLayout extends UnknownXmlHolder {
  id: string;
  masterId: string;
  shapes: PptxShape[];
}

export interface PptxSlide extends UnknownXmlHolder {
  id: string;
  layoutId: string;
  shapes: PptxShape[];
}

export interface PptxPresentation extends UnknownXmlHolder {
  slideWidthEmu: Emu;
  slideHeightEmu: Emu;
  theme: ThemeColors;
  masters: PptxSlideMaster[];
  layouts: PptxSlideLayout[];
  slides: PptxSlide[];
  /**
   * Media parts that were referenced by `<a:blip r:embed=...>` — keyed by
   * relationship id, value is the binary blob from the ZIP.
   */
  media: Record<string, Uint8Array>;
}
