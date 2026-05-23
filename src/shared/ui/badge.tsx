import * as React from "react";

import { cn } from "@/shared/lib/cn";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md border border-white/10 bg-white/8 px-2 text-[11px] font-medium uppercase tracking-wide text-white/70",
        className,
      )}
      {...props}
    />
  );
}
