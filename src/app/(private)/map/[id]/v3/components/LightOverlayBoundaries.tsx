"use client";

import { EyeIcon, EyeOffIcon, PlusIcon, XIcon } from "lucide-react";
import { AreaSetCodeLabels } from "@/labels";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";
import { CHOROPLETH_AREA_SET_CODES } from "../../components/Choropleth/configs";
import { useOverlayBoundaries } from "../../hooks/useOverlayBoundaries";
import { DEFAULT_SECONDARY_BOUNDARY_STROKE_COLOR } from "../../styles";
import { OVERLAY_GROUPS } from "../constants";
import GroupedSelectOptions from "./GroupedSelectOptions";
import LightEmptyHint from "./LightEmptyHint";
import type { AreaSetCode } from "@/models/AreaSet";

// Only sets the map can draw, in their groups
const overlayGroups = OVERLAY_GROUPS.map((group) => ({
  label: group.label,
  options: group.options
    .filter((option) => CHOROPLETH_AREA_SET_CODES.includes(option.code))
    .map((option) => ({
      value: option.code,
      name: option.name,
      description: option.description,
    })),
})).filter((group) => group.options.length > 0);

const overlayName = (code: AreaSetCode) =>
  OVERLAY_GROUPS.flatMap((group) => group.options).find(
    (option) => option.code === code,
  )?.name ?? AreaSetCodeLabels[code];

const isOverlayCode = (value: string): value is AreaSetCode =>
  value in AreaSetCodeLabels;

// Outline-only boundary sets drawn over the map, each with its own colour
// and visibility, like the custom areas below
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
        <LightEmptyHint
          text="Outline other boundaries, such as wards, over the data."
          actionLabel="Add outlines"
          onAction={add}
        />
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
                      <SelectValue>
                        {overlayName(overlay.areaSetCode)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(28rem,var(--radix-select-content-available-height))] max-w-80">
                      <GroupedSelectOptions groups={overlayGroups} />
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
