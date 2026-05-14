import { BrowserWindow, dialog } from 'electron';
import { promises as fs } from 'node:fs';

/**
 * Export the deck to PDF via webContents.printToPDF on a hidden BrowserWindow.
 *
 * The hidden window loads a renderer route that lays out every slide one-per-page
 * sized to the slide aspect ratio. The caller passes the file:// URL of the
 * print-ready page (built by electron-vite); in dev this is the dev-server URL
 * with `?print=1`, in packaged builds it's the local index.html.
 */
export interface PrintToPdfOptions {
  /** URL of the print-ready renderer page. */
  rendererUrl: string;
  /** Slide width in inches — defaults to 13.333 (the 16:9 standard). */
  pageWidthIn?: number;
  pageHeightIn?: number;
}

export async function printDeckToPdf(opts: PrintToPdfOptions): Promise<Uint8Array> {
  const w = opts.pageWidthIn ?? 13.333;
  const h = opts.pageHeightIn ?? 7.5;
  const win = new BrowserWindow({
    show: false,
    width: Math.round(w * 96),
    height: Math.round(h * 96),
    webPreferences: { sandbox: true, offscreen: true },
  });
  try {
    await win.loadURL(opts.rendererUrl);
    const buf = await win.webContents.printToPDF({
      pageSize: { width: w * 25400, height: h * 25400 } as Electron.PrintToPDFOptions['pageSize'],
      printBackground: true,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    return new Uint8Array(buf);
  } finally {
    win.destroy();
  }
}

export async function exportPdfWithDialog(
  rendererUrl: string,
  defaultName: string,
): Promise<string | null> {
  const result = await dialog.showSaveDialog({
    title: 'Export PDF',
    defaultPath: defaultName,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (result.canceled || !result.filePath) return null;
  const bytes = await printDeckToPdf({ rendererUrl });
  await fs.writeFile(result.filePath, bytes);
  return result.filePath;
}
