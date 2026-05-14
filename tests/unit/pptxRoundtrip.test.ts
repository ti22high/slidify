import { describe, expect, it } from 'vitest';
import { readPptx } from '../../src/main/pptx/reader';
import { writePptx } from '../../src/main/pptx/writer';
import { buildSmallPptx } from '../fixtures/buildSmallPptx';
import type { PptxShape } from '../../src/shared/pptx/model';

function shapeSpine(s: PptxShape): unknown {
  return {
    kind: s.kind,
    prstGeom: s.prstGeom,
    xfrm: s.xfrm,
    fill: s.fill,
    text: s.text?.paragraphs.map((p) =>
      p.runs.map((r) => ({ text: r.text, bold: r.bold ?? false, fontSize: r.fontSize })),
    ),
    hasUnknown: (s.unknownXml?.length ?? 0) > 0,
  };
}

describe('PPTX round-trip', () => {
  it('read → write → read preserves the shape spine', async () => {
    const original = await readPptx(await buildSmallPptx());
    const rewritten = await writePptx(original);
    const reparsed = await readPptx(rewritten);

    expect(reparsed.slideWidthEmu).toBe(original.slideWidthEmu);
    expect(reparsed.slideHeightEmu).toBe(original.slideHeightEmu);
    expect(reparsed.slides).toHaveLength(original.slides.length);

    const a = original.slides[0]!.shapes[0]!;
    const b = reparsed.slides[0]!.shapes[0]!;
    expect(shapeSpine(b)).toEqual(shapeSpine(a));
  });

  it('preserves theme accent colours across the round-trip', async () => {
    const original = await readPptx(await buildSmallPptx());
    const reparsed = await readPptx(await writePptx(original));
    for (const k of ['accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6']) {
      expect(reparsed.theme.byName[k]).toBe(original.theme.byName[k]);
    }
  });
});
