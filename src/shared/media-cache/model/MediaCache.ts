import { createObjectUrl } from "../lib/create-object-url";
import { sortLruCandidates, type LruCandidate } from "../lib/lru-eviction";
import type {
  CachedAsset,
  MediaCacheEntry,
  MediaCacheOptions,
  MediaCacheStats,
  VideoPlaybackState,
} from "./media-cache.types";

const DEFAULT_OPTIONS: MediaCacheOptions = {
  maxBytes: 150 * 1024 * 1024,
  maxImageEntries: 300,
  maxPosterEntries: 300,
};

function touchAsset(asset: CachedAsset) {
  asset.lastAccessedAt = Date.now();
  return asset;
}

function getInitialVideoState(): VideoPlaybackState {
  return {
    currentTime: 0,
    metadataLoaded: false,
    canPlay: false,
    status: "idle",
  };
}

function hasAsset(entry: MediaCacheEntry) {
  return Boolean(entry.image?.asset || entry.poster?.asset);
}

export class MediaCache {
  private readonly entries = new Map<string, MediaCacheEntry>();
  private readonly options: MediaCacheOptions;

  constructor(options: Partial<MediaCacheOptions> = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  get(id: string): MediaCacheEntry | undefined {
    const entry = this.entries.get(id);

    if (entry) {
      entry.lastAccessedAt = Date.now();
    }

    return entry;
  }

  set(id: string, patch: Partial<MediaCacheEntry>): void {
    const entry = this.ensureEntry(id);
    const nextEntry = {
      ...entry,
      ...patch,
      id,
      lastAccessedAt: Date.now(),
    };

    nextEntry.totalBytes = this.getEntryBytes(nextEntry);
    this.entries.set(id, nextEntry);
    this.evictIfNeeded();
  }

  getBestImage(id: string, requestedWidth: number): CachedAsset | undefined {
    const entry = this.get(id);

    if (
      entry?.image?.status === "loaded" &&
      entry.image.bestLoadedWidth >= requestedWidth
    ) {
      return touchAsset(entry.image.asset);
    }

    return undefined;
  }

  putImage(id: string, width: number, blob: Blob): CachedAsset {
    const entry = this.ensureEntry(id);
    const previousAsset = entry.image?.asset;
    const asset = createObjectUrl(blob, width);

    if (previousAsset) {
      URL.revokeObjectURL(previousAsset.objectUrl);
    }

    entry.image = {
      bestLoadedWidth: width,
      asset,
      status: "loaded",
    };
    this.commitEntry(entry);
    this.evictIfNeeded();

    return asset;
  }

  getBestPoster(id: string, requestedWidth: number): CachedAsset | undefined {
    const entry = this.get(id);

    if (
      entry?.poster?.status === "loaded" &&
      entry.poster.bestLoadedWidth >= requestedWidth
    ) {
      return touchAsset(entry.poster.asset);
    }

    return undefined;
  }

  putPoster(id: string, width: number, blob: Blob): CachedAsset {
    const entry = this.ensureEntry(id);
    const previousAsset = entry.poster?.asset;
    const asset = createObjectUrl(blob, width);

    if (previousAsset) {
      URL.revokeObjectURL(previousAsset.objectUrl);
    }

    entry.poster = {
      bestLoadedWidth: width,
      asset,
      status: "loaded",
    };
    this.commitEntry(entry);
    this.evictIfNeeded();

    return asset;
  }

  getVideoState(id: string): VideoPlaybackState | undefined {
    return this.get(id)?.video;
  }

  updateVideoState(id: string, state: Partial<VideoPlaybackState>): void {
    const entry = this.ensureEntry(id);

    entry.video = {
      ...getInitialVideoState(),
      ...entry.video,
      ...state,
    };
    this.commitEntry(entry);
  }

  evictIfNeeded(): void {
    let stats = this.getStats();
    const candidates = sortLruCandidates(this.getLruCandidates());

    while (
      candidates.length &&
      (stats.totalBytes > this.options.maxBytes ||
        stats.imageEntries > this.options.maxImageEntries ||
        stats.posterEntries > this.options.maxPosterEntries)
    ) {
      const candidate = candidates.shift();

      if (!candidate) {
        break;
      }

      this.removeAsset(candidate);
      stats = this.getStats();
    }
  }

  dispose(): void {
    for (const entry of this.entries.values()) {
      if (entry.image?.asset) {
        URL.revokeObjectURL(entry.image.asset.objectUrl);
      }

      if (entry.poster?.asset) {
        URL.revokeObjectURL(entry.poster.asset.objectUrl);
      }

    }

    this.entries.clear();
  }

  getStats(): MediaCacheStats {
    const entries = [...this.entries.values()];
    const assetEntries = entries.filter(hasAsset).length;

    return {
      entries: entries.length,
      assetEntries,
      stateOnlyEntries: entries.length - assetEntries,
      imageEntries: entries.filter((entry) => entry.image?.asset).length,
      posterEntries: entries.filter((entry) => entry.poster?.asset).length,
      totalBytes: entries.reduce((sum, entry) => sum + this.getEntryBytes(entry), 0),
    };
  }

  private ensureEntry(id: string) {
    const entry = this.entries.get(id);

    if (entry) {
      entry.lastAccessedAt = Date.now();
      return entry;
    }

    const nextEntry: MediaCacheEntry = {
      id,
      lastAccessedAt: Date.now(),
      totalBytes: 0,
    };

    this.entries.set(id, nextEntry);

    return nextEntry;
  }

  private commitEntry(entry: MediaCacheEntry) {
    entry.lastAccessedAt = Date.now();
    entry.totalBytes = this.getEntryBytes(entry);
    this.entries.set(entry.id, entry);
  }

  private getEntryBytes(entry: MediaCacheEntry) {
    return (entry.image?.asset.bytes ?? 0) + (entry.poster?.asset.bytes ?? 0);
  }

  private getLruCandidates(): LruCandidate[] {
    const candidates: LruCandidate[] = [];

    for (const entry of this.entries.values()) {
      if (entry.image?.asset) {
        candidates.push({
          id: entry.id,
          kind: "image",
          lastAccessedAt: entry.image.asset.lastAccessedAt,
          bytes: entry.image.asset.bytes,
        });
      }

      if (entry.poster?.asset) {
        candidates.push({
          id: entry.id,
          kind: "poster",
          lastAccessedAt: entry.poster.asset.lastAccessedAt,
          bytes: entry.poster.asset.bytes,
        });
      }

    }

    return candidates;
  }

  private removeAsset(candidate: LruCandidate) {
    const entry = this.entries.get(candidate.id);

    if (!entry) {
      return;
    }

    if (candidate.kind === "image" && entry.image?.asset) {
      URL.revokeObjectURL(entry.image.asset.objectUrl);
      entry.image = undefined;
    }

    if (candidate.kind === "poster" && entry.poster?.asset) {
      URL.revokeObjectURL(entry.poster.asset.objectUrl);
      entry.poster = undefined;
    }

    this.commitEntry(entry);

    if (!entry.image && !entry.poster && !entry.video) {
      this.entries.delete(entry.id);
    }
  }

}
