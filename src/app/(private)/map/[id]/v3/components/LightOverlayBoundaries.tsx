"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { AreaSetCodeLabels } from "@/labels";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { CHOROPLETH_AREA_SET_CODES } from "../../components/Choropleth/configs";
import { useMapViews } from "../../hooks/useMapViews";
import { DEFAULT_SECONDARY_BOUNDARY_STROKE_COLOR } from "../../styles";
import type { AreaSetCode } from "@/models/AreaSet";

const isOverlayCode = (value: string): value is AreaSetCode =>
  value in AreaSetCodeLabels;

// Outline-only boundaries drawn over the main ones (the view's secondary
// boundaries), with their stroke colour
export default function LightOverlayBoundaries() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const current = viewConfig.secondaryAreaSetCode ?? null;
  const [isAdding, setIsAdding] = useState(false);
  const strokeColor =
    viewConfig.secondaryBoundaryStrokeColor ||
    DEFAULT_SECONDARY_BOUNDARY_STROKE_COLOR;

  if (!current && !isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="mt-2 flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
      >
        <PlusIcon className="size-3.5" />
        Overlay boundaries
      </button>
    );
  }

  const remove = () => {
    updateViewConfig({ secondaryAreaSetCode: null });
    setIsAdding(false);
  };

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[11px] text-neutral-500">Overlay boundaries</p>
        <button
          type="button"
          onClick={remove}
          aria-label="Remove overlay boundaries"
          title="Remove"
          className="cursor-pointer rounded p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <Select
          value={current ?? undefined}
          onValueChange={(value) => {
            if (isOverlayCode(value)) {
              updateViewConfig({ secondaryAreaSetCode: value });
            }
          }}
        >
          <SelectTrigger
            size="sm"
            className="h-7 min-w-0 flex-1 text-xs"
            aria-label="Overlay boundaries"
          >
            <SelectValue placeholder="Choose boundaries…" />
          </SelectTrigger>
          <SelectContent>
            {CHOROPLETH_AREA_SET_CODES.map((code) => (
              <SelectItem key={code} value={code} className="text-xs">
                {AreaSetCodeLabels[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label
          title="Outline colour"
          className="relative size-5 shrink-0 cursor-pointer rounded-full border-2 border-white shadow-[0_0_0_1px_#d4d4d4]"
          style={{ backgroundColor: strokeColor }}
        >
          <input
            type="color"
            value={strokeColor}
            onChange={(e) =>
              updateViewConfig({ secondaryBoundaryStrokeColor: e.target.value })
            }
            aria-label="Overlay outline colour"
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}
