import { FormatBar } from './FormatBar';
import { Inspector } from './Inspector';
import { Ribbon } from './Ribbon';
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
      className="grid h-full w-full bg-slate-950 text-slate-100"
      style={{
        gridTemplateRows: '48px 40px 1fr 32px',
        gridTemplateColumns: '220px 1fr 280px',
        gridTemplateAreas: `
          "ribbon ribbon ribbon"
          "format format format"
          "sidebar canvas inspector"
          "status status status"
        `,
      }}
    >
      <div style={{ gridArea: 'ribbon' }}>
        <Ribbon />
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
    </div>
  );
}
