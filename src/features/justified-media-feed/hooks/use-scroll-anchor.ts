"use client";

import * as React from "react";

import { findAnchorItem } from "../lib/find-anchor-item";
import { restoreScrollAnchor } from "../lib/restore-scroll-anchor";
import type { JustifiedRow, ScrollAnchor } from "../model/justified-feed.types";

type Args = {
  rows: JustifiedRow[];
  scrollRef: React.RefObject<HTMLElement | null>;
};

export function useScrollAnchor({ rows, scrollRef }: Args) {
  const pendingAnchorRef = React.useRef<ScrollAnchor | null>(null);
  const rowsRef = React.useRef(rows);

  React.useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const captureAnchor = React.useCallback(() => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) {
      return null;
    }

    const anchor = findAnchorItem(rowsRef.current, scrollElement.scrollTop);
    pendingAnchorRef.current = anchor;

    return anchor;
  }, [scrollRef]);

  React.useLayoutEffect(() => {
    const scrollElement = scrollRef.current;
    const pendingAnchor = pendingAnchorRef.current;

    if (!scrollElement || !pendingAnchor) {
      return;
    }

    const maxScrollTop = Math.max(0, scrollElement.scrollHeight - scrollElement.clientHeight);
    const nextScrollTop = restoreScrollAnchor(pendingAnchor, rows, maxScrollTop);

    if (nextScrollTop !== null) {
      scrollElement.scrollTop = nextScrollTop;
    }

    pendingAnchorRef.current = null;
  }, [rows, scrollRef]);

  return {
    captureAnchor,
  };
}
