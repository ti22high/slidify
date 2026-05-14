/**
 * Animation preset registry. Each preset is pure: given direction / duration
 * it returns a Keyframe[] + KeyframeAnimationOptions pair ready to feed into
 * Element.animate().
 *
 * Coverage targets per SPRINTS.md Sprint 9 acceptance:
 * - 5 entrance: fade, appear, flyIn (direction family), zoom, wipe
 * - 5 exit: mirrors of the entrances
 * - 4 emphasis: pulse, spin, grow, colorChange
 * - motion path: linear
 */

export type PresetCategory = 'entrance' | 'exit' | 'emphasis' | 'motion';
export type FlyDirection = 'left' | 'right' | 'top' | 'bottom';

export interface PresetOptions {
  durationMs?: number;
  direction?: FlyDirection;
  /** For colorChange: target colour. */
  toColor?: string;
  /** For motion: { dx, dy } in CSS pixels at slide scale. */
  motion?: { dx: number; dy: number };
}

export interface ResolvedPreset {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

const DEFAULT_DURATION = 600;

const flyOffset = (direction: FlyDirection): { x: string; y: string } => {
  switch (direction) {
    case 'left':
      return { x: '-100%', y: '0' };
    case 'right':
      return { x: '100%', y: '0' };
    case 'top':
      return { x: '0', y: '-100%' };
    case 'bottom':
      return { x: '0', y: '100%' };
  }
};

export function buildPreset(name: string, opts: PresetOptions = {}): ResolvedPreset {
  const duration = opts.durationMs ?? DEFAULT_DURATION;
  const options: KeyframeAnimationOptions = { duration, easing: 'ease-out', fill: 'forwards' };
  switch (name) {
    case 'fadeIn':
      return { keyframes: [{ opacity: 0 }, { opacity: 1 }], options };
    case 'fadeOut':
      return { keyframes: [{ opacity: 1 }, { opacity: 0 }], options };
    case 'appearIn':
      return { keyframes: [{ visibility: 'hidden' }, { visibility: 'visible' }], options };
    case 'appearOut':
      return { keyframes: [{ visibility: 'visible' }, { visibility: 'hidden' }], options };
    case 'flyIn': {
      const o = flyOffset(opts.direction ?? 'left');
      return {
        keyframes: [
          { transform: `translate(${o.x}, ${o.y})`, opacity: 0 },
          { transform: 'translate(0, 0)', opacity: 1 },
        ],
        options,
      };
    }
    case 'flyOut': {
      const o = flyOffset(opts.direction ?? 'right');
      return {
        keyframes: [
          { transform: 'translate(0, 0)', opacity: 1 },
          { transform: `translate(${o.x}, ${o.y})`, opacity: 0 },
        ],
        options,
      };
    }
    case 'zoomIn':
      return {
        keyframes: [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        options,
      };
    case 'zoomOut':
      return {
        keyframes: [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(0)', opacity: 0 },
        ],
        options,
      };
    case 'wipeIn':
      return {
        keyframes: [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
        options,
      };
    case 'wipeOut':
      return {
        keyframes: [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 0 100%)' }],
        options,
      };
    case 'pulse':
      return {
        keyframes: [
          { transform: 'scale(1)' },
          { transform: 'scale(1.1)' },
          { transform: 'scale(1)' },
        ],
        options: { ...options, duration: 400 },
      };
    case 'spin':
      return {
        keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
        options: { ...options, duration: 800 },
      };
    case 'grow':
      return {
        keyframes: [{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }],
        options,
      };
    case 'colorChange':
      return {
        keyframes: [{ color: 'inherit' }, { color: opts.toColor ?? '#ef4444' }],
        options,
      };
    case 'motionLinear': {
      const m = opts.motion ?? { dx: 100, dy: 0 };
      return {
        keyframes: [
          { transform: 'translate(0, 0)' },
          { transform: `translate(${m.dx}px, ${m.dy}px)` },
        ],
        options: { ...options, easing: 'linear' },
      };
    }
    default:
      return { keyframes: [], options };
  }
}

export const PRESET_NAMES = [
  'fadeIn',
  'fadeOut',
  'appearIn',
  'appearOut',
  'flyIn',
  'flyOut',
  'zoomIn',
  'zoomOut',
  'wipeIn',
  'wipeOut',
  'pulse',
  'spin',
  'grow',
  'colorChange',
  'motionLinear',
] as const;

export type PresetName = (typeof PRESET_NAMES)[number];

export function categoryOf(name: PresetName): PresetCategory {
  if (name.endsWith('In') || name === 'appearIn') return 'entrance';
  if (name.endsWith('Out') || name === 'appearOut') return 'exit';
  if (name === 'motionLinear') return 'motion';
  return 'emphasis';
}
