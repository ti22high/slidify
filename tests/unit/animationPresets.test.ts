import { describe, expect, it } from 'vitest';
import {
  buildPreset,
  categoryOf,
  PRESET_NAMES,
  type PresetName,
} from '../../src/renderer/features/presentation/presets';
import { buildTransition } from '../../src/renderer/features/presentation/AnimationEngine';

describe('animation presets', () => {
  it('every preset returns at least one keyframe', () => {
    for (const name of PRESET_NAMES) {
      const { keyframes } = buildPreset(name);
      expect(keyframes.length).toBeGreaterThan(0);
    }
  });

  it('fadeIn animates opacity 0 -> 1', () => {
    const { keyframes } = buildPreset('fadeIn');
    expect(keyframes[0]).toEqual({ opacity: 0 });
    expect(keyframes[keyframes.length - 1]).toEqual({ opacity: 1 });
  });

  it('flyIn direction shifts the start offset', () => {
    const left = buildPreset('flyIn', { direction: 'left' }).keyframes[0] as { transform: string };
    const right = buildPreset('flyIn', { direction: 'right' }).keyframes[0] as {
      transform: string;
    };
    expect(left.transform).toContain('-100%');
    expect(right.transform).toContain('100%');
  });

  it('motionLinear respects { dx, dy }', () => {
    const { keyframes } = buildPreset('motionLinear', { motion: { dx: 50, dy: -20 } });
    const end = keyframes[keyframes.length - 1] as { transform: string };
    expect(end.transform).toContain('50px');
    expect(end.transform).toContain('-20px');
  });

  it('categoryOf splits 5/5/4/1', () => {
    const counts: Record<string, number> = {};
    for (const n of PRESET_NAMES) {
      const c = categoryOf(n as PresetName);
      counts[c] = (counts[c] ?? 0) + 1;
    }
    expect(counts).toEqual({ entrance: 5, exit: 5, emphasis: 4, motion: 1 });
  });

  it('respects custom durationMs', () => {
    const { options } = buildPreset('fadeIn', { durationMs: 1234 });
    expect(options.duration).toBe(1234);
  });
});

describe('slide transitions', () => {
  it('every transition kind returns matched out/in keyframes', () => {
    for (const kind of ['none', 'fade', 'push', 'wipe', 'split'] as const) {
      const t = buildTransition(kind);
      expect(t.out.length).toBe(2);
      expect(t.in.length).toBe(2);
      expect(t.durationMs).toBe(400);
    }
  });
});
