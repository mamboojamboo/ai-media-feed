"use client";

import type { MediaItem } from "@/entities/media/model/media.types";

type Props = {
  mediaItems: MediaItem[];
};

export function MediaFeedWidget({ mediaItems }: Props) {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/40">
          AI Media Feed
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Justified mixed media gallery
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
          {mediaItems.length.toLocaleString("en-US")} validated media items are ready for the
          virtualized feed.
        </p>
      </div>
    </main>
  );
}
