"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shadcn/utils";

/**
 * Grows and shrinks smoothly to fit its content, instead of jumping when
 * the content changes (e.g. the inspector moving between areas)
 */
export default function AnimatedHeight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const observer = new ResizeObserver(() => setHeight(inner.offsetHeight));
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "overflow-hidden transition-[height] duration-200 ease-out motion-reduce:transition-none",
        className,
      )}
      style={{ height: height ?? "auto" }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
