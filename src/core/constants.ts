import type { Format } from './types';

export const MIME: Record<Format, string> = {
  jpeg: 'image/jpeg', webp: 'image/webp', png: 'image/png',
};

export const QUALITY: Record<Format, number> = {
  jpeg: 0.82, webp: 0.8, png: 1,
};

export const IMAGE_MAX_EDGE = 2048;
export const VIDEO_FRAME_MAX_EDGE = 1280;

// Frame count / cols / rows now come from the density table (see core/density.ts); GRID only
// governs how a clip's duration fans out into multiple sheets.
export const GRID = {
  maxSheets: 4,
  secondsPerSheet: 90,
} as const;

export const STORAGE_KEYS = {
  format: 'squish.format',
  count: 'squish.count',
  saved: 'squish.saved',
} as const;
