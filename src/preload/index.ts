import { contextBridge, ipcRenderer } from 'electron';
import type { SlidifyApi } from '../shared/ipc';

const api: SlidifyApi = {
  getVersion: () => ipcRenderer.invoke('slidify:getVersion'),
  getPlatform: () => ipcRenderer.invoke('slidify:getPlatform'),
  listFonts: () => ipcRenderer.invoke('slidify:listFonts'),
};

contextBridge.exposeInMainWorld('slidify', api);
