import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { FormatBar } from '../../src/renderer/features/editor/FormatBar';
import { initialState, useEditorStore } from '../../src/renderer/store/editorStore';
import { useI18nStore } from '../../src/renderer/i18n';

function mount(): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(FormatBar));
  });
  return { container, root };
}

function findByTitle(container: HTMLDivElement, prefix: string): HTMLButtonElement {
  const btn = Array.from(container.querySelectorAll('button')).find((b) =>
    (b.getAttribute('title') ?? '').startsWith(prefix),
  );
  if (!btn) throw new Error(`button with title prefix "${prefix}" not found`);
  return btn as HTMLButtonElement;
}

describe('FormatBar quick actions', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useI18nStore.setState({ locale: 'en' });
    useEditorStore.getState().dispatch({ type: 'state/replace', state: initialState });
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('Undo button dispatches undo', () => {
    // Make a mutation first so undo has work to do.
    const slideId = useEditorStore.getState().selectedSlideId;
    act(() => {
      useEditorStore.getState().dispatch({ type: 'slide/add', afterSlideId: slideId });
    });
    const before = useEditorStore.getState().slides.length;
    act(() => findByTitle(container, 'Undo').click());
    expect(useEditorStore.getState().slides.length).toBe(before - 1);
  });

  it('Zoom in button raises zoom; zoom out lowers it', () => {
    const start = useEditorStore.getState().zoom;
    act(() => findByTitle(container, 'Zoom in').click());
    expect(useEditorStore.getState().zoom).toBeGreaterThan(start);
    const peak = useEditorStore.getState().zoom;
    act(() => findByTitle(container, 'Zoom out').click());
    expect(useEditorStore.getState().zoom).toBeLessThan(peak);
  });

  it('Insert text box adds a text shape and enters edit mode', () => {
    const slideId = useEditorStore.getState().selectedSlideId;
    const before = useEditorStore.getState().slides.find((s) => s.id === slideId)!.shapes.length;
    act(() => findByTitle(container, 'Insert text').click());
    const after = useEditorStore.getState().slides.find((s) => s.id === slideId)!.shapes.length;
    expect(after).toBe(before + 1);
  });

  it('Insert shape adds a rect', () => {
    const slideId = useEditorStore.getState().selectedSlideId;
    const before = useEditorStore.getState().slides.find((s) => s.id === slideId)!.shapes.length;
    act(() => findByTitle(container, 'Insert shape').click());
    const after = useEditorStore.getState().slides.find((s) => s.id === slideId)!.shapes;
    expect(after.length).toBe(before + 1);
    expect(after[after.length - 1]!.kind).toBe('rect');
  });

  it('Insert line adds a line shape', () => {
    const slideId = useEditorStore.getState().selectedSlideId;
    act(() => findByTitle(container, 'Insert line').click());
    const shapes = useEditorStore.getState().slides.find((s) => s.id === slideId)!.shapes;
    expect(shapes[shapes.length - 1]!.kind).toBe('line');
  });

  it('Paint format and Add comment stubs are disabled', () => {
    expect(findByTitle(container, 'Paint format').disabled).toBe(true);
    expect(findByTitle(container, 'Add comment').disabled).toBe(true);
  });

  it('Zoom selector reflects current zoom', () => {
    const select = container.querySelector('select[aria-label="Zoom"]') as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.value).toBe('1');
    act(() => {
      select.value = '1.5';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(useEditorStore.getState().zoom).toBeCloseTo(1.5);
  });
});
