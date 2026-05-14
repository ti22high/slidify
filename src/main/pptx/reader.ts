import JSZip from 'jszip';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import type {
  Fill,
  PptxPresentation,
  PptxShape,
  PptxSlide,
  PptxSlideLayout,
  PptxSlideMaster,
  TextBody,
  TextParagraph,
  TextRun,
  ThemeColors,
  Xfrm,
} from '../../shared/pptx/model';
import { DEFAULT_THEME } from './theme';

const PARSER_OPTS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  preserveOrder: false,
  parseAttributeValue: false,
  removeNSPrefix: false,
} as const;

const parser = new XMLParser(PARSER_OPTS);
const builder = new XMLBuilder({ ...PARSER_OPTS, format: false, suppressEmptyNode: false });

// Element names we know how to map. Anything else falls into unknownXml.
const KNOWN_SHAPE_CHILDREN = new Set([
  'p:nvSpPr',
  'p:spPr',
  'p:txBody',
  'p:nvPicPr',
  'p:blipFill',
  'p:nvGraphicFramePr',
  'p:xfrm',
  'p:nvCxnSpPr',
]);

interface RawXml {
  [k: string]: unknown;
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

/** Serialise a sub-tree back to XML for unknown-XML preservation. */
function stringify(node: unknown): string {
  return builder.build(node);
}

function parseFill(node: RawXml | undefined): Fill | undefined {
  if (!node) return undefined;
  if (node['a:solidFill']) {
    const f = node['a:solidFill'] as RawXml;
    const srgb = (f['a:srgbClr'] as RawXml | undefined)?.['@_val'] as string | undefined;
    const scheme = (f['a:schemeClr'] as RawXml | undefined)?.['@_val'] as string | undefined;
    if (srgb) return { kind: 'solid', color: srgb };
    if (scheme) return { kind: 'solid', color: scheme, scheme: true };
  }
  if (node['a:noFill'] !== undefined) return { kind: 'none' };
  if (node['a:blipFill']) {
    const b = node['a:blipFill'] as RawXml;
    const blip = b['a:blip'] as RawXml | undefined;
    const rEmbed = blip?.['@_r:embed'] as string | undefined;
    if (rEmbed) return { kind: 'blip', rEmbed };
  }
  return undefined;
}

function parseXfrm(node: RawXml | undefined): Xfrm | undefined {
  if (!node) return undefined;
  const off = node['a:off'] as RawXml | undefined;
  const ext = node['a:ext'] as RawXml | undefined;
  if (!off || !ext) return undefined;
  const x = Number(off['@_x']);
  const y = Number(off['@_y']);
  const cx = Number(ext['@_cx']);
  const cy = Number(ext['@_cy']);
  const rot = node['@_rot'] !== undefined ? Number(node['@_rot']) / 60000 : undefined;
  const flipH = node['@_flipH'] === '1' || node['@_flipH'] === 1;
  const flipV = node['@_flipV'] === '1' || node['@_flipV'] === 1;
  return {
    x,
    y,
    cx,
    cy,
    ...(rot !== undefined ? { rot } : {}),
    ...(flipH ? { flipH: true } : {}),
    ...(flipV ? { flipV: true } : {}),
  };
}

function parseTextBody(node: RawXml | undefined): TextBody | undefined {
  if (!node) return undefined;
  const paragraphs: TextParagraph[] = asArray(node['a:p']).map((rawP) => {
    const p = rawP as RawXml;
    const pPr = p['a:pPr'] as RawXml | undefined;
    const align = pPr?.['@_algn'] as TextParagraph['align'] | undefined;
    const runs: TextRun[] = asArray(p['a:r']).map((rawR) => {
      const r = rawR as RawXml;
      const rPr = (r['a:rPr'] as RawXml | undefined) ?? {};
      const sz = rPr['@_sz'];
      const color =
        parseFill(rPr)?.kind === 'solid' ? (parseFill(rPr) as { color: string }).color : undefined;
      return {
        text: typeof r['a:t'] === 'string' ? (r['a:t'] as string) : String(r['a:t'] ?? ''),
        ...(rPr['@_b'] === '1' || rPr['@_b'] === 1 ? { bold: true } : {}),
        ...(rPr['@_i'] === '1' || rPr['@_i'] === 1 ? { italic: true } : {}),
        ...(sz !== undefined ? { fontSize: Number(sz) / 100 } : {}),
        ...(color !== undefined ? { color } : {}),
      };
    });
    return { runs, ...(align ? { align } : {}) };
  });
  return { paragraphs };
}

function parseShape(node: RawXml, kind: PptxShape['kind']): PptxShape {
  const nvSp = (node['p:nvSpPr'] ??
    node['p:nvPicPr'] ??
    node['p:nvCxnSpPr'] ??
    node['p:nvGraphicFramePr']) as RawXml | undefined;
  const cNvPr = nvSp?.['p:cNvPr'] as RawXml | undefined;
  const id = String(cNvPr?.['@_id'] ?? '');
  const name = cNvPr?.['@_name'] as string | undefined;

  const spPr = (node['p:spPr'] ?? node) as RawXml;
  const xfrm = parseXfrm(spPr['a:xfrm'] as RawXml | undefined);
  const prst = (spPr['a:prstGeom'] as RawXml | undefined)?.['@_prst'] as string | undefined;
  const fill = parseFill(spPr);
  const stroke = parseFill(spPr['a:ln'] as RawXml | undefined);
  const text = parseTextBody(node['p:txBody'] as RawXml | undefined);

  const unknownXml: string[] = [];
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('@_')) continue;
    if (KNOWN_SHAPE_CHILDREN.has(key)) continue;
    unknownXml.push(stringify({ [key]: value }));
  }

  const out: PptxShape = {
    kind,
    id,
    ...(name ? { name } : {}),
    ...(xfrm ? { xfrm } : {}),
    ...(prst ? { prstGeom: prst } : {}),
    ...(fill ? { fill } : {}),
    ...(stroke ? { stroke } : {}),
    ...(text ? { text } : {}),
  };
  if (kind === 'pic') {
    const blip = (node['p:blipFill'] as RawXml | undefined)?.['a:blip'] as RawXml | undefined;
    if (blip?.['@_r:embed']) out.rEmbed = blip['@_r:embed'] as string;
  }
  if (unknownXml.length > 0) out.unknownXml = unknownXml;
  return out;
}

function parseShapeTree(spTree: RawXml | undefined): PptxShape[] {
  if (!spTree) return [];
  const out: PptxShape[] = [];
  const shapeMappers: Array<[string, PptxShape['kind']]> = [
    ['p:sp', 'sp'],
    ['p:pic', 'pic'],
    ['p:graphicFrame', 'graphicFrame'],
    ['p:cxnSp', 'cxnSp'],
  ];
  for (const [key, kind] of shapeMappers) {
    for (const node of asArray(spTree[key])) {
      out.push(parseShape(node as RawXml, kind));
    }
  }
  for (const node of asArray(spTree['p:grpSp'])) {
    const grp = node as RawXml;
    const children = parseShapeTree(grp);
    out.push({ kind: 'grpSp', id: '', children });
  }
  return out;
}

function parseTheme(themeXml: string): ThemeColors {
  const doc = parser.parse(themeXml) as RawXml;
  const theme = (doc['a:theme'] ?? doc['theme']) as RawXml | undefined;
  const elements = theme?.['a:themeElements'] as RawXml | undefined;
  const clrScheme = elements?.['a:clrScheme'] as RawXml | undefined;
  if (!clrScheme) return DEFAULT_THEME;

  const byName: Record<string, string> = { ...DEFAULT_THEME.byName };
  for (const [key, value] of Object.entries(clrScheme)) {
    if (key.startsWith('@_')) continue;
    const stripped = key.replace(/^a:/, '');
    const v = value as RawXml;
    const srgb = (v['a:srgbClr'] as RawXml | undefined)?.['@_val'] as string | undefined;
    const sys = (v['a:sysClr'] as RawXml | undefined)?.['@_lastClr'] as string | undefined;
    if (srgb) byName[stripped] = srgb;
    else if (sys) byName[stripped] = sys;
  }
  // PowerPoint exposes bg1/tx1/bg2/tx2 as aliases of lt1/dk1/lt2/dk2.
  byName.bg1 = byName.bg1 ?? byName.lt1 ?? 'FFFFFF';
  byName.tx1 = byName.tx1 ?? byName.dk1 ?? '000000';
  byName.bg2 = byName.bg2 ?? byName.lt2 ?? byName.bg1;
  byName.tx2 = byName.tx2 ?? byName.dk2 ?? byName.tx1;
  return { byName };
}

async function parsePart<T = RawXml>(zip: JSZip, path: string): Promise<T | null> {
  const file = zip.file(path);
  if (!file) return null;
  const xml = await file.async('string');
  return parser.parse(xml) as T;
}

interface Rels {
  [rId: string]: { type: string; target: string };
}

async function parseRels(zip: JSZip, partPath: string): Promise<Rels> {
  const slash = partPath.lastIndexOf('/');
  const relsPath = `${partPath.slice(0, slash)}/_rels/${partPath.slice(slash + 1)}.rels`;
  const doc = await parsePart(zip, relsPath);
  if (!doc) return {};
  const relationships = (doc['Relationships'] as RawXml | undefined)?.['Relationship'];
  const out: Rels = {};
  for (const r of asArray(relationships)) {
    const rr = r as RawXml;
    out[String(rr['@_Id'])] = {
      type: String(rr['@_Type']),
      target: String(rr['@_Target']),
    };
  }
  return out;
}

/**
 * Read a PPTX file from disk and return the internal model. The reader
 * preserves unknown XML on every node so the Sprint 8 writer can re-emit it.
 */
export async function readPptx(bytes: Uint8Array): Promise<PptxPresentation> {
  const zip = await JSZip.loadAsync(bytes);

  const presDoc = await parsePart(zip, 'ppt/presentation.xml');
  if (!presDoc) throw new Error('Not a PPTX: ppt/presentation.xml missing');
  const pres = presDoc['p:presentation'] as RawXml;
  const slideSize = pres['p:sldSz'] as RawXml | undefined;
  const slideWidthEmu = slideSize ? Number(slideSize['@_cx']) : 9144000;
  const slideHeightEmu = slideSize ? Number(slideSize['@_cy']) : 6858000;

  const presRels = await parseRels(zip, 'ppt/presentation.xml');

  // Themes — pick the first.
  let theme: ThemeColors = DEFAULT_THEME;
  for (const file of Object.keys(zip.files)) {
    if (file.startsWith('ppt/theme/') && file.endsWith('.xml')) {
      const xml = await zip.file(file)!.async('string');
      theme = parseTheme(xml);
      break;
    }
  }

  // Masters
  const masters: PptxSlideMaster[] = [];
  for (const file of Object.keys(zip.files)) {
    if (file.startsWith('ppt/slideMasters/slideMaster') && file.endsWith('.xml')) {
      const doc = await parsePart(zip, file);
      const sld = doc?.['p:sldMaster'] as RawXml | undefined;
      const cSld = sld?.['p:cSld'] as RawXml | undefined;
      const spTree = cSld?.['p:spTree'] as RawXml | undefined;
      masters.push({ id: file, shapes: parseShapeTree(spTree) });
    }
  }

  // Layouts
  const layouts: PptxSlideLayout[] = [];
  for (const file of Object.keys(zip.files)) {
    if (file.startsWith('ppt/slideLayouts/slideLayout') && file.endsWith('.xml')) {
      const doc = await parsePart(zip, file);
      const sld = doc?.['p:sldLayout'] as RawXml | undefined;
      const cSld = sld?.['p:cSld'] as RawXml | undefined;
      const spTree = cSld?.['p:spTree'] as RawXml | undefined;
      layouts.push({ id: file, masterId: masters[0]?.id ?? '', shapes: parseShapeTree(spTree) });
    }
  }

  // Slides — order via presentation rels (`sldId / @r:id`).
  const sldIdLst = (pres['p:sldIdLst'] as RawXml | undefined)?.['p:sldId'];
  const orderedRids = asArray(sldIdLst).map((s) => String((s as RawXml)['@_r:id']));

  const slides: PptxSlide[] = [];
  for (const rId of orderedRids) {
    const rel = presRels[rId];
    if (!rel) continue;
    const target = rel.target.replace(/^\/?ppt\//, '');
    const path = `ppt/${target}`;
    const doc = await parsePart(zip, path);
    const sld = doc?.['p:sld'] as RawXml | undefined;
    const cSld = sld?.['p:cSld'] as RawXml | undefined;
    const spTree = cSld?.['p:spTree'] as RawXml | undefined;
    slides.push({
      id: path,
      layoutId: layouts[0]?.id ?? '',
      shapes: parseShapeTree(spTree),
    });
  }

  // Media
  const media: Record<string, Uint8Array> = {};
  for (const file of Object.keys(zip.files)) {
    if (file.startsWith('ppt/media/')) {
      media[file.slice('ppt/media/'.length)] = await zip.file(file)!.async('uint8array');
    }
  }

  return { slideWidthEmu, slideHeightEmu, theme, masters, layouts, slides, media };
}
