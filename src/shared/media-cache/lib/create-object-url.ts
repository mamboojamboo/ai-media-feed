import type { CachedAsset } from "../model/media-cache.types";

export function createObjectUrl(blob: Blob, width?: number): CachedAsset {
  const now = Date.now();
  const asset = {
    objectUrl: URL.createObjectURL(blob),
    bytes: blob.size,
    createdAt: now,
    lastAccessedAt: now,
  };

  return width === undefined ? asset : { ...asset, width };
}
