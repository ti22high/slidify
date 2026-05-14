import { SLIDE_HEIGHT_EMU, SLIDE_WIDTH_EMU } from '../../../shared/emu';
import { nextShapeId, useEditorStore } from '../../store/editorStore';
import { useDataStore } from '../../store/dataStore';
import type { Shape } from '../../model/shape';

export async function importXlsxIntoSlide(slideId: string): Promise<string | null> {
  if (typeof window === 'undefined' || !window.slidify?.xlsxPickAndImport) return null;
  const result = await window.slidify.xlsxPickAndImport();
  if (!result) return null;
  const datasetId = `ds-${Date.now().toString(36)}`;
  useDataStore.getState().upsertDataset({
    id: datasetId,
    dataRef: result.dataRef,
    sheetName: result.sheetName,
    headers: result.headers,
    rows: result.rows,
  });
  const w = 7 * 914400;
  const h = 4 * 914400;
  const shape: Shape = {
    id: nextShapeId(),
    kind: 'data',
    x: (SLIDE_WIDTH_EMU - w) / 2,
    y: (SLIDE_HEIGHT_EMU - h) / 2,
    w,
    h,
    rotation: 0,
    fill: 'none',
    stroke: '#334155',
    strokeWidth: 9525,
    data: { datasetId, dataRef: result.dataRef, sheetName: result.sheetName, rowLimit: 50 },
  };
  useEditorStore.getState().dispatch({ type: 'shape/add', slideId, shape });
  return shape.id;
}
