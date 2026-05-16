import { describe, expect, it } from 'vitest';
import { findMatches, planReplaceAll } from '../../src/renderer/features/findReplace/findReplace';
import { initialState, reduce } from '../../src/renderer/store/editorStore';
import type { Shape } from '../../src/renderer/model/shape';
import type { Slide } from '../../src/renderer/model/slide';

const mkText = (id: string, text: string): Shape => ({
  id,
  kind: 'rect',
  x: 0,
  y: 0,
  w: 100,
  h: 100,
  rotation: 0,
  fill: '#fff',
  stroke: '#000',
  strokeWidth: 12700,
  text: {
    text,
    fontFamily: 'Inter',
    fontSize: 18,
    bold: false,
    italic: false,
    color: '#000',
    align: 'left',
  },
});

const mkTable = (id: string, cellTexts: string[][]): Shape => ({
  id,
  kind: 'table',
  x: 0,
  y: 0,
  w: 200,
  h: 200,
  rotation: 0,
  fill: '#fff',
  stroke: '#000',
  strokeWidth: 12700,
  table: {
    rows: cellTexts.length,
    cols: cellTexts[0]!.length,
    cells: cellTexts.map((row) => row.map((text) => ({ text }))),
  },
});

const slide = (id: string, shapes: Shape[]): Slide => ({
  id,
  layoutId: 'layout-default',
  shapes,
});

describe('findMatches', () => {
  it('returns empty list for an empty query', () => {
    expect(findMatches([slide('s1', [mkText('a', 'hello')])], '')).toEqual([]);
  });

  it('finds every occurrence in text bodies, document order', () => {
    const m = findMatches(
      [
        slide('s1', [mkText('a', 'foo bar foo'), mkText('b', 'no match here')]),
        slide('s2', [mkText('c', 'foo')]),
      ],
      'foo',
    );
    expect(m.map((x) => `${x.slideId}/${x.shapeId}@${x.start}`)).toEqual([
      's1/a@0',
      's1/a@8',
      's2/c@0',
    ]);
  });

  it('is case-insensitive by default; matchCase enforces case', () => {
    const slides = [slide('s1', [mkText('a', 'Foo FOO foo')])];
    expect(findMatches(slides, 'foo')).toHaveLength(3);
    expect(findMatches(slides, 'foo', { matchCase: true })).toHaveLength(1);
  });

  it('finds matches inside table cells', () => {
    const m = findMatches(
      [
        slide('s1', [
          mkTable('t', [
            ['foo', 'bar'],
            ['foo foo', ''],
          ]),
        ]),
      ],
      'foo',
    );
    expect(m).toHaveLength(3);
    expect(m[0]!.location).toEqual({ kind: 'cell', row: 0, col: 0 });
    expect(m[1]!.location).toEqual({ kind: 'cell', row: 1, col: 0 });
    expect(m[2]!.location).toEqual({ kind: 'cell', row: 1, col: 0 });
  });
});

describe('planReplaceAll', () => {
  it('produces one patch per affected shape with replaced text', () => {
    const r = planReplaceAll(
      [slide('s1', [mkText('a', 'hello world'), mkText('b', 'no match')])],
      'world',
      'there',
    );
    expect(r.count).toBe(1);
    expect(r.patches).toEqual([{ slideId: 's1', shapeId: 'a', text: 'hello there' }]);
  });

  it('preserves casing in non-match runs when case-insensitive', () => {
    const r = planReplaceAll([slide('s1', [mkText('a', 'Foo and FOO')])], 'foo', 'BAR');
    expect(r.count).toBe(2);
    expect(r.patches[0]!.text).toBe('BAR and BAR');
  });

  it('plans table-cell patches', () => {
    const r = planReplaceAll(
      [
        slide('s1', [
          mkTable('t', [
            ['foo', 'bar'],
            ['ok', 'foo'],
          ]),
        ]),
      ],
      'foo',
      'X',
    );
    expect(r.count).toBe(2);
    expect(r.patches[0]).toEqual({
      slideId: 's1',
      shapeId: 't',
      table: [
        { row: 0, col: 0, text: 'X' },
        { row: 1, col: 1, text: 'X' },
      ],
    });
  });
});

describe('findReplace/replaceAll reducer', () => {
  it('applies text + table patches in a single dispatch', () => {
    const slideId = initialState.selectedSlideId;
    let state = initialState;
    state = reduce(state, { type: 'shape/add', slideId, shape: mkText('a', 'hello world') });
    state = reduce(state, {
      type: 'shape/add',
      slideId,
      shape: mkTable('t', [['foo', 'bar']]),
    });
    state = reduce(state, {
      type: 'findReplace/replaceAll',
      patches: [
        { slideId, shapeId: 'a', text: 'hello there' },
        { slideId, shapeId: 't', table: [{ row: 0, col: 0, text: 'X' }] },
      ],
    });
    const shapes = state.slides.find((s) => s.id === slideId)!.shapes;
    expect(shapes[0]!.text!.text).toBe('hello there');
    expect(shapes[1]!.table!.cells[0]![0]!.text).toBe('X');
    expect(shapes[1]!.table!.cells[0]![1]!.text).toBe('bar');
  });
});
