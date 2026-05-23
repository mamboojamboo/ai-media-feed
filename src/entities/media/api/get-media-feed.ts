import { cacheLife } from "next/cache";

import rawDataset from "@/shared/data/media-dataset.json";

import { mediaFeedSchema } from "../model/media.schema";

export async function getMediaFeed() {
  "use cache";

  cacheLife("max");

  return mediaFeedSchema.parse(rawDataset);
}
