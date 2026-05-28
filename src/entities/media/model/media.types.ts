import type { z } from "zod";

import type {
  mediaFeedSchema,
  mediaItemSchema,
  mediaSourceSchema,
} from "./media.schema";

type MediaItemFromSchema = z.infer<typeof mediaItemSchema>;

export type MediaSource = z.infer<typeof mediaSourceSchema>;
export type ImageMediaItem = Extract<MediaItemFromSchema, { type: "image" }>;
export type VideoMediaItem = Extract<MediaItemFromSchema, { type: "video" }>;
export type MediaItem = ImageMediaItem | VideoMediaItem;
export type MediaFeed = z.infer<typeof mediaFeedSchema>;
export type MediaType = MediaItem["type"];
