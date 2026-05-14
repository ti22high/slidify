export interface FontAsset {
  family: string;
  weight: number;
  style: 'normal' | 'italic';
  url: string;
}

export interface PersistedOp {
  ts: number;
  action: unknown;
}

export interface RecoverableSessionInfo {
  docId: string;
  walMtime: number;
  ops: number;
}

export interface RecoveredSessionPayload {
  docId: string;
  snapshotState: unknown | null;
  ops: PersistedOp[];
}

export type XlsxCellValue = string | number | boolean | null;

export interface XlsxImportResult {
  sheetNames: string[];
  sheetName: string;
  headers: string[];
  rows: XlsxCellValue[][];
  /** Path inside the future .slidify ZIP (`data/<basename>`). */
  dataRef: string;
}

export interface SaveDocArgs {
  targetPath: string | null;
  state: unknown;
  media: { mediaRef: string; bytes: ArrayBuffer; mime: string }[];
}

export interface SaveDocResult {
  path: string;
}

export interface OpenDocResult {
  path: string;
  state: unknown;
  media: { mediaRef: string; bytes: ArrayBuffer; mime: string }[];
}

export interface SlidifyApi {
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<NodeJS.Platform>;
  listFonts: () => Promise<FontAsset[]>;
  autosaveAppend: (docId: string, op: PersistedOp) => Promise<void>;
  autosaveSnapshot: (docId: string, state: unknown) => Promise<void>;
  autosaveMarkClean: (docId: string) => Promise<void>;
  recoveryScan: () => Promise<RecoverableSessionInfo[]>;
  recoveryLoad: (docId: string) => Promise<RecoveredSessionPayload>;
  recoveryDiscard: (docId: string) => Promise<void>;
  xlsxPickAndImport: (sheet?: string) => Promise<XlsxImportResult | null>;
  saveDoc: (args: SaveDocArgs) => Promise<SaveDocResult | null>;
  openDoc: () => Promise<OpenDocResult | null>;
  onMenuCommand: (handler: (cmd: 'new' | 'open' | 'save' | 'saveAs') => void) => () => void;
}

declare global {
  interface Window {
    slidify: SlidifyApi;
  }
}
