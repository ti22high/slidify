import { describe, expect, it } from 'vitest';
import {
  ALL_PRESETS,
  PRESET_GROUPS,
  presetPath,
} from '../../src/renderer/features/canvas/shapePresets';
import { makePresetShape } from '../../src/renderer/store/editorStore';

describe('shape preset library', () => {
  it('ships at least 30 presets', () => {
    expect(ALL_PRESETS.length).toBeGreaterThanOrEqual(30);
  });

  it('every preset name is unique across groups', () => {
    const seen = new Set<string>();
    for (const g of PRESET_GROUPS) {
      for (const n of g.items) {
        expect(seen.has(n)).toBe(false);
        seen.add(n);
      }
    }
  });

  it('emits a non-empty SVG path string for each preset', () => {
    for (const name of ALL_PRESETS) {
      const d = presetPath(name, 100, 100);
      expect(d.length).toBeGreaterThan(5);
      // Path must start with a move command and contain finite numbers only.
      expect(d.startsWith('M')).toBe(true);
      expect(d).not.toMatch(/NaN|undefined/);
    }
  });

  it('scales with w / h', () => {
    const small = presetPath('roundRect', 50, 50);
    const big = presetPath('roundRect', 200, 100);
    expect(small).not.toBe(big);
  });
});

describe('makePresetShape', () => {
  it('returns a preset-kind shape with the requested geom and default size', () => {
    const sh = makePresetShape('star5');
    expect(sh.kind).toBe('preset');
    expect(sh.presetGeom).toBe('star5');
    expect(sh.w).toBeGreaterThan(0);
    expect(sh.h).toBeGreaterThan(0);
    expect(sh.text).toBeDefined();
  });
});
