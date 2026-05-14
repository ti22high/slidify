import { useEffect, useState } from 'react';
import type { SlideLayout } from '../../model/layout';
import type { SlideMaster } from '../../model/master';
import type { Slide } from '../../model/slide';
import { resolveSlide } from '../slides/cascade';
import { renderToDataUrl } from './ThumbnailRenderer';

export const THUMBNAIL_DEBOUNCE_MS = 300;

/**
 * Returns a `data:image/svg+xml` URL for the slide that updates 300 ms
 * after the slide content settles. Returns `null` until the first flush
 * to let the sidebar fall back to inline SVG.
 */
export function useThumbnail(
  slide: Slide,
  layouts: readonly SlideLayout[],
  masters: readonly SlideMaster[],
  delay: number = THUMBNAIL_DEBOUNCE_MS,
): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setUrl(renderToDataUrl(resolveSlide(slide, layouts, masters)));
    }, delay);
    return () => clearTimeout(t);
  }, [slide, layouts, masters, delay]);

  return url;
}
