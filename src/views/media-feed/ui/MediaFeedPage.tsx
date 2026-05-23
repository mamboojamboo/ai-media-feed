"use client";

import type { MediaItem } from "@/entities/media/model/media.types";
import { MediaFeedWidget } from "@/widgets/media-feed/ui/MediaFeedWidget";

type Props = {
  mediaItems: MediaItem[];
};

export function MediaFeedPage({ mediaItems }: Props) {
  return <MediaFeedWidget mediaItems={mediaItems} />;
}
