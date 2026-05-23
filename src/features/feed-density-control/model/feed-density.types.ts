export const FEED_DENSITY_OPTIONS = [2, 3, 4, 5, 6, 8] as const;

export type FeedDensity = (typeof FEED_DENSITY_OPTIONS)[number];
