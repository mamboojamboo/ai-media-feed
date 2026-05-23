import type { CachedAsset } from "../model/media-cache.types";

export function createObjectUrl(blob: Blob, width?: number): CachedAsset {
  const now = Date.now();

  return {
    objectUrl: URL.createObjectURL(blob),
    width,
    bytes: blob.size,
    createdAt: now,
    lastAccessedAt: now,
  };
}
