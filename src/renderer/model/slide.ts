import type { LayoutId } from './layout';
import type { Shape } from './shape';

export type SlideId = string;

export interface Slide {
  id: SlideId;
  name?: string;
  layoutId: LayoutId;
  shapes: Shape[];
  /** Speaker notes shown in the presenter view. */
  notes?: string;
  /** Slide transition kind (Sprint 9 engine). */
  transition?: 'none' | 'fade' | 'push' | 'wipe' | 'split';
}
