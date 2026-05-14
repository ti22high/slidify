import type { SlideLayout } from '../../model/layout';
import type { SlideMaster } from '../../model/master';
import type { Shape } from '../../model/shape';
import type { Slide } from '../../model/slide';

export interface ResolvedSlide {
  background: string;
  /** Shapes stacked bottom-to-top: layout placeholders below slide content. */
  shapes: Shape[];
}

const FALLBACK_BACKGROUND = '#ffffff';

/**
 * Resolve a slide against its layout / master cascade.
 *
 * If the layout or master reference is dangling, the resolver degrades
 * gracefully: missing master → white background, missing layout → no
 * layout-level shapes. The slide's own content always renders.
 */
export function resolveSlide(
  slide: Slide,
  layouts: readonly SlideLayout[],
  masters: readonly SlideMaster[],
): ResolvedSlide {
  const layout = layouts.find((l) => l.id === slide.layoutId);
  const master = layout ? masters.find((m) => m.id === layout.masterId) : undefined;
  return {
    background: master?.background ?? FALLBACK_BACKGROUND,
    shapes: [...(layout?.shapes ?? []), ...slide.shapes],
  };
}
