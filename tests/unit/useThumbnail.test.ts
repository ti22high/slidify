import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mark this file as a React act environment to silence dev warnings.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { DEFAULT_LAYOUT } from '../../src/renderer/model/layout';
import { DEFAULT_MASTER } from '../../src/renderer/model/master';
import type { Slide } from '../../src/renderer/model/slide';
import {
  THUMBNAIL_DEBOUNCE_MS,
  useThumbnail,
} from '../../src/renderer/features/thumbnails/useThumbnail';
import {
  renderToDataUrl,
  renderToSvgString,
} from '../../src/renderer/features/thumbnails/ThumbnailRenderer';
import { resolveSlide } from '../../src/renderer/features/slides/cascade';

const makeSlide = (id: string): Slide => ({ id, layoutId: DEFAULT_LAYOUT.id, shapes: [] });

describe('ThumbnailRenderer (pure)', () => {
  it('serializes a resolved slide with the master background', () => {
    const slide = makeSlide('s1');
    const resolved = resolveSlide(slide, [DEFAULT_LAYOUT], [DEFAULT_MASTER]);
    const svg = renderToSvgString(resolved);
    expect(svg).toContain('<svg ');
    expect(svg).toContain(`fill="${DEFAULT_MASTER.background}"`);
  });

  it('renderToDataUrl returns a base64 data URL', () => {
    const url = renderToDataUrl(resolveSlide(makeSlide('s1'), [DEFAULT_LAYOUT], [DEFAULT_MASTER]));
    expect(url).toMatch(/^data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+$/);
  });
});

describe('useThumbnail', () => {
  let container: HTMLDivElement;
  let root: Root;
  let last: string | null = 'init';

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    last = 'init';
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
  });

  const Probe = ({ slide }: { slide: Slide }): null => {
    last = useThumbnail(slide, [DEFAULT_LAYOUT], [DEFAULT_MASTER]);
    return null;
  };

  it('returns null before the debounce window elapses', () => {
    act(() => {
      root.render(React.createElement(Probe, { slide: makeSlide('s1') }));
    });
    expect(last).toBeNull();
    act(() => {
      vi.advanceTimersByTime(THUMBNAIL_DEBOUNCE_MS - 1);
    });
    expect(last).toBeNull();
  });

  it('emits a data URL after the 300ms debounce', () => {
    act(() => {
      root.render(React.createElement(Probe, { slide: makeSlide('s1') }));
    });
    act(() => {
      vi.advanceTimersByTime(THUMBNAIL_DEBOUNCE_MS);
    });
    expect(last).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it('cancels a pending flush when the slide reference changes inside the window', () => {
    act(() => {
      root.render(React.createElement(Probe, { slide: makeSlide('s1') }));
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      root.render(React.createElement(Probe, { slide: makeSlide('s1-mutated') }));
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(last).toBeNull();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(last).toMatch(/^data:image\/svg\+xml;base64,/);
  });
});
