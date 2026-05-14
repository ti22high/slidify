import { describe, expect, it } from 'vitest';
import { findTheme, THEMES } from '../../src/renderer/themes';
import {
  FONT_SUBSTITUTIONS,
  substituteFont,
} from '../../src/renderer/features/fonts/fontSubstitution';

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
