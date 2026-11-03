"use client";

import { EyeIcon, EyeOffIcon, PlusIcon, XIcon } from "lucide-react";
import { AreaSetCodeLabels } from "@/labels";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";
import { CHOROPLETH_AREA_SET_CODES } from "../../components/Choropleth/configs";
import { useOverlayBoundaries } from "../../hooks/useOverlayBoundaries";
import { DEFAULT_SECONDARY_BOUNDARY_STROKE_COLOR } from "../../styles";
import type { AreaSetCode } from "@/models/AreaSet";

const isOverlayCode = (value: string): value is AreaSetCode =>
  value in AreaSetCodeLabels;

// Outline-only boundary sets drawn over the map, each with its own colour
// and visibility, like the drawn areas below
export default function LightOverlayBoundaries() {
  const { items, add, update, remove } = useOverlayBoundaries();

  return (
    <div>
      <div className="flex items-center gap-1">
        <p className="text-[11px] text-neutral-500">Boundaries</p>
        <button
          type="button"
          onClick={add}
          aria-label="Add overlay boundaries"
          title="Add boundaries"
          className="ml-auto cursor-pointer rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <PlusIcon className="size-4" />
        </button>
      </div>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={add}
          className="-ml-1 mt-0.5 flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <PlusIcon className="size-3.5" />
          Outline other boundaries on top
        </button>
      ) : (
        <ul className="mt-1 flex flex-col gap-1">
          {items.map((overlay) => {
            const color =
              overlay.color || DEFAULT_SECONDARY_BOUNDARY_STROKE_COLOR;
            const label = AreaSetCodeLabels[overlay.areaSetCode];
            return (
              <li
                key={overlay.id}
                className="group/overlay flex items-center gap-1"
              >
                <button
                  type="button"
                  onClick={() =>
                    update(overlay.id, { visible: !overlay.visible })
                  }
                  aria-pressed={overlay.visible}
                  aria-label={`${overlay.visible ? "Hide" : "Show"} ${label}`}
                  title={overlay.visible ? "Hide" : "Show"}
                  className="shrink-0 cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                >
                  {overlay.visible ? (
                    <EyeIcon className="size-3.5" />
                  ) : (
                    <EyeOffIcon className="size-3.5" />
                  )}
                </button>
                <div
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-1.5 transition-opacity",
                    !overlay.visible && "opacity-50",
                  )}
                >
                  <Select
                    value={overlay.areaSetCode}
                    onValueChange={(value) => {
                      if (isOverlayCode(value)) {
                        update(overlay.id, { areaSetCode: value });
                      }
                    }}
                  >
                    <SelectTrigger
                      size="sm"
                      className="h-7 min-w-0 flex-1 text-xs"
                      aria-label="Overlay boundaries"
                    >
                      <SelectValue />
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
                    style={{ backgroundColor: color }}
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) =>
                        update(overlay.id, { color: e.target.value })
                      }
                      aria-label={`${label} outline colour`}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => remove(overlay.id)}
                  aria-label={`Remove ${label}`}
                  title="Remove"
                  className="flex w-6 shrink-0 cursor-pointer justify-center rounded py-1 text-neutral-400 opacity-0 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:opacity-100 group-hover/overlay:opacity-100"
                >
                  <XIcon className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
