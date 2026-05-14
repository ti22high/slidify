import type { Shape } from './shape';

export type SlideId = string;

export interface Slide {
  id: SlideId;
  name?: string;
  shapes: Shape[];
}
