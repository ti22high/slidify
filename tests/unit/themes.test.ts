import { describe, expect, it } from 'vitest';
import { findTheme, THEMES } from '../../src/renderer/themes';
import {
  FONT_SUBSTITUTIONS,
  substituteFont,
} from '../../src/renderer/features/fonts/fontSubstitution';
import { initialState, reduce } from '../../src/renderer/store/editorStore';
import type { Shape } from '../../src/renderer/model/shape';

const mkText = (id: string, bold: boolean): Shape => ({
  id,
  kind: 'rect',
  x: 0,
  y: 0,
  w: 100,
  h: 100,
  rotation: 0,
  fill: '#fff',
  stroke: '#000',
  strokeWidth: 12700,
  text: {
    text: 'hi',
    fontFamily: 'Inter',
    fontSize: 18,
    bold,
    italic: false,
    color: '#000',
    align: 'left',
  },
});

describe('themes', () => {
  it('ships at least 5 master themes', () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(5);
  });

  it('every theme has the required fields', () => {
    for (const t of THEMES) {
      expect(typeof t.id).toBe('string');
      expect(typeof t.name).toBe('string');
      expect(t.background).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      expect(t.accent).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      expect(t.text).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      expect(typeof t.headingFont).toBe('string');
      expect(typeof t.bodyFont).toBe('string');
    }
  });

  it('findTheme returns the theme by id', () => {
    expect(findTheme('slate')?.name).toBe('Slate');
    expect(findTheme('ghost')).toBeUndefined();
  });
});

describe('font substitution', () => {
  it('returns the requested font when it is available', () => {
    expect(substituteFont('Inter', new Set(['Inter', 'Roboto']))).toBe('Inter');
  });

  it('falls back via the substitution map', () => {
    expect(substituteFont('Calibri', new Set(['Carlito']))).toBe('Carlito');
    expect(substituteFont('Cambria', new Set(['Caladea']))).toBe('Caladea');
    expect(substituteFont('Arial', new Set(['Liberation Sans']))).toBe('Liberation Sans');
  });

  it('returns the original family when neither it nor the substitute is available', () => {
    expect(substituteFont('Calibri', new Set(['Inter']))).toBe('Calibri');
  });

  it('substitution map is bidirectional for the documented pairs', () => {
    expect(FONT_SUBSTITUTIONS.Carlito).toBe('Calibri');
    expect(FONT_SUBSTITUTIONS.Caladea).toBe('Cambria');
    expect(FONT_SUBSTITUTIONS['Liberation Sans']).toBe('Arial');
  });
});

describe('theme/apply (full propagation)', () => {
  it('applies background only when no other fields passed (backwards compatible)', () => {
    const next = reduce(initialState, { type: 'theme/apply', background: '#ff00ff' });
    expect(next.masters[0]!.background).toBe('#ff00ff');
  });

  it('propagates text colour and heading/body fonts into every slide shape', () => {
    const slideId = initialState.selectedSlideId;
    let state = initialState;
    state = reduce(state, { type: 'shape/add', slideId, shape: mkText('h', true) });
    state = reduce(state, { type: 'shape/add', slideId, shape: mkText('b', false) });
    state = reduce(state, {
      type: 'theme/apply',
      background: '#000',
      text: '#abcdef',
      headingFont: 'Roboto',
      bodyFont: 'NotoSans',
    });
    const shapes = state.slides.find((s) => s.id === slideId)!.shapes;
    const heading = shapes.find((s) => s.id === 'h')!;
    const body = shapes.find((s) => s.id === 'b')!;
    expect(heading.text!.color).toBe('#abcdef');
    expect(body.text!.color).toBe('#abcdef');
    expect(heading.text!.fontFamily).toBe('Roboto');
    expect(body.text!.fontFamily).toBe('NotoSans');
  });

  it('rewrites shape fills that were set to the sentinel "accent" with the new accent', () => {
    const slideId = initialState.selectedSlideId;
    let state = initialState;
    const accent = { ...mkText('a', false), fill: 'accent' };
    state = reduce(state, { type: 'shape/add', slideId, shape: accent });
    state = reduce(state, { type: 'theme/apply', background: '#fff', accent: '#22c55e' });
    expect(state.slides.find((s) => s.id === slideId)!.shapes[0]!.fill).toBe('#22c55e');
  });
});
