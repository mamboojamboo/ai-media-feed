export const SIZE_BUCKETS = [320, 480, 640, 960, 1280, 1600] as const;
export type SizeBucket = (typeof SIZE_BUCKETS)[number];

const MAX_SIZE_BUCKET = 1600 satisfies SizeBucket;

export function pickSizeBucket(requestedWidth: number) {
  return SIZE_BUCKETS.find((bucket) => bucket >= requestedWidth) ?? MAX_SIZE_BUCKET;
}
