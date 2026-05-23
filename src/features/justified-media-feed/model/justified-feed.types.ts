export type LayoutItem = {
  id: string;
  aspectRatio: number;
};

export type JustifiedRowItem = {
  id: string;
  width: number;
  height: number;
  x: number;
};

export type JustifiedRow = {
  id: string;
  index: number;
  items: JustifiedRowItem[];
  height: number;
  top: number;
};

export type ComputeRowsOptions = {
  containerWidth: number;
  targetItemsPerRow: number;
  gap: number;
  rowGap: number;
  minRowHeight: number;
  maxRowHeight: number;
  maxLastRowHeight: number;
};

export type ScrollAnchor = {
  itemId: string;
  offsetTopInViewport: number;
};

export type ItemLayoutPosition = {
  rowIndex: number;
  top: number;
  left: number;
  width: number;
  height: number;
};

export type VisibilityStage = "far" | "near" | "visible";
