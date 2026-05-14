import { describe, expect, it } from 'vitest';
import { canonicalJson } from '../../src/shared/canonicalJson';

describe('canonicalJson', () => {
  it('sorts object keys', () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it('sorts nested object keys', () => {
    expect(canonicalJson({ b: { d: 1, c: 2 }, a: 3 })).toBe('{"a":3,"b":{"c":2,"d":1}}');
  });

  it('preserves array order', () => {
    expect(canonicalJson([3, 1, 2])).toBe('[3,1,2]');
  });

  it('is byte-identical regardless of input key order', () => {
    const a = { x: 1, y: { c: 3, b: 2, a: 1 }, z: [4, 5] };
    const b = { z: [4, 5], y: { a: 1, b: 2, c: 3 }, x: 1 };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
  });
});
