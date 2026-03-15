"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/shadcn/utils";

type Mode = "private" | "public";

interface MapVisibilityToggleProps {
  mode: Mode;
  mapId: string;
  viewId: string;
}

export default function MapVisibilityToggle({
  mode,
  mapId,
  viewId,
}: MapVisibilityToggleProps) {
  const router = useRouter();

  const onToggle = useCallback(
    (target: Mode) => {
      if (target === mode) return;
      if (target === "public") {
        router.push(`/map/${mapId}/view/${viewId}/publish`);
      } else {
        router.push(`/map/${mapId}`);
      }
    },
    [mode, mapId, viewId, router],
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
        Private
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
        Public
      </button>
    </div>
  );
}
