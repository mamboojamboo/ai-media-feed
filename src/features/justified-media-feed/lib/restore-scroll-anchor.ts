import { clamp } from "@/shared/lib/clamp";

import { getItemLayoutPosition } from "./get-item-layout-position";
import type { JustifiedRow, ScrollAnchor } from "../model/justified-feed.types";

export function restoreScrollAnchor(
  anchor: ScrollAnchor,
  rows: JustifiedRow[],
  maxScrollTop: number,
) {
  const position = getItemLayoutPosition(rows, anchor.itemId);

  if (!position) {
    return null;
  }

  return clamp(position.top - anchor.offsetTopInViewport, 0, maxScrollTop);
}
