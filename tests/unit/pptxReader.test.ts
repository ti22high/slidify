import { describe, expect, it } from 'vitest';
import { readPptx } from '../../src/main/pptx/reader';
import { buildSmallPptx } from '../fixtures/buildSmallPptx';

describe('pptxReader', () => {
  it('parses slide size and theme accent colours', async () => {
    const bytes = await buildSmallPptx();
    const pres = await readPptx(bytes);
    expect(pres.slideWidthEmu).toBe(12192000);
    expect(pres.slideHeightEmu).toBe(6858000);
    expect(pres.theme.byName.accent1).toBe('4F81BD');
    expect(pres.theme.byName.tx1).toBe('000000');
  });

  it('parses one master, one layout, one slide', async () => {
    const pres = await readPptx(await buildSmallPptx());
    expect(pres.masters).toHaveLength(1);
    expect(pres.layouts).toHaveLength(1);
    expect(pres.slides).toHaveLength(1);
  });

  it('extracts a rect shape with xfrm + theme-coloured fill + bold text', async () => {
    const pres = await readPptx(await buildSmallPptx());
    const slide = pres.slides[0]!;
    expect(slide.shapes).toHaveLength(1);
    const sp = slide.shapes[0]!;
    expect(sp.kind).toBe('sp');
    expect(sp.prstGeom).toBe('rect');
    expect(sp.xfrm).toEqual({ x: 914400, y: 914400, cx: 3000000, cy: 1800000 });
    expect(sp.fill).toEqual({ kind: 'solid', color: 'accent1', scheme: true });
    expect(sp.text?.paragraphs[0]?.runs[0]?.text).toBe('Hello, Slidify');
    expect(sp.text?.paragraphs[0]?.runs[0]?.bold).toBe(true);
    expect(sp.text?.paragraphs[0]?.runs[0]?.fontSize).toBe(18);
  });

  it('preserves unknown XML verbatim on shapes', async () => {
    const pres = await readPptx(await buildSmallPptx());
    const sp = pres.slides[0]!.shapes[0]!;
    expect(sp.unknownXml).toBeDefined();
    expect(sp.unknownXml!.join('')).toMatch(/preserve-me/);
  });
});
