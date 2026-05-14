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
};

contextBridge.exposeInMainWorld('slidify', api);
