import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join } from 'node:path';
import { listFontAssets } from './fonts';
import { appendOp, flushAll } from './persistence/wal';
import { clearCleanShutdownMarker, markCleanShutdown, writeSnapshot } from './persistence/snapshot';
import { discardSession, loadSession, scanRecoverableSessions } from './persistence/recovery';
import { readAllRows } from './xlsx/xlsxReader';
import type { XlsxImportResult } from '../shared/ipc';

const __dirname = dirname(fileURLToPath(import.meta.url));

const isDev = !app.isPackaged;

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    title: 'Slidify',
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0f1115',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  const devServerUrl = process.env['ELECTRON_RENDERER_URL'];
  if (isDev && devServerUrl) {
    void window.loadURL(devServerUrl);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}

const activeDocIds = new Set<string>();

function registerIpcHandlers(): void {
  ipcMain.handle('slidify:getVersion', () => app.getVersion());
  ipcMain.handle('slidify:getPlatform', () => process.platform);
  ipcMain.handle('slidify:listFonts', () => listFontAssets());

  ipcMain.handle('slidify:autosave/append', async (_e, docId: string, op: unknown) => {
    activeDocIds.add(docId);
    await clearCleanShutdownMarker(docId);
    await appendOp(docId, op);
  });
  ipcMain.handle('slidify:autosave/snapshot', async (_e, docId: string, state: unknown) => {
    activeDocIds.add(docId);
    await writeSnapshot(docId, state);
  });
  ipcMain.handle('slidify:autosave/markClean', async (_e, docId: string) => {
    activeDocIds.add(docId);
    await markCleanShutdown(docId);
  });
  ipcMain.handle('slidify:recovery/scan', () => scanRecoverableSessions());
  ipcMain.handle('slidify:recovery/load', (_e, docId: string) => loadSession(docId));
  ipcMain.handle('slidify:recovery/discard', (_e, docId: string) => discardSession(docId));

  ipcMain.handle(
    'slidify:xlsx/pickAndImport',
    async (_e, sheet?: string): Promise<XlsxImportResult | null> => {
      const result = await dialog.showOpenDialog({
        title: 'Import XLSX',
        properties: ['openFile'],
        filters: [{ name: 'Excel', extensions: ['xlsx', 'xlsm'] }],
      });
      if (result.canceled || result.filePaths.length === 0) return null;
      const filePath = result.filePaths[0]!;
      const rows = await readAllRows(filePath, sheet);
      const [header, ...rest] = rows;
      const headers = (header ?? []).map((h) => (h === null ? '' : String(h)));
      return {
        sheetNames: [sheet ?? 'Sheet1'],
        sheetName: sheet ?? 'Sheet1',
        headers,
        rows: rest,
        dataRef: `data/${basename(filePath)}`,
      };
    },
  );
}

void app.whenReady().then(() => {
  registerIpcHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('before-quit', async (e) => {
  if (activeDocIds.size === 0) return;
  e.preventDefault();
  try {
    await flushAll();
    await Promise.all(Array.from(activeDocIds).map(markCleanShutdown));
  } finally {
    activeDocIds.clear();
    app.exit(0);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
