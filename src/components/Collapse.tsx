"use client";

import { useEffect, useState } from "react";
import { COLLAPSE_DURATION_MS } from "@/constants";
import { cn } from "@/shadcn/utils";

/**
 * Folds its content open and closed rather than popping it in and out.
 * Closing content stays mounted until it has folded away.
 */
export default function Collapse({
  isOpen,
  children,
  className,
}: {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [isMounted, setIsMounted] = useState(isOpen);
  // Opening: mount at once (folded, via starting styles) and unfold
  if (isOpen && !isMounted) setIsMounted(true);

  // Closing: unmount once folded away
  useEffect(() => {
    if (isOpen) return;
    const timeout = window.setTimeout(
      () => setIsMounted(false),
      COLLAPSE_DURATION_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  if (!isMounted) return null;
  return (
    <div
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "grid transition-[grid-template-rows,opacity] ease-out motion-reduce:transition-none",
        "starting:grid-rows-[0fr] starting:opacity-0",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
      style={{ transitionDuration: `${COLLAPSE_DURATION_MS}ms` }}
    >
      <div className={cn("min-h-0 overflow-hidden", className)}>{children}</div>
    </div>
  );
}
