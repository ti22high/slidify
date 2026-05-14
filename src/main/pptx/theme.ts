import type { ThemeColors } from '../../shared/pptx/model';

/**
 * Resolve a scheme colour name against the theme. Returns the srgb hex
 * (without `#`) or the input itself if no lookup applies.
 */
export function resolveSchemeColor(name: string, theme: ThemeColors): string {
  return theme.byName[name] ?? name;
}

/** Default theme used when a deck doesn't ship one (rare, but possible). */
export const DEFAULT_THEME: ThemeColors = {
  byName: {
    bg1: 'FFFFFF',
    tx1: '000000',
    bg2: 'EEECE1',
    tx2: '1F497D',
    accent1: '4F81BD',
    accent2: 'C0504D',
    accent3: '9BBB59',
    accent4: '8064A2',
    accent5: '4BACC6',
    accent6: 'F79646',
    hlink: '0000FF',
    folHlink: '800080',
  },
};
