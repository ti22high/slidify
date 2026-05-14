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
}

declare global {
  interface Window {
    slidify: SlidifyApi;
  }
}
