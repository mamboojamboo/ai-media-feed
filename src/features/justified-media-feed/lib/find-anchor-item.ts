import { binarySearchLast } from "@/shared/lib/binary-search";

import type { JustifiedRow, ScrollAnchor } from "../model/justified-feed.types";

export function findAnchorItem(
  rows: JustifiedRow[],
  scrollTop: number,
  viewportOffset = 96,
): ScrollAnchor | null {
  if (!rows.length) {
    return null;
  }

  const targetTop = scrollTop + viewportOffset;
  const rowIndex = Math.max(
    0,
    binarySearchLast(rows, (row) => row.top <= targetTop),
  );
  const row = rows[rowIndex] ?? rows[0];
  const item = row.items[0];

  if (!item) {
    return null;
  }

  return {
    itemId: item.id,
    offsetTopInViewport: row.top - scrollTop,
  };
}
