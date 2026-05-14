import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('toolchain is wired up', () => {
    expect(1 + 1).toBe(2);
  });

  it('product name is Slidify', () => {
    const productName = 'Slidify';
    expect(productName).toBe('Slidify');
  });
});
