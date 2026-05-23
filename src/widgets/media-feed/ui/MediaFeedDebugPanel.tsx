"use client";

import type { MediaFeedMetrics } from "@/features/justified-media-feed/ui/VirtualizedJustifiedFeed";

type Props = {
  metrics: MediaFeedMetrics;
};

export function MediaFeedDebugPanel({ metrics }: Props) {
  const rows = [
    ["Items", metrics.items.toLocaleString("en-US")],
    ["Rows", metrics.rows.toLocaleString("en-US")],
    ["Visible rows", metrics.visibleRows.toLocaleString("en-US")],
    ["Mounted items", metrics.mountedItems.toLocaleString("en-US")],
    ["Cached assets", metrics.cacheEntries.toLocaleString("en-US")],
    ["State entries", metrics.cacheStateEntries.toLocaleString("en-US")],
    ["Cache size", `${metrics.cacheSizeMb.toFixed(1)} MB`],
    ["Scroll velocity", `${metrics.scrollVelocity.toFixed(2)} px/ms`],
    ["Fast scrolling", String(metrics.isFastScrolling)],
    ["Media deferred", String(metrics.isMediaLoadingDeferred)],
    ["Density", `${metrics.density} items/row`],
  ];

  return (
    <aside className="pointer-events-none fixed bottom-4 right-4 z-30 hidden w-64 rounded-xl border border-white/10 bg-black/70 p-3 font-mono text-[11px] text-white/70 shadow-2xl backdrop-blur lg:block">
      <div className="mb-2 text-xs font-semibold text-white">Debug / perf</div>
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-white/45">{label}</dt>
            <dd className="text-right text-white/80">{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
