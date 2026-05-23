"use client";

import { Grid3X3 } from "lucide-react";

import {
  FEED_DENSITY_OPTIONS,
  type FeedDensity,
} from "@/features/feed-density-control/model/feed-density.types";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

type Props = {
  value: FeedDensity;
  onValueChange: (value: FeedDensity) => void;
};

export function FeedDensityControl({ value, onValueChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-white/60">
        <Grid3X3 className="size-4" aria-hidden="true" />
        <span>Items per row</span>
      </div>
      <ToggleGroup
        type="single"
        value={String(value)}
        onValueChange={(nextValue) => {
          if (nextValue) {
            onValueChange(Number(nextValue) as FeedDensity);
          }
        }}
        aria-label="Items per row"
      >
        {FEED_DENSITY_OPTIONS.map((option) => (
          <ToggleGroupItem key={option} value={String(option)} aria-label={`${option} items`}>
            {option}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
