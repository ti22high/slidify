import type { Rect } from './geometry';

interface Props {
  rect: Rect | null;
}

export function Marquee({ rect }: Props): JSX.Element | null {
  if (!rect || rect.w <= 0 || rect.h <= 0) return null;
  return (
    <rect
      x={rect.x}
      y={rect.y}
      width={rect.w}
      height={rect.h}
      fill="rgba(14, 165, 233, 0.12)"
      stroke="#0ea5e9"
      strokeWidth={9525}
      strokeDasharray="38100 19050"
      pointerEvents="none"
    />
  );
}
