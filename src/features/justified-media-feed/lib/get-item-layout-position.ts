import type {
  ItemLayoutPosition,
  JustifiedRow,
} from "../model/justified-feed.types";

export function getItemLayoutPosition(
  rows: JustifiedRow[],
  itemId: string,
): ItemLayoutPosition | null {
  for (const row of rows) {
    const item = row.items.find((rowItem) => rowItem.id === itemId);

    if (item) {
      return {
        rowIndex: row.index,
        top: row.top,
        left: item.x,
        width: item.width,
        height: item.height,
      };
    }
  }

  return null;
}
