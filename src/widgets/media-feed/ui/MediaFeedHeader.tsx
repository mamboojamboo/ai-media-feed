"use client";

import { Activity, Database, Rows3 } from "lucide-react";

import type { FeedDensity } from "@/features/feed-density-control/model/feed-density.types";
import { FeedDensityControl } from "@/features/feed-density-control/ui/FeedDensityControl";
import type { MediaFeedMetrics } from "@/features/justified-media-feed/ui/VirtualizedJustifiedFeed";
import { Badge } from "@/shared/ui/badge";

type Props = {
  metrics: MediaFeedMetrics;
  density: FeedDensity;
  onDensityChange: (density: FeedDensity) => void;
};

export function MediaFeedHeader({ metrics, density, onDensityChange }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050507]/88 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/40">
              AI Media Feed
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              Justified mixed media gallery
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/55">
              <Badge>{metrics.items.toLocaleString("en-US")} mixed items</Badge>
              <span className="inline-flex items-center gap-1.5">
                <Rows3 className="size-4" aria-hidden="true" />
                {metrics.rows.toLocaleString("en-US")} rows
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Database className="size-4" aria-hidden="true" />
                cache: {metrics.cacheEntries} items
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Activity className="size-4" aria-hidden="true" />
                fast scroll: {metrics.isFastScrolling ? "on" : "off"}
              </span>
            </div>
          </div>
          <FeedDensityControl value={density} onValueChange={onDensityChange} />
        </div>
      </div>
    </header>
  );
}
