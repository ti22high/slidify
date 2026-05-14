import { describe, expect, it } from 'vitest';
import { resolveSlide } from '../../src/renderer/features/slides/cascade';
import type { SlideLayout } from '../../src/renderer/model/layout';
import type { SlideMaster } from '../../src/renderer/model/master';
import type { Shape } from '../../src/renderer/model/shape';

const masters: SlideMaster[] = [
  { id: 'm-dark', name: 'Dark', background: '#000000' },
  { id: 'm-light', name: 'Light', background: '#ffffff' },
];

const layoutShape: Shape = {
  id: 'placeholder',
  kind: 'rect',
  x: 0,
  y: 0,
  w: 100,
  h: 100,
  rotation: 0,
  fill: '#eee',
  stroke: '#000',
  strokeWidth: 1,
};

const slideShape: Shape = { ...layoutShape, id: 'content', fill: '#0ea5e9' };

const layouts: SlideLayout[] = [
  { id: 'l-dark-blank', name: 'Dark blank', masterId: 'm-dark', shapes: [layoutShape] },
];

describe('resolveSlide', () => {
  it('uses the master background through the layout', () => {
    const slide = { id: 's1', layoutId: 'l-dark-blank', shapes: [slideShape] };
    const r = resolveSlide(slide, layouts, masters);
    expect(r.background).toBe('#000000');
  });

  it('places layout placeholders below slide shapes', () => {
    const slide = { id: 's1', layoutId: 'l-dark-blank', shapes: [slideShape] };
    const r = resolveSlide(slide, layouts, masters);
    expect(r.shapes.map((s) => s.id)).toEqual(['placeholder', 'content']);
  });

  it('falls back to white when layout is missing', () => {
    const slide = { id: 's1', layoutId: 'ghost', shapes: [] };
    const r = resolveSlide(slide, layouts, masters);
    expect(r.background).toBe('#ffffff');
    expect(r.shapes).toEqual([]);
  });

  it('falls back to white when layout references a missing master', () => {
    const dangling: SlideLayout[] = [
      { id: 'l-orphan', name: 'Orphan', masterId: 'ghost', shapes: [] },
    ];
    const slide = { id: 's1', layoutId: 'l-orphan', shapes: [slideShape] };
    const r = resolveSlide(slide, dangling, masters);
    expect(r.background).toBe('#ffffff');
    // slide content still renders
    expect(r.shapes.map((s) => s.id)).toEqual(['content']);
  });
});
