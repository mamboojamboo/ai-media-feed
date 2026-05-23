export type MediaType = "image" | "video";

export type MediaSource = {
  width: number;
  height?: number;
  url: string;
  mimeType?: string;
};

export type MediaItem = {
  id: string;
  type: MediaType;
  title: string;
  width: number;
  height: number;
  aspectRatio: number;
  sources: MediaSource[];
  posterSources?: MediaSource[];
  durationMs?: number;
  tags: string[];
};
