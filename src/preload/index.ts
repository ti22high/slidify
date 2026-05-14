import { contextBridge, ipcRenderer } from 'electron';
import type { SlidifyApi } from '../shared/ipc';

const api: SlidifyApi = {
  getVersion: () => ipcRenderer.invoke('slidify:getVersion'),
  getPlatform: () => ipcRenderer.invoke('slidify:getPlatform'),
};

contextBridge.exposeInMainWorld('slidify', api);
