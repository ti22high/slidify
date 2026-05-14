/** Format a millisecond duration as `HH:MM:SS`. */
export function formatTimer(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export type PlayerKey = 'next' | 'prev' | 'first' | 'exit';

/**
 * Map a keyboard event to a player intent. Returns `null` for unmapped keys.
 */
export function keyToIntent(e: { key: string; shiftKey?: boolean }): PlayerKey | null {
  switch (e.key) {
    case 'Escape':
      return 'exit';
    case 'F5':
      return 'first';
    case ' ':
    case 'ArrowRight':
    case 'ArrowDown':
    case 'PageDown':
      return 'next';
    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
    case 'Backspace':
      return 'prev';
    default:
      return null;
  }
}
