import JSZip from 'jszip';
import { XMLBuilder } from 'fast-xml-parser';
import type { Fill, PptxPresentation, PptxShape, TextBody, Xfrm } from '../../shared/pptx/model';

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: false,
  suppressEmptyNode: false,
});

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

function fillToXml(fill: Fill | undefined): string {
  if (!fill) return '';
  if (fill.kind === 'none') return '<a:noFill/>';
  if (fill.kind === 'solid') {
    return fill.scheme
      ? `<a:solidFill><a:schemeClr val="${fill.color}"/></a:solidFill>`
      : `<a:solidFill><a:srgbClr val="${fill.color}"/></a:solidFill>`;
  }
  if (fill.kind === 'blip') {
    return `<a:blipFill><a:blip r:embed="${fill.rEmbed}"/><a:stretch/></a:blipFill>`;
  }
  return '';
}

function xfrmToXml(xfrm: Xfrm | undefined): string {
  if (!xfrm) return '';
  const rotAttr = xfrm.rot ? ` rot="${Math.round(xfrm.rot * 60000)}"` : '';
  const flipH = xfrm.flipH ? ' flipH="1"' : '';
  const flipV = xfrm.flipV ? ' flipV="1"' : '';
  return `<a:xfrm${rotAttr}${flipH}${flipV}><a:off x="${xfrm.x}" y="${xfrm.y}"/><a:ext cx="${xfrm.cx}" cy="${xfrm.cy}"/></a:xfrm>`;
}

function textToXml(text: TextBody | undefined): string {
  if (!text) return '';
  const paragraphs = text.paragraphs
    .map((p) => {
      const algn = p.align ? ` algn="${p.align}"` : '';
      const runs = p.runs
        .map((r) => {
          const attrs: string[] = ['lang="en-US"'];
          if (r.bold) attrs.push('b="1"');
          if (r.italic) attrs.push('i="1"');
          if (r.fontSize !== undefined) attrs.push(`sz="${Math.round(r.fontSize * 100)}"`);
          const color = r.color ? `<a:solidFill><a:srgbClr val="${r.color}"/></a:solidFill>` : '';
          const escaped = r.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return `<a:r><a:rPr ${attrs.join(' ')}>${color}</a:rPr><a:t>${escaped}</a:t></a:r>`;
        })
        .join('');
      const pPr = algn ? `<a:pPr${algn}/>` : '';
      const unknown = (p.unknownXml ?? []).join('');
      return `<a:p>${pPr}${runs}${unknown}</a:p>`;
    })
    .join('');
  return `<p:txBody><a:bodyPr/><a:lstStyle/>${paragraphs}${(text.unknownXml ?? []).join('')}</p:txBody>`;
}

function shapeToXml(shape: PptxShape, fallbackId: number): string {
  const id = shape.id || String(fallbackId);
  const name = shape.name ?? '';
  const unknown = (shape.unknownXml ?? []).join('');

  switch (shape.kind) {
    case 'sp': {
      const prst = shape.prstGeom
        ? `<a:prstGeom prst="${shape.prstGeom}"><a:avLst/></a:prstGeom>`
        : '';
      return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${xfrmToXml(shape.xfrm)}${prst}${fillToXml(shape.fill)}</p:spPr>${textToXml(shape.text)}${unknown}</p:sp>`;
    }
    case 'pic': {
      const embed = shape.rEmbed ?? '';
      return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="${name}"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${embed}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>${xfrmToXml(shape.xfrm)}</p:spPr>${unknown}</p:pic>`;
    }
    case 'cxnSp': {
      const prst = shape.prstGeom
        ? `<a:prstGeom prst="${shape.prstGeom}"><a:avLst/></a:prstGeom>`
        : '';
      return `<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr><p:spPr>${xfrmToXml(shape.xfrm)}${prst}</p:spPr>${unknown}</p:cxnSp>`;
    }
    case 'graphicFrame': {
      return `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="${name}"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>${xfrmToXml(shape.xfrm)}${unknown}</p:graphicFrame>`;
    }
    case 'grpSp': {
      const children = (shape.children ?? [])
        .map((c, i) => shapeToXml(c, fallbackId + i + 1))
        .join('');
      return `<p:grpSp><p:nvGrpSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>${children}${unknown}</p:grpSp>`;
    }
  }
}

function spTreeToXml(shapes: PptxShape[]): string {
  const inner = shapes.map((s, i) => shapeToXml(s, i + 2)).join('');
  return `<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>${inner}</p:spTree>`;
}

function presentationXml(pres: PptxPresentation): string {
  const sldIds = pres.slides
    .map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`)
    .join('');
  return `${XML_DECL}<p:presentation xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${sldIds}</p:sldIdLst><p:sldSz cx="${pres.slideWidthEmu}" cy="${pres.slideHeightEmu}"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`;
}

function themeXml(pres: PptxPresentation): string {
  const c = pres.theme.byName;
  const entry = (name: string, fallback: string) =>
    `<a:${name}><a:srgbClr val="${c[name] ?? fallback}"/></a:${name}>`;
  return `${XML_DECL}<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Slidify"><a:themeElements><a:clrScheme name="Slidify">${entry('dk1', '000000')}${entry('lt1', 'FFFFFF')}${entry('dk2', '1F497D')}${entry('lt2', 'EEECE1')}${entry('accent1', '4F81BD')}${entry('accent2', 'C0504D')}${entry('accent3', '9BBB59')}${entry('accent4', '8064A2')}${entry('accent5', '4BACC6')}${entry('accent6', 'F79646')}${entry('hlink', '0000FF')}${entry('folHlink', '800080')}</a:clrScheme><a:fontScheme name="Slidify"><a:majorFont><a:latin typeface="Inter"/></a:majorFont><a:minorFont><a:latin typeface="Inter"/></a:minorFont></a:fontScheme><a:fmtScheme name="Slidify"><a:fillStyleLst><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln/><a:ln/><a:ln/></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;
}

const NS_ATTRS =
  ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';

function slideMasterXml(): string {
  return `${XML_DECL}<p:sldMaster${NS_ATTRS}><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name="Background"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:sldMaster>`;
}

function slideLayoutXml(): string {
  return `${XML_DECL}<p:sldLayout${NS_ATTRS} type="blank"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name="Blank"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld></p:sldLayout>`;
}

function slideXml(shapes: PptxShape[]): string {
  return `${XML_DECL}<p:sld${NS_ATTRS}><p:cSld>${spTreeToXml(shapes)}</p:cSld></p:sld>`;
}

function relsBuilder(rels: { id: string; type: string; target: string }[]): string {
  const inner = rels
    .map((r) => `  <Relationship Id="${r.id}" Type="${r.type}" Target="${r.target}"/>`)
    .join('\n');
  return `${XML_DECL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n${inner}\n</Relationships>`;
}

function contentTypesXml(slideCount: number): string {
  const slides = Array.from(
    { length: slideCount },
    (_, i) =>
      `  <Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
  ).join('\n');
  return `${XML_DECL}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
${slides}
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>`;
}

/**
 * Pack a PptxPresentation back into a .pptx ZIP. Mirrors Sprint 7's reader.
 * Unknown XML preserved on each shape is spliced back in place.
 *
 * Note: this is a minimal writer — it always emits one master + one blank
 * layout, which matches the fixture the reader expects. Sprint-12 polish
 * will widen this to honour multiple masters / layouts from the model.
 */
export async function writePptx(pres: PptxPresentation): Promise<Uint8Array> {
  const zip = new JSZip();

  zip.file('[Content_Types].xml', contentTypesXml(pres.slides.length));
  zip.file(
    '_rels/.rels',
    relsBuilder([
      {
        id: 'rId1',
        type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument',
        target: 'ppt/presentation.xml',
      },
    ]),
  );

  zip.file('ppt/presentation.xml', presentationXml(pres));
  zip.file('ppt/theme/theme1.xml', themeXml(pres));
  zip.file('ppt/slideMasters/slideMaster1.xml', slideMasterXml());
  zip.file('ppt/slideLayouts/slideLayout1.xml', slideLayoutXml());

  const presRels: { id: string; type: string; target: string }[] = [
    {
      id: 'rId1',
      type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster',
      target: 'slideMasters/slideMaster1.xml',
    },
    {
      id: `rId${pres.slides.length + 2}`,
      type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme',
      target: 'theme/theme1.xml',
    },
  ];

  pres.slides.forEach((slide, i) => {
    const idx = i + 1;
    zip.file(`ppt/slides/slide${idx}.xml`, slideXml(slide.shapes));
    zip.file(
      `ppt/slides/_rels/slide${idx}.xml.rels`,
      relsBuilder([
        {
          id: 'rId1',
          type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout',
          target: '../slideLayouts/slideLayout1.xml',
        },
      ]),
    );
    presRels.push({
      id: `rId${i + 2}`,
      type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide',
      target: `slides/slide${idx}.xml`,
    });
  });

  zip.file('ppt/_rels/presentation.xml.rels', relsBuilder(presRels));
  zip.file(
    'ppt/slideMasters/_rels/slideMaster1.xml.rels',
    relsBuilder([
      {
        id: 'rId1',
        type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout',
        target: '../slideLayouts/slideLayout1.xml',
      },
      {
        id: 'rId2',
        type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme',
        target: '../theme/theme1.xml',
      },
    ]),
  );
  zip.file(
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
    relsBuilder([
      {
        id: 'rId1',
        type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster',
        target: '../slideMasters/slideMaster1.xml',
      },
    ]),
  );

  for (const [name, bytes] of Object.entries(pres.media)) {
    zip.file(`ppt/media/${name}`, bytes);
  }

  // Touch the unused builder import so TypeScript keeps it for future use.
  void builder;

  return new Uint8Array(await zip.generateAsync({ type: 'uint8array', compression: 'STORE' }));
}
