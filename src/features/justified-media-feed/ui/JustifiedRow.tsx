"use client";

import type { CSSProperties } from "react";

import type { MediaItem } from "@/entities/media/model/media.types";

import { MediaCard } from "./MediaCard";
import type { JustifiedRow as JustifiedRowType } from "../model/justified-feed.types";

type Props = {
  row: JustifiedRowType;
  itemsById: Map<string, MediaItem>;
  style?: CSSProperties;
};

export function JustifiedRow({ row, itemsById, style }: Props) {
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
            <MediaCard item={item} />
          </div>
        );
      })}
    </div>
  );
}
