import { getMediaFeed } from "@/entities/media/api/get-media-feed";
import { MediaFeedPage } from "@/views/media-feed/ui/MediaFeedPage";

export default async function Page() {
  const mediaItems = await getMediaFeed();

  return <MediaFeedPage mediaItems={mediaItems} />;
}
