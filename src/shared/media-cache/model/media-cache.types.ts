export type CachedAsset = {
  objectUrl: string;
  width?: number;
  bytes: number;
  createdAt: number;
  lastAccessedAt: number;
};

export type VideoPlaybackState = {
  currentTime: number;
  duration?: number;
  metadataLoaded: boolean;
  canPlay: boolean;
  status: "idle" | "loading" | "loaded" | "error";
};

export type MediaCacheEntry = {
  id: string;
  lastAccessedAt: number;
  totalBytes: number;
  image?: {
    bestLoadedWidth: number;
    asset: CachedAsset;
    status: "loading" | "loaded" | "error";
  };
  poster?: {
    bestLoadedWidth: number;
    asset: CachedAsset;
    status: "loading" | "loaded" | "error";
  };
  video?: VideoPlaybackState & {
    asset?: CachedAsset;
  };
};

export type MediaCacheStats = {
  entries: number;
  imageEntries: number;
  posterEntries: number;
  videoEntries: number;
  totalBytes: number;
};

export type MediaCacheOptions = {
  maxBytes: number;
  maxImageEntries: number;
  maxPosterEntries: number;
  maxVideoEntries: number;
};
