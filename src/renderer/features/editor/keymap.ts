import { useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';

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
