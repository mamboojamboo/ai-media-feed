import type { MediaSource } from "../model/media.types";

export function pickMediaSource(
  sources: readonly MediaSource[],
  requestedWidth: number,
): MediaSource {
  const sortedSources = [...sources].sort((left, right) => left.width - right.width);
  const largestSource = sortedSources.reduce<MediaSource | null>(
    (largest, source) => (largest && largest.width > source.width ? largest : source),
    null,
  );

  if (!largestSource) {
    throw new Error("Cannot pick a media source from an empty source list.");
  }

  return sortedSources.find((source) => source.width >= requestedWidth) ?? largestSource;
}
