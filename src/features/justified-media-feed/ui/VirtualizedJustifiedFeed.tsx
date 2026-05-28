"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { MediaItem } from "@/entities/media/model/media.types";
import { getMediaAspectRatio } from "@/entities/media/lib/get-media-aspect-ratio";
import type { FeedDensity } from "@/features/feed-density-control/model/feed-density.types";
import { cn } from "@/shared/lib/cn";
import { rafThrottle } from "@/shared/lib/raf-throttle";
import { MediaCache } from "@/shared/media-cache/model/MediaCache";
import type { MediaCacheStats } from "@/shared/media-cache/model/media-cache.types";

import { JustifiedRow } from "./JustifiedRow";
import { useContainerSize } from "../hooks/use-container-size";
import { useScrollAnchor } from "../hooks/use-scroll-anchor";
import { useScrollVelocity } from "../hooks/use-scroll-velocity";
import { computeJustifiedRows } from "../lib/compute-justified-rows";
import {
  DEFAULT_ROW_HEIGHT,
  JUSTIFIED_FEED_GAP,
  JUSTIFIED_FEED_OVERSCAN,
  JUSTIFIED_FEED_ROW_GAP,
  ROW_HEIGHT_LIMITS,
} from "../model/justified-feed.config";

export type MediaFeedMetrics = {
  items: number;
  rows: number;
  visibleRows: number;
  mountedItems: number;
  density: FeedDensity;
  scrollVelocity: number;
  isFastScrolling: boolean;
  isMediaLoadingDeferred: boolean;
  cacheEntries: number;
  cacheStateEntries: number;
  cacheSizeMb: number;
};

export type VirtualizedJustifiedFeedHandle = {
  captureAnchor: () => void;
};

type Props = {
  mediaItems: MediaItem[];
  density: FeedDensity;
  onMetricsChange: (metrics: MediaFeedMetrics) => void;
  className?: string;
};

export const VirtualizedJustifiedFeed = React.forwardRef<
  VirtualizedJustifiedFeedHandle,
  Props
>(({ mediaItems, density, onMetricsChange, className }, ref) => {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mediaCache = React.useMemo(() => new MediaCache(), []);
  const [cacheStats, setCacheStats] = React.useState<MediaCacheStats>(() =>
    mediaCache.getStats(),
  );
  const notifyCacheChange = React.useMemo(
    () =>
      rafThrottle(() => {
        setCacheStats((previousStats) => {
          const nextStats = mediaCache.getStats();

          if (
            previousStats.entries === nextStats.entries &&
            previousStats.assetEntries === nextStats.assetEntries &&
            previousStats.stateOnlyEntries === nextStats.stateOnlyEntries &&
            previousStats.imageEntries === nextStats.imageEntries &&
            previousStats.posterEntries === nextStats.posterEntries &&
            previousStats.totalBytes === nextStats.totalBytes
          ) {
            return previousStats;
          }

          return nextStats;
        });
      }),
    [mediaCache],
  );
  const itemsById = React.useMemo(
    () => new Map(mediaItems.map((item) => [item.id, item])),
    [mediaItems],
  );
  const layoutItems = React.useMemo(
    () =>
      mediaItems.map((item) => ({
        id: item.id,
        aspectRatio: getMediaAspectRatio(item),
      })),
    [mediaItems],
  );
  const captureAnchorRef = React.useRef<() => void>(() => undefined);

  const size = useContainerSize(containerRef, {
    onBeforeResize: () => {
      captureAnchorRef.current();
    },
  });
  const activeRows = React.useMemo(
    () =>
      computeJustifiedRows(layoutItems, {
        containerWidth: size.width,
        targetItemsPerRow: density,
        gap: JUSTIFIED_FEED_GAP,
        rowGap: JUSTIFIED_FEED_ROW_GAP,
        minRowHeight: ROW_HEIGHT_LIMITS.min,
        maxRowHeight: ROW_HEIGHT_LIMITS.max,
        maxLastRowHeight: ROW_HEIGHT_LIMITS.maxLast,
      }),
    [density, layoutItems, size.width],
  );
  const scrollVelocity = useScrollVelocity(scrollRef);
  const lastMetricsKeyRef = React.useRef("");

  const rowVirtualizer = useVirtualizer({
    count: activeRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) =>
      (activeRows[index]?.height ?? DEFAULT_ROW_HEIGHT) + JUSTIFIED_FEED_ROW_GAP,
    isScrollingResetDelay: 220,
    overscan: JUSTIFIED_FEED_OVERSCAN,
  });

  React.useLayoutEffect(() => {
    // Row heights are deterministic, but they change whenever the justified layout
    // is recomputed. Clear TanStack Virtual's size cache before anchor restore.
    rowVirtualizer.measure();
  }, [activeRows, rowVirtualizer]);

  const { captureAnchor } = useScrollAnchor({ rows: activeRows, scrollRef });

  React.useEffect(() => {
    captureAnchorRef.current = () => {
      captureAnchor();
    };
  }, [captureAnchor]);

  React.useImperativeHandle(
    ref,
    () => ({
      captureAnchor: () => {
        captureAnchor();
      },
    }),
    [captureAnchor],
  );

  const virtualRows = rowVirtualizer.getVirtualItems();
  const isMediaLoadingDeferred =
    scrollVelocity.isMediaLoadingDeferred || rowVirtualizer.isScrolling;

  React.useEffect(
    () => () => {
      mediaCache.dispose();
    },
    [mediaCache],
  );

  React.useEffect(() => {
    const mountedItems = virtualRows.reduce(
      (sum, virtualRow) => sum + (activeRows[virtualRow.index]?.items.length ?? 0),
      0,
    );
    const nextMetrics: MediaFeedMetrics = {
      items: mediaItems.length,
      rows: activeRows.length,
      visibleRows: virtualRows.length,
      mountedItems,
      density,
      scrollVelocity: scrollVelocity.velocityPxPerMs,
      isFastScrolling: scrollVelocity.isFastScrolling,
      isMediaLoadingDeferred,
      cacheEntries: cacheStats.assetEntries,
      cacheStateEntries: cacheStats.stateOnlyEntries,
      cacheSizeMb: cacheStats.totalBytes / 1024 / 1024,
    };
    const nextMetricsKey = [
      nextMetrics.items,
      nextMetrics.rows,
      nextMetrics.visibleRows,
      nextMetrics.mountedItems,
      nextMetrics.density,
      nextMetrics.scrollVelocity.toFixed(2),
      nextMetrics.isFastScrolling,
      nextMetrics.isMediaLoadingDeferred,
      nextMetrics.cacheEntries,
      nextMetrics.cacheStateEntries,
      nextMetrics.cacheSizeMb.toFixed(1),
    ].join(":");

    if (lastMetricsKeyRef.current !== nextMetricsKey) {
      lastMetricsKeyRef.current = nextMetricsKey;
      onMetricsChange(nextMetrics);
    }
  }, [
    activeRows,
    cacheStats,
    density,
    isMediaLoadingDeferred,
    mediaItems.length,
    onMetricsChange,
    scrollVelocity,
    virtualRows,
  ]);

  return (
    <div ref={scrollRef} className={cn("min-h-0 flex-1 overflow-y-auto", className)}>
      <div ref={containerRef} className="relative mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        {size.width > 0 ? (
          <div
            className="relative"
            style={{
              height: rowVirtualizer.getTotalSize(),
            }}
          >
            {virtualRows.map((virtualRow) => {
              const row = activeRows[virtualRow.index];

              if (!row) {
                return null;
              }

              return (
                <JustifiedRow
                  key={row.id}
                  row={row}
                  itemsById={itemsById}
                  rootRef={scrollRef}
                  mediaCache={mediaCache}
                  isFastScrolling={scrollVelocity.isFastScrolling}
                  isMediaLoadingDeferred={isMediaLoadingDeferred}
                  onCacheChange={notifyCacheChange}
                  style={{
                    position: "absolute",
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="h-[60dvh]" />
        )}
      </div>
    </div>
  );
});

VirtualizedJustifiedFeed.displayName = "VirtualizedJustifiedFeed";
