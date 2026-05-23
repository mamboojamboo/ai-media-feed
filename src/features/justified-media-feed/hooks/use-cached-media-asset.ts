"use client";

import * as React from "react";

import type { MediaSource } from "@/entities/media/model/media.types";
import { pickMediaSource } from "@/entities/media/lib/pick-media-source";
import { pickSizeBucket } from "@/shared/lib/pick-size-bucket";
import { MediaCache } from "@/shared/media-cache/model/MediaCache";
import type { CachedAsset } from "@/shared/media-cache/model/media-cache.types";

type AssetKind = "image" | "poster";

type Args = {
  id: string;
  sources: MediaSource[];
  width: number;
  kind: AssetKind;
  mediaCache: MediaCache;
  enabled: boolean;
  onCacheChange: () => void;
};

type State = {
  asset?: CachedAsset;
  status: "idle" | "loading" | "loaded" | "error";
};

const failedAssetRequests = new Set<string>();

function getDevicePixelRatio() {
  if (typeof window === "undefined") {
    return 1;
  }

  return Math.min(window.devicePixelRatio || 1, 2);
}

export function useCachedMediaAsset({
  id,
  sources,
  width,
  kind,
  mediaCache,
  enabled,
  onCacheChange,
}: Args) {
  const requestedWidth = pickSizeBucket(width * getDevicePixelRatio());
  const cachedAsset =
    kind === "image"
      ? mediaCache.getBestImage(id, requestedWidth)
      : mediaCache.getBestPoster(id, requestedWidth);
  const [state, setState] = React.useState<State>(() => {
    return cachedAsset ? { asset: cachedAsset, status: "loaded" } : { status: "idle" };
  });

  React.useEffect(() => {
    const currentCachedAsset =
      kind === "image"
        ? mediaCache.getBestImage(id, requestedWidth)
        : mediaCache.getBestPoster(id, requestedWidth);

    if (currentCachedAsset) {
      return;
    }

    if (!enabled) {
      return;
    }

    if (!sources.length) {
      return;
    }

    const source = pickMediaSource(sources, requestedWidth);
    const failedAssetRequestKey = `${kind}:${id}:${source.width}:${source.url}`;

    if (failedAssetRequests.has(failedAssetRequestKey)) {
      queueMicrotask(() => {
        setState((previousState) => ({
          asset: previousState.asset,
          status: previousState.asset ? "loaded" : "error",
        }));
      });
      return;
    }

    const abortController = new AbortController();

    queueMicrotask(() => {
      if (!abortController.signal.aborted) {
        setState((previousState) => ({
          asset: previousState.asset,
          status: "loading",
        }));
      }
    });

    fetch(source.url, { signal: abortController.signal })
      .then((response) => {
        if (!response.ok) {
          failedAssetRequests.add(failedAssetRequestKey);
          return undefined;
        }

        return response.blob();
      })
      .then((blob) => {
        if (abortController.signal.aborted) {
          return;
        }

        if (!blob) {
          setState((previousState) => ({
            asset: previousState.asset,
            status: previousState.asset ? "loaded" : "error",
          }));
          onCacheChange();
          return;
        }

        const asset =
          kind === "image"
            ? mediaCache.putImage(id, source.width, blob)
            : mediaCache.putPoster(id, source.width, blob);

        setState({ asset, status: "loaded" });
        onCacheChange();
      })
      .catch(() => {
        if (abortController.signal.aborted) {
          return;
        }

        failedAssetRequests.add(failedAssetRequestKey);
        setState((previousState) => ({
          asset: previousState.asset,
          status: previousState.asset ? "loaded" : "error",
        }));
        onCacheChange();
      });

    return () => {
      abortController.abort();
    };
  }, [enabled, id, kind, mediaCache, onCacheChange, requestedWidth, sources]);

  return {
    ...(cachedAsset ? { asset: cachedAsset, status: "loaded" as const } : state),
    requestedWidth,
  };
}
