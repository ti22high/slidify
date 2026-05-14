import { useEffect } from 'react';
import { SLIDE_HEIGHT_EMU, SLIDE_WIDTH_EMU } from '../../../shared/emu';
import { nextShapeId, useEditorStore } from '../../store/editorStore';
import type { Shape, ShapeId } from '../../model/shape';
import { applyLoaded } from '../persistence/fileOps';
import { unpackDocumentBytes } from '../persistence/unpackInRenderer';
import { registerBlob } from './mediaCache';

const ACCEPTED_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

async function sha1Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  const view = new Uint8Array(digest);
  let hex = '';
  for (const b of view) hex += b.toString(16).padStart(2, '0');
  return hex;
}

async function readIntrinsicSize(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 1, height: 1 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export async function insertImageFromFile(file: File, slideId: string): Promise<ShapeId | null> {
  if (!ACCEPTED_MIMES.has(file.type)) return null;
  const bytes = await file.arrayBuffer();
  const hash = (await sha1Hex(bytes)).slice(0, 16);
  const ext = EXT_BY_MIME[file.type] ?? 'bin';
  const mediaRef = `media/img-${hash}.${ext}`;
  registerBlob(mediaRef, new Blob([bytes], { type: file.type }));
  const { width, height } = await readIntrinsicSize(new Blob([bytes], { type: file.type }));
  const aspect = height / width;

  // Default 4-inch wide image, centred.
  const w = 4 * 914400;
  const h = w * aspect;
  const shape: Shape = {
    id: nextShapeId(),
    kind: 'image',
    x: (SLIDE_WIDTH_EMU - w) / 2,
    y: (SLIDE_HEIGHT_EMU - h) / 2,
    w,
    h,
    rotation: 0,
    fill: 'none',
    stroke: 'none',
    strokeWidth: 0,
    image: { mediaRef, mime: file.type, naturalWidth: width, naturalHeight: height },
  };
  useEditorStore.getState().dispatch({ type: 'shape/add', slideId, shape });
  return shape.id;
}

interface Props {
  slideId: string;
}

export function ImageDropOverlay({ slideId }: Props): JSX.Element | null {
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer) return;
      if (!Array.from(e.dataTransfer.items).some((i) => i.kind === 'file')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    };
    const onDrop = (e: DragEvent) => {
      if (!e.dataTransfer || e.dataTransfer.files.length === 0) return;
      e.preventDefault();
      for (const file of Array.from(e.dataTransfer.files)) {
        if (file.name.toLowerCase().endsWith('.slidify')) {
          void file
            .arrayBuffer()
            .then(unpackDocumentBytes)
            .then((doc) => applyLoaded(null, doc.state, doc.media))
            .catch((err) => console.error('Slidify open failed:', err));
        } else {
          void insertImageFromFile(file, slideId);
        }
      }
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [slideId]);
  return null;
}
