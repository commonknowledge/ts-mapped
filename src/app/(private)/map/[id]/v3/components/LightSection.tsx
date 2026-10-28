"use client";

import { ChevronDownIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shadcn/utils";
import { useLayers } from "../../hooks/useLayers";
import type { LayerType } from "@/types";
import type { ReactNode } from "react";

// A collapsible group in the light Layers panel, with optional whole-layer
// visibility and header actions
export default function LightSection({
  label,
  layerType,
  actions,
  disabled = false,
  children,
}: {
  label: string;
  /** Adds a show/hide-all toggle for this layer type */
  layerType?: LayerType;
  actions?: ReactNode;
  disabled?: boolean;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  const { getLayerVisibility, hideLayer, showLayer } = useLayers();
  const isVisible = layerType ? getLayerVisibility(layerType) : true;

  return (
    <section
      className={cn(
        "border-b border-neutral-100 px-3 py-3",
        disabled && "pointer-events-none opacity-45",
      )}
    >
      <div className="group/section flex items-center gap-1">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="-ml-1 flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 font-mono text-[10px] tracking-widest text-neutral-400 uppercase hover:text-neutral-700"
        >
          <ChevronDownIcon
            className={cn(
              "size-3 transition-transform",
              !expanded && "-rotate-90",
            )}
          />
          {label}
        </button>
        {layerType && (
          <button
            type="button"
            onClick={() =>
              isVisible ? hideLayer(layerType) : showLayer(layerType)
            }
            aria-label={`${isVisible ? "Hide" : "Show"} all ${label.toLowerCase()}`}
            title={isVisible ? "Hide all" : "Show all"}
            className={cn(
              "cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700",
              isVisible && "opacity-0 group-hover/section:opacity-100",
            )}
          >
            {isVisible ? (
              <EyeIcon className="size-3.5" />
            ) : (
              <EyeOffIcon className="size-3.5" />
            )}
          </button>
        )}
        <div className="ml-auto flex items-center gap-1">{actions}</div>
      </div>
      {expanded && (
        <div className={cn("mt-2", !isVisible && "opacity-50")}>{children}</div>
      )}
    </section>
  );
}
