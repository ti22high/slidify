/// <reference types="vite/client" />
import type { SlidifyApi } from '../shared/ipc';

declare global {
  interface Window {
    slidify: SlidifyApi;
  }
}

export {};
