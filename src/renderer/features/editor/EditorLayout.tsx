import { Inspector } from './Inspector';
import { Ribbon } from './Ribbon';
import { SlideCanvas } from './SlideCanvas';
import { StatusBar } from './StatusBar';
import { ThumbnailSidebar } from './ThumbnailSidebar';
import { useGlobalKeymap } from './keymap';

export function EditorLayout(): JSX.Element {
  useGlobalKeymap();
  return (
    <div
      className="grid h-full w-full bg-slate-950 text-slate-100"
      style={{
        gridTemplateRows: '48px 1fr 32px',
        gridTemplateColumns: '220px 1fr 280px',
        gridTemplateAreas: `
          "ribbon ribbon ribbon"
          "sidebar canvas inspector"
          "status status status"
        `,
      }}
    >
      <div style={{ gridArea: 'ribbon' }}>
        <Ribbon />
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
    </div>
  );
}
