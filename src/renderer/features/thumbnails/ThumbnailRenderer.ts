import { SLIDE_HEIGHT_EMU, SLIDE_WIDTH_EMU, EMU_PER_POINT } from '../../../shared/emu';
import type { Shape } from '../../model/shape';
import type { ResolvedSlide } from '../slides/cascade';

const SVG_NS = 'http://www.w3.org/2000/svg';

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&apos;',
  );

function shapeToSvg(shape: Shape): string {
  const t = shape.rotation
    ? ` transform="rotate(${shape.rotation} ${shape.x + shape.w / 2} ${shape.y + shape.h / 2})"`
    : '';
  const stroke = `stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}"`;
  const fill = `fill="${shape.fill}"`;

  let body = '';
  switch (shape.kind) {
    case 'rect':
      body = `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" ${fill} ${stroke}/>`;
      break;
    case 'ellipse':
      body = `<ellipse cx="${shape.x + shape.w / 2}" cy="${shape.y + shape.h / 2}" rx="${shape.w / 2}" ry="${shape.h / 2}" ${fill} ${stroke}/>`;
      break;
    case 'line':
    case 'arrow':
      body = `<line x1="${shape.x}" y1="${shape.y + shape.h / 2}" x2="${shape.x + shape.w}" y2="${shape.y + shape.h / 2}" ${stroke}/>`;
      break;
  }

  let text = '';
  if (shape.text && shape.text.text) {
    const anchor =
      shape.text.align === 'left' ? 'start' : shape.text.align === 'right' ? 'end' : 'middle';
    text = `<text x="${shape.x + shape.w / 2}" y="${shape.y + shape.h / 2}" text-anchor="${anchor}" dominant-baseline="middle" font-family="${esc(shape.text.fontFamily)}" font-size="${shape.text.fontSize * EMU_PER_POINT}" font-weight="${shape.text.bold ? 700 : 400}" font-style="${shape.text.italic ? 'italic' : 'normal'}" fill="${shape.text.color}">${esc(shape.text.text)}</text>`;
  }

  return `<g${t}>${body}${text}</g>`;
}

/** Serialize a resolved slide into an SVG string for thumbnail use. */
export function renderToSvgString(resolved: ResolvedSlide): string {
  const shapes = resolved.shapes.map(shapeToSvg).join('');
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 ${SLIDE_WIDTH_EMU} ${SLIDE_HEIGHT_EMU}" preserveAspectRatio="xMidYMid meet"><rect width="${SLIDE_WIDTH_EMU}" height="${SLIDE_HEIGHT_EMU}" fill="${resolved.background}"/>${shapes}</svg>`;
}

/** Encode SVG string as a `data:image/svg+xml;base64,...` URL (no DOM needed). */
export function renderToDataUrl(resolved: ResolvedSlide): string {
  const svg = renderToSvgString(resolved);
  const base64 =
    typeof btoa !== 'undefined'
      ? btoa(unescape(encodeURIComponent(svg)))
      : Buffer.from(svg, 'utf8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}
