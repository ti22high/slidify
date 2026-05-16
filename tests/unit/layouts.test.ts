import { describe, expect, it } from 'vitest';
import {
  BUILTIN_LAYOUTS,
  LAYOUT_BLANK,
  LAYOUT_TITLE,
  LAYOUT_TITLE_BODY,
} from '../../src/renderer/model/builtinLayouts';
import { resolveSlide } from '../../src/renderer/features/slides/cascade';
import { DEFAULT_MASTER } from '../../src/renderer/model/master';
import { initialState, reduce } from '../../src/renderer/store/editorStore';

describe('built-in layouts', () => {
  it('exposes exactly 11 layouts including a Blank', () => {
    expect(BUILTIN_LAYOUTS).toHaveLength(11);
    expect(BUILTIN_LAYOUTS[0]).toBe(LAYOUT_BLANK);
    expect(BUILTIN_LAYOUTS.find((l) => l.id === 'layout-title')).toBe(LAYOUT_TITLE);
  });

  it('each layout has a unique id and a non-empty name', () => {
    const ids = new Set(BUILTIN_LAYOUTS.map((l) => l.id));
    expect(ids.size).toBe(BUILTIN_LAYOUTS.length);
    for (const l of BUILTIN_LAYOUTS) expect(l.name.length).toBeGreaterThan(0);
  });

  it('placeholder shapes have text but no fill / stroke (rendered as ghost text)', () => {
    for (const sh of LAYOUT_TITLE_BODY.shapes) {
      expect(sh.fill).toBe('none');
      expect(sh.stroke).toBe('none');
      expect(sh.text?.text).toBeTruthy();
    }
  });
});

describe('cascade with built-in layout', () => {
  it('paints layout placeholders below the slide shapes', () => {
    const slide = { id: 's1', layoutId: LAYOUT_TITLE_BODY.id, shapes: [] };
    const resolved = resolveSlide(slide, BUILTIN_LAYOUTS, [DEFAULT_MASTER]);
    expect(resolved.shapes).toHaveLength(LAYOUT_TITLE_BODY.shapes.length);
    expect(resolved.shapes[0]!.text?.text).toContain('title');
  });
});

describe('slide/setLayout reducer', () => {
  it('updates the slide layoutId when the layout exists', () => {
    const slideId = initialState.selectedSlideId;
    const next = reduce(initialState, {
      type: 'slide/setLayout',
      slideId,
      layoutId: 'layout-title',
    });
    expect(next.slides.find((s) => s.id === slideId)!.layoutId).toBe('layout-title');
  });

  it('ignores unknown layoutId', () => {
    const slideId = initialState.selectedSlideId;
    const next = reduce(initialState, {
      type: 'slide/setLayout',
      slideId,
      layoutId: 'layout-does-not-exist',
    });
    expect(next.slides.find((s) => s.id === slideId)!.layoutId).toBe(
      initialState.slides[0]!.layoutId,
    );
  });

  it('initialState now includes all 11 layouts', () => {
    expect(initialState.layouts).toHaveLength(11);
  });
});
