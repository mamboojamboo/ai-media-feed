"use client";

import * as React from "react";

type Size = {
  width: number;
  height: number;
};

type Options = {
  onBeforeResize?: () => void;
};

export function useContainerSize<TElement extends HTMLElement>(
  ref: React.RefObject<TElement | null>,
  options: Options = {},
) {
  const [size, setSize] = React.useState<Size>({ width: 0, height: 0 });
  const beforeResizeRef = React.useRef(options.onBeforeResize);

  React.useEffect(() => {
    beforeResizeRef.current = options.onBeforeResize;
  }, [options.onBeforeResize]);

  React.useLayoutEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    let frameId = 0;

    const commitSize = (nextSize: Size, shouldCaptureAnchor: boolean) => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        if (shouldCaptureAnchor) {
          beforeResizeRef.current?.();
        }

        setSize((previousSize) => {
          if (
            Math.round(previousSize.width) === Math.round(nextSize.width) &&
            Math.round(previousSize.height) === Math.round(nextSize.height)
          ) {
            return previousSize;
          }

          return nextSize;
        });
      });
    };

    const rect = element.getBoundingClientRect();
    commitSize({ width: rect.width, height: rect.height }, false);

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) {
        return;
      }

      commitSize(
        {
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        },
        true,
      );
    });

    resizeObserver.observe(element);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [ref]);

  return size;
}
