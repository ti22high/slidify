import { contextBridge, ipcRenderer } from 'electron';
import type { PersistedOp, SlidifyApi } from '../shared/ipc';

const api: SlidifyApi = {
  getVersion: () => ipcRenderer.invoke('slidify:getVersion'),
  getPlatform: () => ipcRenderer.invoke('slidify:getPlatform'),
  listFonts: () => ipcRenderer.invoke('slidify:listFonts'),
  autosaveAppend: (docId: string, op: PersistedOp) =>
    ipcRenderer.invoke('slidify:autosave/append', docId, op),
  autosaveSnapshot: (docId: string, state: unknown) =>
    ipcRenderer.invoke('slidify:autosave/snapshot', docId, state),
  autosaveMarkClean: (docId: string) => ipcRenderer.invoke('slidify:autosave/markClean', docId),
  recoveryScan: () => ipcRenderer.invoke('slidify:recovery/scan'),
  recoveryLoad: (docId: string) => ipcRenderer.invoke('slidify:recovery/load', docId),
  recoveryDiscard: (docId: string) => ipcRenderer.invoke('slidify:recovery/discard', docId),
  xlsxPickAndImport: (sheet?: string) => ipcRenderer.invoke('slidify:xlsx/pickAndImport', sheet),
  saveDoc: (args) => ipcRenderer.invoke('slidify:file/save', args),
  openDoc: () => ipcRenderer.invoke('slidify:file/open'),
  onMenuCommand: (handler) => {
    const map: Record<string, 'new' | 'open' | 'save' | 'saveAs'> = {
      'slidify:menu/new': 'new',
      'slidify:menu/open': 'open',
      'slidify:menu/save': 'save',
      'slidify:menu/saveAs': 'saveAs',
    };
    const channels = Object.keys(map);
    const wrapped: Record<string, (...args: unknown[]) => void> = {};
    for (const ch of channels) {
      wrapped[ch] = () => handler(map[ch]!);
      ipcRenderer.on(ch, wrapped[ch]!);
    }
    return () => {
      for (const ch of channels) ipcRenderer.removeListener(ch, wrapped[ch]!);
    };
  },
};

contextBridge.exposeInMainWorld('slidify', api);
