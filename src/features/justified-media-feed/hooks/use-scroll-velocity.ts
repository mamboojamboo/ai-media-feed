"use client";

import * as React from "react";

export type ScrollVelocityState = {
  velocityPxPerMs: number;
  isFastScrolling: boolean;
  isMediaLoadingDeferred: boolean;
  direction: "up" | "down" | null;
};

const FAST_SCROLL_THRESHOLD_PX_PER_MS = 1.5;
const SCROLL_IDLE_MS = 220;

export function useScrollVelocity(
  scrollRef: React.RefObject<HTMLElement | null>,
): ScrollVelocityState {
  const [state, setState] = React.useState<ScrollVelocityState>({
    velocityPxPerMs: 0,
    isFastScrolling: false,
    isMediaLoadingDeferred: false,
    direction: null,
  });

  React.useEffect(() => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) {
      return;
    }

    let lastTop = scrollElement.scrollTop;
    let lastTime = performance.now();
    let idleTimer: number | undefined;

    const onScroll = () => {
      const now = performance.now();
      const nextTop = scrollElement.scrollTop;
      const deltaY = nextTop - lastTop;
      const deltaTime = Math.max(1, now - lastTime);
      const velocityPxPerMs = deltaY / deltaTime;

      lastTop = nextTop;
      lastTime = now;

      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        setState((previousState) => ({
          ...previousState,
          velocityPxPerMs: 0,
          isFastScrolling: false,
          isMediaLoadingDeferred: false,
        }));
      }, SCROLL_IDLE_MS);

      setState({
        velocityPxPerMs,
        isFastScrolling: Math.abs(velocityPxPerMs) > FAST_SCROLL_THRESHOLD_PX_PER_MS,
        isMediaLoadingDeferred: true,
        direction: deltaY > 0 ? "down" : deltaY < 0 ? "up" : null,
      });
    };

    scrollElement.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(idleTimer);
      scrollElement.removeEventListener("scroll", onScroll);
    };
  }, [scrollRef]);

  return state;
}
