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
      fillWidth !== undefined && index === items.length - 1
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

function getCalculatedRowHeight(items: LayoutItem[], containerWidth: number, gap: number) {
  const gapWidth = gap * Math.max(0, items.length - 1);
  const availableWidth = containerWidth - gapWidth;
  const aspectRatioSum = items.reduce((sum, item) => sum + item.aspectRatio, 0);

  return availableWidth / aspectRatioSum;
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

    const firstItem = rowItems[0];
    const lastItem = rowItems[rowItems.length - 1];

    if (!firstItem || !lastItem) {
      return;
    }

    const calculatedHeight = getCalculatedRowHeight(
      rowItems,
      options.containerWidth,
      options.gap,
    );
    const height = isLastRow
      ? Math.min(
          calculatedHeight,
          targetRowHeight,
          options.maxLastRowHeight,
          options.maxRowHeight,
        )
      : calculatedHeight;
    const shouldFillWidth = !isLastRow || calculatedHeight === height;
    const row: JustifiedRow = {
      id: `${rows.length}-${firstItem.id}-${lastItem.id}`,
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

  for (const [itemIndex, item] of items.entries()) {
    const isFinalItem = itemIndex === items.length - 1;

    if (!pendingItems.length) {
      pendingItems.push(item);
      pendingAspectRatioSum = item.aspectRatio;
      continue;
    }

    const nextItems = [...pendingItems, item];
    const nextAspectRatioSum = pendingAspectRatioSum + item.aspectRatio;

    if (!isFinalItem && nextAspectRatioSum >= targetAspectRatioSum) {
      const currentHeight = getCalculatedRowHeight(
        pendingItems,
        options.containerWidth,
        options.gap,
      );
      const nextHeight = getCalculatedRowHeight(nextItems, options.containerWidth, options.gap);
      const currentDistance = Math.abs(currentHeight - targetRowHeight);
      const nextDistance = Math.abs(nextHeight - targetRowHeight);

      if (currentDistance <= nextDistance) {
        pushRow(pendingItems, false);
        pendingItems = [item];
        pendingAspectRatioSum = item.aspectRatio;
      } else {
        pushRow(nextItems, false);
        pendingItems = [];
        pendingAspectRatioSum = 0;
      }

      continue;
    }

    pendingItems = nextItems;
    pendingAspectRatioSum = nextAspectRatioSum;
  }

  pushRow(pendingItems, true);

  return rows;
}
