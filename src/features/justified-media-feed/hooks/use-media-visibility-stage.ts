"use client";

import * as React from "react";

import type { VisibilityStage } from "../model/justified-feed.types";

export function useMediaVisibilityStage(
  rootRef: React.RefObject<HTMLElement | null>,
) {
  const elementRef = React.useRef<HTMLElement | null>(null);
  const [stage, setStage] = React.useState<VisibilityStage>("far");

  React.useEffect(() => {
    const element = elementRef.current;
    const root = rootRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          setStage("far");
          return;
        }

        setStage(entry.intersectionRatio >= 0.35 ? "visible" : "near");
      },
      {
        root,
        rootMargin: "320px 0px",
        threshold: [0, 0.01, 0.25, 0.35, 0.45, 0.75, 1],
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootRef]);

  return {
    elementRef,
    stage,
  };
}
