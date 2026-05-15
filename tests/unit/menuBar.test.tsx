import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { MenuBar } from '../../src/renderer/features/editor/MenuBar';
import { initialState, useEditorStore } from '../../src/renderer/store/editorStore';
import { useUiStore } from '../../src/renderer/store/uiStore';
import { useI18nStore } from '../../src/renderer/i18n';

function mount(): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(MenuBar));
  });
  return { container, root };
}

function openMenu(container: HTMLDivElement, label: string): void {
  const btn = Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.trim().toLowerCase().startsWith(label.toLowerCase()),
  );
  if (!btn) throw new Error(`menu "${label}" not found`);
  act(() => btn.click());
}

function clickItem(container: HTMLDivElement, label: string): void {
  const items = Array.from(container.querySelectorAll('[role="menuitem"]'));
  const target = items.find((el) => (el.textContent ?? '').includes(label));
  if (!target) throw new Error(`item "${label}" not found in open menu`);
  act(() => (target as HTMLButtonElement).click());
}

describe('MenuBar', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useI18nStore.setState({ locale: 'en' });
    useEditorStore.getState().dispatch({ type: 'state/replace', state: initialState });
    useUiStore.setState({ presenting: null, animationsPanel: false });
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders the nine classic menu labels', () => {
    const text = container.textContent ?? '';
    for (const m of [
      'File',
      'Edit',
      'View',
      'Insert',
      'Format',
      'Slide',
      'Arrange',
      'Tools',
      'Help',
    ]) {
      expect(text).toContain(m);
    }
  });

  it('opens a menu on click and closes after selecting an item', () => {
    openMenu(container, 'View');
    expect(container.querySelector('[role="menu"]')).not.toBeNull();
    clickItem(container, 'Show Animations panel');
    expect(useUiStore.getState().animationsPanel).toBe(true);
    expect(container.querySelector('[role="menu"]')).toBeNull();
  });

  it('Slide → New slide appends a slide', () => {
    const before = useEditorStore.getState().slides.length;
    openMenu(container, 'Slide');
    clickItem(container, 'New slide');
    expect(useEditorStore.getState().slides.length).toBe(before + 1);
  });

  it('Insert → Rectangle adds a rect shape to the current slide', () => {
    const slideId = useEditorStore.getState().selectedSlideId;
    const before = useEditorStore.getState().slides.find((s) => s.id === slideId)!.shapes.length;
    openMenu(container, 'Insert');
    clickItem(container, 'Rectangle');
    const after = useEditorStore.getState().slides.find((s) => s.id === slideId)!.shapes.length;
    expect(after).toBe(before + 1);
  });

  it('View → Zoom in raises the zoom factor', () => {
    const before = useEditorStore.getState().zoom;
    openMenu(container, 'View');
    clickItem(container, 'Zoom in');
    expect(useEditorStore.getState().zoom).toBeGreaterThan(before);
  });

  it('Format → theme apply swaps the master background', () => {
    openMenu(container, 'Format');
    // Find a theme button — first theme is Slate, has '#ffffff' background.
    const themeButtons = Array.from(container.querySelectorAll('[role="menuitem"]')).filter((el) =>
      el.textContent?.includes('Sunrise'),
    );
    expect(themeButtons.length).toBeGreaterThan(0);
    act(() => (themeButtons[0] as HTMLButtonElement).click());
    expect(useEditorStore.getState().masters[0]?.background).toBe('#fff7ed');
  });

  it('Help → Switch locale toggles ru/en', () => {
    expect(useI18nStore.getState().locale).toBe('en');
    openMenu(container, 'Help');
    clickItem(container, 'Switch to');
    expect(useI18nStore.getState().locale).toBe('ru');
  });

  it('clicking outside closes the open menu', () => {
    openMenu(container, 'File');
    expect(container.querySelector('[role="menu"]')).not.toBeNull();
    act(() => {
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(container.querySelector('[role="menu"]')).toBeNull();
  });
});
