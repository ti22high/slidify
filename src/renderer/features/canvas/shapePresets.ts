/**
 * Preset shape library — mirrors the GSlides / PowerPoint `prstGeom`
 * vocabulary. Each preset takes the unit-rect (0,0)→(w,h) of its
 * containing shape and emits an SVG path. Adding a preset is a single
 * line in PRESET_GEOMS; everything else flows automatically (rendering,
 * Insert menu, .slidify save/load).
 */

export type PresetGeomName =
  | 'roundRect'
  | 'diamond'
  | 'triangle'
  | 'rightTriangle'
  | 'parallelogram'
  | 'trapezoid'
  | 'pentagon'
  | 'hexagon'
  | 'heptagon'
  | 'octagon'
  | 'star4'
  | 'star5'
  | 'star6'
  | 'star8'
  | 'arrowRight'
  | 'arrowLeft'
  | 'arrowUp'
  | 'arrowDown'
  | 'arrowDoubleH'
  | 'arrowDoubleV'
  | 'chevronRight'
  | 'chevronLeft'
  | 'callout'
  | 'cloud'
  | 'plus'
  | 'flowchartProcess'
  | 'flowchartDecision'
  | 'flowchartDocument'
  | 'flowchartTerminator'
  | 'flowchartPreparation';

type PathFn = (w: number, h: number) => string;

const polygon = (points: [number, number][]): string =>
  points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ') + ' Z';

const regularPolygon = (n: number, cx: number, cy: number, rx: number, ry: number): string => {
  // start at -90deg so flat shapes face up
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i += 1) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return polygon(pts);
};

const star = (n: number, cx: number, cy: number, rx: number, ry: number, inner = 0.4): string => {
  const pts: [number, number][] = [];
  for (let i = 0; i < n * 2; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const r = i % 2 === 0 ? 1 : inner;
    pts.push([cx + rx * r * Math.cos(a), cy + ry * r * Math.sin(a)]);
  }
  return polygon(pts);
};

const PATHS: Record<PresetGeomName, PathFn> = {
  roundRect: (w, h) => {
    const r = Math.min(w, h) * 0.15;
    return `M${r} 0 L${w - r} 0 Q${w} 0 ${w} ${r} L${w} ${h - r} Q${w} ${h} ${w - r} ${h} L${r} ${h} Q0 ${h} 0 ${h - r} L0 ${r} Q0 0 ${r} 0 Z`;
  },
  diamond: (w, h) =>
    polygon([
      [w / 2, 0],
      [w, h / 2],
      [w / 2, h],
      [0, h / 2],
    ]),
  triangle: (w, h) =>
    polygon([
      [w / 2, 0],
      [w, h],
      [0, h],
    ]),
  rightTriangle: (w, h) =>
    polygon([
      [0, 0],
      [w, h],
      [0, h],
    ]),
  parallelogram: (w, h) =>
    polygon([
      [w * 0.2, 0],
      [w, 0],
      [w * 0.8, h],
      [0, h],
    ]),
  trapezoid: (w, h) =>
    polygon([
      [w * 0.2, 0],
      [w * 0.8, 0],
      [w, h],
      [0, h],
    ]),
  pentagon: (w, h) => regularPolygon(5, w / 2, h / 2, w / 2, h / 2),
  hexagon: (w, h) => regularPolygon(6, w / 2, h / 2, w / 2, h / 2),
  heptagon: (w, h) => regularPolygon(7, w / 2, h / 2, w / 2, h / 2),
  octagon: (w, h) => regularPolygon(8, w / 2, h / 2, w / 2, h / 2),
  star4: (w, h) => star(4, w / 2, h / 2, w / 2, h / 2, 0.4),
  star5: (w, h) => star(5, w / 2, h / 2, w / 2, h / 2, 0.4),
  star6: (w, h) => star(6, w / 2, h / 2, w / 2, h / 2, 0.5),
  star8: (w, h) => star(8, w / 2, h / 2, w / 2, h / 2, 0.5),
  arrowRight: (w, h) => {
    const tail = h * 0.3;
    return polygon([
      [0, h / 2 - tail],
      [w * 0.7, h / 2 - tail],
      [w * 0.7, 0],
      [w, h / 2],
      [w * 0.7, h],
      [w * 0.7, h / 2 + tail],
      [0, h / 2 + tail],
    ]);
  },
  arrowLeft: (w, h) => {
    const tail = h * 0.3;
    return polygon([
      [w, h / 2 - tail],
      [w * 0.3, h / 2 - tail],
      [w * 0.3, 0],
      [0, h / 2],
      [w * 0.3, h],
      [w * 0.3, h / 2 + tail],
      [w, h / 2 + tail],
    ]);
  },
  arrowUp: (w, h) => {
    const tail = w * 0.3;
    return polygon([
      [w / 2 - tail, h],
      [w / 2 - tail, h * 0.3],
      [0, h * 0.3],
      [w / 2, 0],
      [w, h * 0.3],
      [w / 2 + tail, h * 0.3],
      [w / 2 + tail, h],
    ]);
  },
  arrowDown: (w, h) => {
    const tail = w * 0.3;
    return polygon([
      [w / 2 - tail, 0],
      [w / 2 - tail, h * 0.7],
      [0, h * 0.7],
      [w / 2, h],
      [w, h * 0.7],
      [w / 2 + tail, h * 0.7],
      [w / 2 + tail, 0],
    ]);
  },
  arrowDoubleH: (w, h) => {
    const tail = h * 0.3;
    return polygon([
      [0, h / 2],
      [w * 0.2, 0],
      [w * 0.2, h / 2 - tail],
      [w * 0.8, h / 2 - tail],
      [w * 0.8, 0],
      [w, h / 2],
      [w * 0.8, h],
      [w * 0.8, h / 2 + tail],
      [w * 0.2, h / 2 + tail],
      [w * 0.2, h],
    ]);
  },
  arrowDoubleV: (w, h) => {
    const tail = w * 0.3;
    return polygon([
      [w / 2, 0],
      [w, h * 0.2],
      [w / 2 + tail, h * 0.2],
      [w / 2 + tail, h * 0.8],
      [w, h * 0.8],
      [w / 2, h],
      [0, h * 0.8],
      [w / 2 - tail, h * 0.8],
      [w / 2 - tail, h * 0.2],
      [0, h * 0.2],
    ]);
  },
  chevronRight: (w, h) =>
    polygon([
      [0, 0],
      [w * 0.6, 0],
      [w, h / 2],
      [w * 0.6, h],
      [0, h],
      [w * 0.4, h / 2],
    ]),
  chevronLeft: (w, h) =>
    polygon([
      [w, 0],
      [w * 0.4, 0],
      [0, h / 2],
      [w * 0.4, h],
      [w, h],
      [w * 0.6, h / 2],
    ]),
  callout: (w, h) => {
    const tailH = h * 0.25;
    const bodyH = h - tailH;
    const r = Math.min(w, bodyH) * 0.1;
    // rounded body + tail at bottom-left.
    return `M${r} 0 L${w - r} 0 Q${w} 0 ${w} ${r} L${w} ${bodyH - r} Q${w} ${bodyH} ${w - r} ${bodyH} L${w * 0.4} ${bodyH} L${w * 0.2} ${h} L${w * 0.3} ${bodyH} L${r} ${bodyH} Q0 ${bodyH} 0 ${bodyH - r} L0 ${r} Q0 0 ${r} 0 Z`;
  },
  cloud: (w, h) => {
    // Five bumpy arcs around a rect; approximation with cubic curves.
    const r = h * 0.35;
    return `M${r} ${h - r} C${-r * 0.3} ${h - r} ${-r * 0.3} ${r} ${r} ${r} C${r} ${0} ${w * 0.4} ${0} ${w * 0.45} ${r * 0.5} C${w * 0.55} ${-r * 0.3} ${w - r} ${-r * 0.3} ${w - r} ${r} C${w + r * 0.3} ${r} ${w + r * 0.3} ${h - r} ${w - r} ${h - r} C${w - r} ${h + r * 0.3} ${r} ${h + r * 0.3} ${r} ${h - r} Z`;
  },
  plus: (w, h) => {
    const tx = w * 0.3;
    const ty = h * 0.3;
    return polygon([
      [tx, 0],
      [w - tx, 0],
      [w - tx, ty],
      [w, ty],
      [w, h - ty],
      [w - tx, h - ty],
      [w - tx, h],
      [tx, h],
      [tx, h - ty],
      [0, h - ty],
      [0, ty],
      [tx, ty],
    ]);
  },
  flowchartProcess: (w, h) => `M0 0 L${w} 0 L${w} ${h} L0 ${h} Z`,
  flowchartDecision: (w, h) =>
    polygon([
      [w / 2, 0],
      [w, h / 2],
      [w / 2, h],
      [0, h / 2],
    ]),
  flowchartDocument: (w, h) => {
    // Rectangle with wavy bottom.
    return `M0 0 L${w} 0 L${w} ${h * 0.85} C${w * 0.75} ${h * 1.05} ${w * 0.5} ${h * 0.65} ${w * 0.25} ${h * 0.85} C${w * 0.1} ${h * 0.95} ${0} ${h * 0.95} ${0} ${h * 0.85} Z`;
  },
  flowchartTerminator: (w, h) => {
    const r = h / 2;
    return `M${r} 0 L${w - r} 0 A${r} ${r} 0 0 1 ${w - r} ${h} L${r} ${h} A${r} ${r} 0 0 1 ${r} 0 Z`;
  },
  flowchartPreparation: (w, h) =>
    polygon([
      [w * 0.15, 0],
      [w * 0.85, 0],
      [w, h / 2],
      [w * 0.85, h],
      [w * 0.15, h],
      [0, h / 2],
    ]),
};

/** SVG `d=` attribute for the preset, sized to (w, h). */
export function presetPath(name: PresetGeomName, w: number, h: number): string {
  return PATHS[name](w, h);
}

/** Display order for the Insert menu — grouped by category. */
export const PRESET_GROUPS: { label: string; items: PresetGeomName[] }[] = [
  {
    label: 'Basic',
    items: [
      'roundRect',
      'diamond',
      'triangle',
      'rightTriangle',
      'parallelogram',
      'trapezoid',
      'pentagon',
      'hexagon',
      'heptagon',
      'octagon',
      'plus',
    ],
  },
  { label: 'Stars', items: ['star4', 'star5', 'star6', 'star8'] },
  {
    label: 'Arrows',
    items: [
      'arrowRight',
      'arrowLeft',
      'arrowUp',
      'arrowDown',
      'arrowDoubleH',
      'arrowDoubleV',
      'chevronRight',
      'chevronLeft',
    ],
  },
  { label: 'Callouts', items: ['callout', 'cloud'] },
  {
    label: 'Flowchart',
    items: [
      'flowchartProcess',
      'flowchartDecision',
      'flowchartDocument',
      'flowchartTerminator',
      'flowchartPreparation',
    ],
  },
];

export const ALL_PRESETS: PresetGeomName[] = PRESET_GROUPS.flatMap((g) => g.items);
