import type { MediaItem } from "../model/media.types";

export function getMediaAspectRatio(item: MediaItem) {
  return item.aspectRatio || item.width / item.height;
}
