import { useEffect } from 'react';
import { nextShapeId, useEditorStore } from '../../store/editorStore';
import { useUiStore } from '../../store/uiStore';
import type { Shape } from '../../model/shape';

const clipboard: { shapes: Shape[] } = { shapes: [] };

function cloneShape(s: Shape): Shape {
  return {
    ...s,
    id: nextShapeId(),
    text: s.text ? { ...s.text } : undefined,
    image: s.image ? { ...s.image } : undefined,
    table: s.table
      ? { ...s.table, cells: s.table.cells.map((r) => r.map((c) => ({ ...c }))) }
      : undefined,
    data: s.data ? { ...s.data } : undefined,
    chart: s.chart ? { ...s.chart, series: s.chart.series.map((x) => ({ ...x })) } : undefined,
    animations: s.animations ? s.animations.map((a) => ({ ...a })) : undefined,
  };
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Global keyboard shortcuts for the editor.
 *
 * - ArrowUp / ArrowLeft: previous slide
 * - ArrowDown / ArrowRight: next slide
 * - Cmd/Ctrl+D: duplicate selected slide
 * - Delete / Backspace: delete selected shapes, or the slide if none selected
 *
 * Ignored while a form field or contentEditable surface owns focus.
 */
export function useGlobalKeymap(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Find & replace works from anywhere — even while typing in a text field.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        useUiStore.getState().setFindReplaceOpen(true);
        return;
      }
      if (isEditableTarget(e.target)) return;
      const state = useEditorStore.getState();
      const { slides, selectedSlideId, selectedShapeIds } = state;
      const idx = slides.findIndex((s) => s.id === selectedSlideId);

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const target = slides[Math.max(0, idx - 1)];
        if (target) state.dispatch({ type: 'slide/select', slideId: target.id });
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const target = slides[Math.min(slides.length - 1, idx + 1)];
        if (target) state.dispatch({ type: 'slide/select', slideId: target.id });
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        state.dispatch({ type: 'slide/duplicate', slideId: selectedSlideId });
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        state.dispatch({ type: e.shiftKey ? 'redo' : 'undo' });
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        state.dispatch({ type: 'redo' });
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        if (selectedShapeIds.length === 0) return;
        e.preventDefault();
        const slide = slides.find((s) => s.id === selectedSlideId);
        if (!slide) return;
        clipboard.shapes = slide.shapes
          .filter((s) => selectedShapeIds.includes(s.id))
          .map((s) => ({ ...s }));
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'x') {
        if (selectedShapeIds.length === 0) return;
        e.preventDefault();
        const slide = slides.find((s) => s.id === selectedSlideId);
        if (!slide) return;
        clipboard.shapes = slide.shapes
          .filter((s) => selectedShapeIds.includes(s.id))
          .map((s) => ({ ...s }));
        state.dispatch({
          type: 'shape/delete',
          slideId: selectedSlideId,
          shapeIds: selectedShapeIds,
        });
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        if (clipboard.shapes.length === 0) return;
        e.preventDefault();
        const newIds: string[] = [];
        for (const s of clipboard.shapes) {
          const c = cloneShape(s);
          c.x = s.x + 200000;
          c.y = s.y + 200000;
          newIds.push(c.id);
          state.dispatch({ type: 'shape/add', slideId: selectedSlideId, shape: c });
        }
        state.dispatch({ type: 'selection/set', shapeIds: newIds });
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const slide = slides.find((s) => s.id === selectedSlideId);
        if (!slide) return;
        state.dispatch({
          type: 'selection/set',
          shapeIds: slide.shapes.map((s) => s.id),
        });
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        state.dispatch({ type: 'zoom/set', value: state.zoom * 1.1 });
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        state.dispatch({ type: 'zoom/set', value: state.zoom / 1.1 });
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        state.dispatch({ type: 'zoom/set', value: 1 });
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedShapeIds.length > 0) {
          state.dispatch({
            type: 'shape/delete',
            slideId: selectedSlideId,
            shapeIds: selectedShapeIds,
          });
        } else {
          state.dispatch({ type: 'slide/delete', slideId: selectedSlideId });
        }
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
