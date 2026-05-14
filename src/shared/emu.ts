/**
 * English Metric Units — the unit-system OOXML uses for every coordinate.
 * 914400 EMU = 1 inch = 72 pt.
 */
export type Emu = number;

export const EMU_PER_INCH = 914400;
export const EMU_PER_POINT = 12700;

/** 13.333 in × 7.5 in — standard 16:9 PowerPoint slide. */
export const SLIDE_WIDTH_EMU: Emu = 12192000;
export const SLIDE_HEIGHT_EMU: Emu = 6858000;
