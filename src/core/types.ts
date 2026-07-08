export type Stage = 'idle' | 'processing' | 'video' | 'ready';
export type Format = 'jpeg' | 'webp' | 'png';

export interface OriginalMeta {
  size: number; // bytes of original input
  type: string; // display label: "HEIC", "MP4 0:03", "GRID 3×3"
}

export interface Dims { w: number; h: number; }

export interface EncodedResult {
  blob: Blob;
  previewUrl: string; // object URL / data URL for the <img> src
  size: number;       // blob.size
  format: Format;
}

export interface Stats { count: number; saved: number; }
