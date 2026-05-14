export type MasterId = string;

export interface SlideMaster {
  id: MasterId;
  name: string;
  /** Background fill colour (hex). */
  background: string;
}

export const DEFAULT_MASTER_ID = 'master-default';

export const DEFAULT_MASTER: SlideMaster = {
  id: DEFAULT_MASTER_ID,
  name: 'Default master',
  background: '#ffffff',
};
