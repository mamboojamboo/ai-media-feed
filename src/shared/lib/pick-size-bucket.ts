export const SIZE_BUCKETS = [320, 480, 640, 960, 1280, 1600] as const;

export function pickSizeBucket(requestedWidth: number) {
  return (
    SIZE_BUCKETS.find((bucket) => bucket >= requestedWidth) ??
    SIZE_BUCKETS[SIZE_BUCKETS.length - 1]
  );
}
