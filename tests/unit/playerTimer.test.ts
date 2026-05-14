import { describe, expect, it } from 'vitest';
import { formatTimer, keyToIntent } from '../../src/renderer/features/presentation/playerTimer';

describe('formatTimer', () => {
  it('zero ms', () => {
    expect(formatTimer(0)).toBe('00:00:00');
  });
  it('45 seconds', () => {
    expect(formatTimer(45_000)).toBe('00:00:45');
  });
  it('1 hour 2 min 3 sec', () => {
    expect(formatTimer(3723 * 1000)).toBe('01:02:03');
  });
  it('truncates sub-second remainder', () => {
    expect(formatTimer(1999)).toBe('00:00:01');
  });
  it('treats negative as zero', () => {
    expect(formatTimer(-5)).toBe('00:00:00');
  });
  it('handles non-finite gracefully', () => {
    expect(formatTimer(Number.NaN)).toBe('00:00:00');
  });
});

describe('keyToIntent', () => {
  it('Escape -> exit', () => {
    expect(keyToIntent({ key: 'Escape' })).toBe('exit');
  });
  it('F5 -> first', () => {
    expect(keyToIntent({ key: 'F5' })).toBe('first');
  });
  it('Space / right / down / pageDown -> next', () => {
    for (const k of [' ', 'ArrowRight', 'ArrowDown', 'PageDown']) {
      expect(keyToIntent({ key: k })).toBe('next');
    }
  });
  it('left / up / pageUp / backspace -> prev', () => {
    for (const k of ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace']) {
      expect(keyToIntent({ key: k })).toBe('prev');
    }
  });
  it('unmapped keys return null', () => {
    expect(keyToIntent({ key: 'a' })).toBeNull();
  });
});
