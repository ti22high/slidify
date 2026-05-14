import type { MasterId } from './master';
import { DEFAULT_MASTER_ID } from './master';
import type { Shape } from './shape';

export type LayoutId = string;

export interface SlideLayout {
  id: LayoutId;
  name: string;
  masterId: MasterId;
  /** Layout-level placeholder shapes painted under slide content. */
  shapes: Shape[];
}

export const DEFAULT_LAYOUT_ID = 'layout-blank';

export const DEFAULT_LAYOUT: SlideLayout = {
  id: DEFAULT_LAYOUT_ID,
  name: 'Blank',
  masterId: DEFAULT_MASTER_ID,
  shapes: [],
};
