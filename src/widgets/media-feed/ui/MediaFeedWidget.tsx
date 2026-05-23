"use client";

import * as React from "react";

import type { MediaItem } from "@/entities/media/model/media.types";
import type { FeedDensity } from "@/features/feed-density-control/model/feed-density.types";
import {
  type MediaFeedMetrics,
  type VirtualizedJustifiedFeedHandle,
  VirtualizedJustifiedFeed,
} from "@/features/justified-media-feed/ui/VirtualizedJustifiedFeed";

import { MediaFeedDebugPanel } from "./MediaFeedDebugPanel";
import { MediaFeedHeader } from "./MediaFeedHeader";

type Props = {
  mediaItems: MediaItem[];
};

const INITIAL_METRICS: MediaFeedMetrics = {
  items: 0,
  rows: 0,
  visibleRows: 0,
  mountedItems: 0,
  density: 4,
  scrollVelocity: 0,
  isFastScrolling: false,
  isMediaLoadingDeferred: false,
  cacheEntries: 0,
  cacheStateEntries: 0,
  cacheSizeMb: 0,
};

export function MediaFeedWidget({ mediaItems }: Props) {
  const [density, setDensity] = React.useState<FeedDensity>(4);
  const [metrics, setMetrics] = React.useState<MediaFeedMetrics>({
    ...INITIAL_METRICS,
    items: mediaItems.length,
  });
  const feedRef = React.useRef<VirtualizedJustifiedFeedHandle | null>(null);

  const handleDensityChange = React.useCallback((nextDensity: FeedDensity) => {
    feedRef.current?.captureAnchor();
    setDensity(nextDensity);
  }, []);

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <MediaFeedHeader
        metrics={metrics}
        density={density}
        onDensityChange={handleDensityChange}
      />
      <VirtualizedJustifiedFeed
        ref={feedRef}
        mediaItems={mediaItems}
        density={density}
        onMetricsChange={setMetrics}
      />
      <MediaFeedDebugPanel metrics={metrics} />
    </main>
  );
}
