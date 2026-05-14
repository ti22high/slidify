export interface SlidifyApi {
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<NodeJS.Platform>;
}

declare global {
  interface Window {
    slidify: SlidifyApi;
  }
}
