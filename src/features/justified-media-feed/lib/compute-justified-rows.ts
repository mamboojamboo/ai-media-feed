import { clamp } from "@/shared/lib/clamp";

import type {
  ComputeRowsOptions,
  JustifiedRow,
  JustifiedRowItem,
  LayoutItem,
} from "../model/justified-feed.types";

function getTargetRowHeight(options: ComputeRowsOptions) {
  const availableWidth =
    options.containerWidth - options.gap * Math.max(0, options.targetItemsPerRow - 1);
  const averageCellWidth = availableWidth / options.targetItemsPerRow;

  return clamp(averageCellWidth / 1.05, options.minRowHeight, options.maxRowHeight);
}

function createRowItems(
  items: LayoutItem[],
  rowHeight: number,
  gap: number,
  fillWidth?: number,
): JustifiedRowItem[] {
  let x = 0;

  return items.map((item, index) => {
    const remainingItems = items.length - index - 1;
    const width =
      fillWidth && index === items.length - 1
        ? Math.max(1, fillWidth - x)
        : rowHeight * item.aspectRatio;

    const rowItem = {
      id: item.id,
      width,
      height: rowHeight,
      x,
    };

    x += width + (remainingItems > 0 ? gap : 0);

    return rowItem;
  });
}

export function computeJustifiedRows(
  items: LayoutItem[],
  options: ComputeRowsOptions,
): JustifiedRow[] {
  if (!items.length || options.containerWidth <= 0) {
    return [];
  }

  const targetRowHeight = getTargetRowHeight(options);
  const targetAspectRatioSum =
    (options.containerWidth - options.gap * Math.max(0, options.targetItemsPerRow - 1)) /
    targetRowHeight;
  const rows: JustifiedRow[] = [];
  let top = 0;
  let pendingItems: LayoutItem[] = [];
  let pendingAspectRatioSum = 0;

  const pushRow = (rowItems: LayoutItem[], isLastRow: boolean) => {
    if (!rowItems.length) {
      return;
    }

    const gapWidth = options.gap * Math.max(0, rowItems.length - 1);
    const availableWidth = options.containerWidth - gapWidth;
    const aspectRatioSum = rowItems.reduce((sum, item) => sum + item.aspectRatio, 0);
    const calculatedHeight = availableWidth / aspectRatioSum;
    const height = isLastRow
      ? Math.min(
          calculatedHeight,
          targetRowHeight,
          options.maxLastRowHeight,
          options.maxRowHeight,
        )
      : clamp(calculatedHeight, options.minRowHeight, options.maxRowHeight);
    const shouldFillWidth = !isLastRow && calculatedHeight === height;
    const row: JustifiedRow = {
      id: `${rows.length}-${rowItems[0].id}-${rowItems[rowItems.length - 1].id}`,
      index: rows.length,
      items: createRowItems(
        rowItems,
        height,
        options.gap,
        shouldFillWidth ? options.containerWidth : undefined,
      ),
      height,
      top,
    };

    rows.push(row);
    top += height + options.rowGap;
  };

  for (const item of items) {
    pendingItems.push(item);
    pendingAspectRatioSum += item.aspectRatio;

    if (
      pendingItems.length >= options.targetItemsPerRow ||
      pendingAspectRatioSum >= targetAspectRatioSum
    ) {
      pushRow(pendingItems, false);
      pendingItems = [];
      pendingAspectRatioSum = 0;
    }
  }

  pushRow(pendingItems, true);

  return rows;
}
