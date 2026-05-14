export interface FontAsset {
  family: string;
  weight: number;
  style: 'normal' | 'italic';
  url: string;
}

export interface SlidifyApi {
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<NodeJS.Platform>;
  listFonts: () => Promise<FontAsset[]>;
}

declare global {
  interface Window {
    slidify: SlidifyApi;
  }
}
