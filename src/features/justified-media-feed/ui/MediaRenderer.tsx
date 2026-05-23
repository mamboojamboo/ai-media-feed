"use client";

/* eslint-disable @next/next/no-img-element -- object URLs from the browser media cache are not compatible with next/image optimization. */

import * as React from "react";

import { pickMediaSource } from "@/entities/media/lib/pick-media-source";
import type { MediaItem } from "@/entities/media/model/media.types";
import { useViewportVideoPlayback } from "@/features/viewport-video-playback/hooks/use-viewport-video-playback";
import { cn } from "@/shared/lib/cn";
import { pickSizeBucket } from "@/shared/lib/pick-size-bucket";
import { MediaCache } from "@/shared/media-cache/model/MediaCache";

import { useCachedMediaAsset } from "../hooks/use-cached-media-asset";
import type { VisibilityStage } from "../model/justified-feed.types";

type Props = {
  item: MediaItem;
  width: number;
  stage: VisibilityStage;
  rootRef: React.RefObject<HTMLElement | null>;
  mediaCache: MediaCache;
  isFastScrolling: boolean;
  isMediaLoadingDeferred: boolean;
  onCacheChange: () => void;
};

function Placeholder({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_30%),linear-gradient(135deg,rgba(25,25,32,1),rgba(8,8,12,1))]">
      <div
        className={cn(
          "absolute inset-0 opacity-40 mix-blend-screen",
          isLoading && "animate-pulse",
        )}
      >
        <div className="h-full w-full bg-[linear-gradient(120deg,rgba(72,187,255,0.35),rgba(255,255,255,0.06),rgba(255,120,194,0.26))]" />
      </div>
    </div>
  );
}

function ImageRenderer({
  item,
  width,
  stage,
  mediaCache,
  isMediaLoadingDeferred,
  onCacheChange,
}: Props) {
  const enabled = stage !== "far" && !isMediaLoadingDeferred;
  const { asset, status } = useCachedMediaAsset({
    id: item.id,
    sources: item.sources,
    width,
    kind: "image",
    mediaCache,
    enabled,
    onCacheChange,
  });

  return (
    <>
      <Placeholder isLoading={status === "loading"} />
      {asset?.objectUrl ? (
        <img
          src={asset.objectUrl}
          alt={item.title}
          className="absolute inset-0 h-full w-full object-contain"
          decoding="async"
          draggable={false}
        />
      ) : null}
    </>
  );
}

function VideoRenderer({
  item,
  width,
  stage,
  rootRef,
  mediaCache,
  isFastScrolling,
  isMediaLoadingDeferred,
  onCacheChange,
}: Props) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [hasVideoFrame, setHasVideoFrame] = React.useState(
    () => mediaCache.getVideoState(item.id)?.canPlay ?? false,
  );
  const requestedWidth = pickSizeBucket(
    width * (typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2)),
  );
  const poster = useCachedMediaAsset({
    id: item.id,
    sources: item.posterSources ?? [],
    width,
    kind: "poster",
    mediaCache,
    enabled: stage !== "far" && !isMediaLoadingDeferred,
    onCacheChange,
  });
  const videoState = mediaCache.getVideoState(item.id);
  const videoSource = pickMediaSource(item.sources, requestedWidth);
  const videoAsset = mediaCache.get(item.id)?.video?.asset;
  const hasCachedVideoReadiness = Boolean(
    videoState?.metadataLoaded || videoState?.canPlay || videoState?.status === "loaded",
  );
  const shouldAttachVideo =
    stage !== "far" &&
    (hasVideoFrame ||
      hasCachedVideoReadiness ||
      (stage === "visible" && !isMediaLoadingDeferred));

  useViewportVideoPlayback({
    id: item.id,
    videoRef,
    rootRef,
    mediaCache,
    enabled: shouldAttachVideo && stage === "visible" && !isMediaLoadingDeferred,
    isFastScrolling,
    onCacheChange,
  });

  return (
    <>
      <Placeholder isLoading={poster.status === "loading"} />
      {poster.asset?.objectUrl ? (
        <img
          src={poster.asset.objectUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain"
          decoding="async"
          draggable={false}
        />
      ) : null}
      <video
        ref={videoRef}
        className={cn(
          "absolute inset-0 h-full w-full object-contain transition-opacity duration-200",
          shouldAttachVideo && (hasVideoFrame || videoState?.canPlay)
            ? "opacity-100"
            : "opacity-0",
        )}
        muted
        playsInline
        loop
        preload={shouldAttachVideo ? "metadata" : "none"}
        poster={poster.asset?.objectUrl}
        src={shouldAttachVideo ? videoAsset?.objectUrl ?? videoSource.url : undefined}
        onLoadedData={() => {
          setHasVideoFrame(true);
        }}
        onCanPlay={() => {
          setHasVideoFrame(true);
        }}
        onEmptied={() => {
          setHasVideoFrame(false);
        }}
      />
    </>
  );
}

export function MediaRenderer(props: Props) {
  return props.item.type === "image" ? (
    <ImageRenderer {...props} />
  ) : (
    <VideoRenderer {...props} />
  );
}
