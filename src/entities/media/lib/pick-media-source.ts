import type { MediaSource } from "../model/media.types";

export function pickMediaSource(
  sources: MediaSource[],
  requestedWidth: number,
): MediaSource {
  const sortedSources = [...sources].sort((left, right) => left.width - right.width);

  return (
    sortedSources.find((source) => source.width >= requestedWidth) ??
    sortedSources[sortedSources.length - 1]
  );
}
