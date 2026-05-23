"use client";

import type { MediaItem } from "@/entities/media/model/media.types";

type Props = {
  item: MediaItem;
};

export function MediaRenderer({ item }: Props) {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_30%),linear-gradient(135deg,rgba(25,25,32,1),rgba(8,8,12,1))]">
      <div className="absolute inset-0 opacity-40 mix-blend-screen">
        <div className="h-full w-full bg-[linear-gradient(120deg,rgba(72,187,255,0.35),rgba(255,255,255,0.06),rgba(255,120,194,0.26))]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-medium uppercase tracking-[0.22em] text-white/25">
        {item.type}
      </div>
    </div>
  );
}
