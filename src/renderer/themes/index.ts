/**
 * Master themes — colour scheme + font pair. Loaded into the editor store
 * via the Design tab; switching swaps `masters[0]` for the chosen theme.
 */

export interface SlidifyTheme {
  id: string;
  name: string;
  /** Background colour applied to the master. */
  background: string;
  accent: string;
  text: string;
  headingFont: string;
  bodyFont: string;
}

export const THEMES: SlidifyTheme[] = [
  {
    id: 'slate',
    name: 'Slate',
    background: '#ffffff',
    accent: '#0ea5e9',
    text: '#0f172a',
    headingFont: 'Inter',
    bodyFont: 'Inter',
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    background: '#fff7ed',
    accent: '#f97316',
    text: '#7c2d12',
    headingFont: 'Inter',
    bodyFont: 'Roboto',
  },
  {
    id: 'forest',
    name: 'Forest',
    background: '#f0fdf4',
    accent: '#22c55e',
    text: '#14532d',
    headingFont: 'Roboto',
    bodyFont: 'Roboto',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    background: '#eff6ff',
    accent: '#3b82f6',
    text: '#1e3a8a',
    headingFont: 'Inter',
    bodyFont: 'NotoSans',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    background: '#0f172a',
    accent: '#a78bfa',
    text: '#f1f5f9',
    headingFont: 'Inter',
    bodyFont: 'Inter',
  },
];

export function findTheme(id: string): SlidifyTheme | undefined {
  return THEMES.find((t) => t.id === id);
}
