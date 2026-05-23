"use client";

import type { RefObject } from "react";
import { Play } from "lucide-react";

import type { MediaItem } from "@/entities/media/model/media.types";
import { MediaCache } from "@/shared/media-cache/model/MediaCache";
import { Badge } from "@/shared/ui/badge";

import { MediaRenderer } from "./MediaRenderer";
import { useMediaVisibilityStage } from "../hooks/use-media-visibility-stage";

type Props = {
  item: MediaItem;
  width: number;
  rootRef: RefObject<HTMLElement | null>;
  mediaCache: MediaCache;
  isFastScrolling: boolean;
  isMediaLoadingDeferred: boolean;
  onCacheChange: () => void;
};

export function MediaCard({
  item,
  width,
  rootRef,
  mediaCache,
  isFastScrolling,
  isMediaLoadingDeferred,
  onCacheChange,
}: Props) {
  const { elementRef, stage } = useMediaVisibilityStage(rootRef);

  return (
    <article
      ref={elementRef}
      className="group relative h-full w-full overflow-hidden rounded-xl border border-white/10 bg-neutral-950 shadow-[0_18px_50px_rgba(0,0,0,0.32)]"
    >
      <MediaRenderer
        item={item}
        width={width}
        stage={stage}
        rootRef={rootRef}
        mediaCache={mediaCache}
        isFastScrolling={isFastScrolling}
        isMediaLoadingDeferred={isMediaLoadingDeferred}
        onCacheChange={onCacheChange}
      />
      {item.type === "video" ? (
        <div className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur">
          <Play className="ml-0.5 size-4 fill-white" aria-hidden="true" />
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-3">
        <div className="flex items-center justify-between gap-2">
          <Badge>{item.type}</Badge>
          <span className="font-mono text-[11px] text-white/45">
            {item.width}x{item.height}
          </span>
        </div>
        <div className="mt-2 truncate text-sm font-medium text-white">{item.title}</div>
      </div>
    </article>
  );
}
