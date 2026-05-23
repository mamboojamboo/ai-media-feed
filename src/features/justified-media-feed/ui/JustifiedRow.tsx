"use client";

import type { CSSProperties, RefObject } from "react";

import type { MediaItem } from "@/entities/media/model/media.types";
import { MediaCache } from "@/shared/media-cache/model/MediaCache";

import { MediaCard } from "./MediaCard";
import type { JustifiedRow as JustifiedRowType } from "../model/justified-feed.types";

type Props = {
  row: JustifiedRowType;
  itemsById: Map<string, MediaItem>;
  rootRef: RefObject<HTMLElement | null>;
  mediaCache: MediaCache;
  isFastScrolling: boolean;
  isMediaLoadingDeferred: boolean;
  onCacheChange: () => void;
  style?: CSSProperties;
};

export function JustifiedRow({
  row,
  itemsById,
  rootRef,
  mediaCache,
  isFastScrolling,
  isMediaLoadingDeferred,
  onCacheChange,
  style,
}: Props) {
  return (
    <div style={{ ...style, height: row.height }}>
      {row.items.map((rowItem) => {
        const item = itemsById.get(rowItem.id);

        if (!item) {
          return null;
        }

        return (
          <div
            key={rowItem.id}
            className="absolute top-0"
            style={{
              left: rowItem.x,
              width: rowItem.width,
              height: rowItem.height,
            }}
          >
            <MediaCard
              item={item}
              width={rowItem.width}
              rootRef={rootRef}
              mediaCache={mediaCache}
              isFastScrolling={isFastScrolling}
              isMediaLoadingDeferred={isMediaLoadingDeferred}
              onCacheChange={onCacheChange}
            />
          </div>
        );
      })}
    </div>
  );
}
