"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/shadcn/utils";

type Mode = "private" | "public";

interface MapModeToggleProps {
  mode: Mode;
}

export default function MapModeToggle({ mode }: MapModeToggleProps) {
  const router = useRouter();
  const pathname = usePathname();

  const onToggle = useCallback(
    (target: Mode) => {
      if (target === mode) return;
      // Read params from window.location rather than useSearchParams,
      // because viewId is synced via history.replaceState (invisible to Next.js).
      const params = new URLSearchParams(window.location.search);
      if (target === "public") {
        params.set("mode", "publish");
      } else {
        params.delete("mode");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [mode, pathname, router],
  );

  return (
    <div className="inline-flex h-8 items-center rounded-lg bg-neutral-100 p-0.5">
      <button
        type="button"
        onClick={() => onToggle("private")}
        className={cn(
          "inline-flex h-7 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
          mode === "private"
            ? "bg-white text-neutral-900 shadow-sm"
            : "text-neutral-500 hover:text-neutral-700",
        )}
      >
        Explore
      </button>
      <button
        type="button"
        onClick={() => onToggle("public")}
        className={cn(
          "inline-flex h-7 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
          mode === "public"
            ? "bg-white text-neutral-900 shadow-sm"
            : "text-neutral-500 hover:text-neutral-700",
        )}
      >
        Share
      </button>
    </div>
  );
}
