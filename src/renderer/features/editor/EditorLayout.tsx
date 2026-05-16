import { AnimationsPanel } from './AnimationsPanel';
import { FindReplacePanel } from '../findReplace/FindReplacePanel';
import { ShapeLibraryPanel } from '../canvas/ShapeLibraryPanel';
import { FormatBar } from './FormatBar';
import { Inspector } from './Inspector';
import { MenuBar } from './MenuBar';
import { SlideCanvas } from './SlideCanvas';
import { StatusBar } from './StatusBar';
import { ThumbnailSidebar } from './ThumbnailSidebar';
import { ContextMenu } from './ContextMenu';
import { useGlobalKeymap } from './keymap';
import { useAutosaveBridge } from '../persistence/autosaveBridge';
import { useDirtyTracker, useFileMenuCommands } from '../persistence/fileOps';
import { RecoveryDialog } from '../recovery/RecoveryDialog';

export function EditorLayout(): JSX.Element {
  useGlobalKeymap();
  useAutosaveBridge();
  useFileMenuCommands();
  useDirtyTracker();
  return (
    <div
      className="relative grid h-full w-full bg-slate-950 text-slate-100"
      style={{
        gridTemplateRows: '36px 40px 1fr 32px',
        gridTemplateColumns: '220px 1fr 280px',
        gridTemplateAreas: `
          "menubar menubar menubar"
          "format format format"
          "sidebar canvas inspector"
          "status status status"
        `,
      }}
    >
      <div style={{ gridArea: 'menubar' }}>
        <MenuBar />
      </div>
      <div style={{ gridArea: 'format' }}>
        <FormatBar />
      </div>
      <div style={{ gridArea: 'sidebar' }} className="overflow-hidden">
        <ThumbnailSidebar />
      </div>
      <div style={{ gridArea: 'canvas' }} className="overflow-hidden">
        <SlideCanvas />
      </div>
      <div style={{ gridArea: 'inspector' }} className="overflow-hidden">
        <Inspector />
      </div>
      <div style={{ gridArea: 'status' }}>
        <StatusBar />
      </div>
      <RecoveryDialog />
      <ContextMenu />
      <AnimationsPanel />
      <FindReplacePanel />
      <ShapeLibraryPanel />
    </div>
  );
}
