import { buildPreset, type PresetName, type PresetOptions } from './presets';

export type Trigger = 'onClick' | 'withPrevious' | 'afterPrevious';

export interface AnimationStep {
  shapeId: string;
  preset: PresetName;
  trigger: Trigger;
  options?: PresetOptions;
  delayMs?: number;
}

export type ElementResolver = (shapeId: string) => Element | null;

/**
 * Schedule a sequence of animation steps using the Web Animations API.
 *
 * Triggers (mirrors PowerPoint semantics):
 * - `onClick`: blocks until the user advances (e.g. presses Space). The
 *   returned `advance()` resumes the queue.
 * - `withPrevious`: starts at the same instant as the previous step.
 * - `afterPrevious`: starts when the previous step's animation has finished.
 */
export function runSequence(
  steps: AnimationStep[],
  resolve: ElementResolver,
): { advance: () => void; stop: () => void } {
  let idx = 0;
  let lastAnim: Animation | null = null;
  let pendingClickResolve: (() => void) | null = null;

  const playStep = (step: AnimationStep): Animation | null => {
    const el = resolve(step.shapeId);
    if (!el) return null;
    const { keyframes, options } = buildPreset(step.preset, step.options);
    const opts: KeyframeAnimationOptions = { ...options };
    if (step.delayMs) opts.delay = step.delayMs;
    return el.animate(keyframes, opts);
  };

  const waitClick = (): Promise<void> =>
    new Promise((resolve) => {
      pendingClickResolve = resolve;
    });

  const run = async () => {
    while (idx < steps.length) {
      const step = steps[idx]!;
      if (step.trigger === 'onClick' && idx > 0) await waitClick();
      if (step.trigger === 'afterPrevious' && lastAnim) await lastAnim.finished;
      const anim = playStep(step);
      if (anim) lastAnim = anim;
      idx += 1;
    }
  };

  void run();

  return {
    advance: () => {
      const cb = pendingClickResolve;
      pendingClickResolve = null;
      if (cb) cb();
    },
    stop: () => {
      if (lastAnim) lastAnim.cancel();
      idx = steps.length;
      const cb = pendingClickResolve;
      pendingClickResolve = null;
      if (cb) cb();
    },
  };
}

export type TransitionKind = 'none' | 'fade' | 'push' | 'wipe' | 'split';

/**
 * Build the keyframe pair that drives a slide-to-slide transition.
 * The caller animates the outgoing slide with the `out` keyframes and the
 * incoming slide with the `in` keyframes — both at the same duration.
 */
export function buildTransition(kind: TransitionKind): {
  out: Keyframe[];
  in: Keyframe[];
  durationMs: number;
} {
  const durationMs = 400;
  switch (kind) {
    case 'none':
      return {
        out: [{ opacity: 1 }, { opacity: 1 }],
        in: [{ opacity: 1 }, { opacity: 1 }],
        durationMs,
      };
    case 'fade':
      return {
        out: [{ opacity: 1 }, { opacity: 0 }],
        in: [{ opacity: 0 }, { opacity: 1 }],
        durationMs,
      };
    case 'push':
      return {
        out: [{ transform: 'translateX(0)' }, { transform: 'translateX(-100%)' }],
        in: [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }],
        durationMs,
      };
    case 'wipe':
      return {
        out: [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 0 100%)' }],
        in: [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
        durationMs,
      };
    case 'split':
      return {
        out: [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 50% 0 50%)' }],
        in: [{ clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0 0 0)' }],
        durationMs,
      };
  }
}
