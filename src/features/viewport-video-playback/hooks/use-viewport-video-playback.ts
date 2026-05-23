"use client";

import * as React from "react";

import { MediaCache } from "@/shared/media-cache/model/MediaCache";

import {
  VIDEO_PAUSE_THRESHOLD,
  VIDEO_PLAY_THRESHOLD,
} from "../model/playback.config";

type Args = {
  id: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  rootRef: React.RefObject<HTMLElement | null>;
  mediaCache: MediaCache;
  enabled: boolean;
  isFastScrolling: boolean;
  playThreshold?: number;
  pauseThreshold?: number;
  onCacheChange: () => void;
};

export function useViewportVideoPlayback({
  id,
  videoRef,
  rootRef,
  mediaCache,
  enabled,
  isFastScrolling,
  playThreshold = VIDEO_PLAY_THRESHOLD,
  pauseThreshold = VIDEO_PAUSE_THRESHOLD,
  onCacheChange,
}: Args) {
  const ratioRef = React.useRef(0);
  const restoredRef = React.useRef(false);

  const getCurrentIntersectionRatio = React.useCallback(
    (video: HTMLVideoElement) => {
      const root = rootRef.current;
      const videoRect = video.getBoundingClientRect();
      const rootRect = root?.getBoundingClientRect() ?? {
        top: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
        left: 0,
      };
      const intersectionWidth = Math.max(
        0,
        Math.min(videoRect.right, rootRect.right) - Math.max(videoRect.left, rootRect.left),
      );
      const intersectionHeight = Math.max(
        0,
        Math.min(videoRect.bottom, rootRect.bottom) - Math.max(videoRect.top, rootRect.top),
      );
      const videoArea = Math.max(1, videoRect.width * videoRect.height);

      return (intersectionWidth * intersectionHeight) / videoArea;
    },
    [rootRef],
  );

  React.useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const saveState = () => {
      const hasExistingState = Boolean(mediaCache.getVideoState(id));
      const hasMeaningfulState =
        hasExistingState ||
        video.readyState > HTMLMediaElement.HAVE_NOTHING ||
        video.currentTime > 0 ||
        Boolean(video.error);

      if (!hasMeaningfulState) {
        return;
      }

      mediaCache.updateVideoState(id, {
        currentTime: Number.isFinite(video.currentTime) ? video.currentTime : 0,
        duration: Number.isFinite(video.duration) ? video.duration : undefined,
        metadataLoaded: video.readyState >= HTMLMediaElement.HAVE_METADATA,
        canPlay: video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA,
        status: video.error ? "error" : video.readyState > 0 ? "loaded" : "idle",
      });
      onCacheChange();
    };

    const onLoadedMetadata = () => {
      const cachedState = mediaCache.getVideoState(id);

      if (!restoredRef.current && cachedState?.currentTime) {
        video.currentTime = Math.min(
          cachedState.currentTime,
          Math.max(0, video.duration - 0.25),
        );
        restoredRef.current = true;
      }

      saveState();
    };

    const onCanPlay = () => {
      mediaCache.updateVideoState(id, {
        canPlay: true,
        status: "loaded",
      });
      onCacheChange();
    };

    const onError = () => {
      mediaCache.updateVideoState(id, {
        status: "error",
      });
      onCacheChange();
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("error", onError);
    video.addEventListener("timeupdate", saveState);

    return () => {
      saveState();
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onError);
      video.removeEventListener("timeupdate", saveState);
    };
  }, [id, mediaCache, onCacheChange, videoRef]);

  React.useEffect(() => {
    const video = videoRef.current;
    const root = rootRef.current;

    if (!video) {
      return;
    }

    const pauseAndSave = () => {
      if (!video.paused) {
        mediaCache.updateVideoState(id, {
          currentTime: video.currentTime,
          duration: Number.isFinite(video.duration) ? video.duration : undefined,
          metadataLoaded: video.readyState >= HTMLMediaElement.HAVE_METADATA,
          canPlay: video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA,
          status: video.error ? "error" : "loaded",
        });
        onCacheChange();
      }

      video.pause();
    };

    const maybePlay = () => {
      if (!enabled || isFastScrolling || ratioRef.current < playThreshold) {
        return;
      }

      const cachedState = mediaCache.getVideoState(id);

      if (!restoredRef.current && cachedState?.currentTime && video.readyState > 0) {
        video.currentTime = cachedState.currentTime;
        restoredRef.current = true;
      }

      const playPromise = video.play();

      if (playPromise) {
        playPromise.catch(() => {
          mediaCache.updateVideoState(id, {
            status: "error",
          });
          onCacheChange();
        });
      }
    };

    const maybePlayAfterMediaReady = () => {
      ratioRef.current = getCurrentIntersectionRatio(video);
      maybePlay();
    };

    if (!enabled || isFastScrolling) {
      pauseAndSave();
    } else {
      maybePlayAfterMediaReady();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        ratioRef.current = entry?.intersectionRatio ?? 0;

        if (ratioRef.current >= playThreshold && enabled && !isFastScrolling) {
          maybePlay();
        }

        if (ratioRef.current <= pauseThreshold || !enabled || isFastScrolling) {
          pauseAndSave();
        }
      },
      {
        root,
        threshold: [0, pauseThreshold, playThreshold, 0.75, 1],
      },
    );

    observer.observe(video);
    video.addEventListener("loadedmetadata", maybePlayAfterMediaReady);
    video.addEventListener("canplay", maybePlayAfterMediaReady);

    return () => {
      pauseAndSave();
      video.removeEventListener("loadedmetadata", maybePlayAfterMediaReady);
      video.removeEventListener("canplay", maybePlayAfterMediaReady);
      observer.disconnect();
    };
  }, [
    enabled,
    getCurrentIntersectionRatio,
    id,
    isFastScrolling,
    mediaCache,
    onCacheChange,
    pauseThreshold,
    playThreshold,
    rootRef,
    videoRef,
  ]);
}
