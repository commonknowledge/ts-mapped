"use client";

import {
  ChevronRightIcon,
  CopyIcon,
  EllipsisIcon,
  EyeIcon,
  EyeOffIcon,
  MapIcon,
  MousePointerClickIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AreaSetCodeLabels } from "@/labels";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { cn } from "@/shadcn/utils";
import { formatNumber } from "@/utils/text";
import { getDefaultAreaSetGroupCode } from "../../components/Choropleth/configs";
import { AREA_LIST_COLORS } from "../../constants";
import { useAreaStats } from "../../data";
import {
  useAreaListVisibility,
  useAreaLists,
  useInspectedAreaList,
  useQuickAddAreaList,
} from "../../hooks/useAreaLists";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useGoToArea } from "../../hooks/useGoToArea";
import { useInspectorState } from "../../hooks/useInspectorState";
import { useMapViews } from "../../hooks/useMapViews";
import { useSavedVisualisations } from "../../hooks/useSavedVisualisations";
import { getBoundaryName } from "../utils/boundaries";
import type { AreaList } from "@/models/Map";

/**
 * Lists of key areas (e.g. target seats), at the foot of Areas: each
 * outlined on the map in its colour, its areas one click away
 */
export default function LightAreaLists() {
  const { lists, createList } = useAreaLists();
  const { start: startQuickAdd } = useQuickAddAreaList();
  const { choroplethLayerConfig } = useChoropleth();

  return (
    <div className="mt-3" data-tour="area-lists">
      <div className="flex items-center gap-1">
        <p className="text-[11px] text-neutral-500">Lists</p>
        <button
          type="button"
          // A new list, straight into adding areas to it by clicking
          onClick={() =>
            startQuickAdd(
              createList({
                name: `List ${lists.length + 1}`,
                areaSetCode: choroplethLayerConfig.areaSetCode,
              }).id,
            )
          }
          aria-label="New list"
          title="New list: click areas on the map to add them"
          className="ml-auto cursor-pointer rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <PlusIcon className="size-4" />
        </button>
      </div>
      {lists.length > 0 && (
        <ul className="-mx-1.5 mt-1 flex flex-col">
          {lists.map((list) => (
            <li key={list.id}>
              <AreaListRow list={list} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AreaListRow({ list }: { list: AreaList }) {
  const { updateList, removeList, setInList } = useAreaLists();
  const { isVisible, setVisible } = useAreaListVisibility();
  const { choroplethLayerConfig } = useChoropleth();
  const { data: areaStats } = useAreaStats();
  const { selectedBoundary, resetInspector } = useInspectorState();
  const { list: inspectedList, inspect } = useInspectedAreaList();
  const {
    list: quickAddList,
    start: startQuickAdd,
    stop: stopQuickAdd,
  } = useQuickAddAreaList();
  const isQuickAdding = quickAddList?.id === list.id;
  const isInspected = inspectedList?.id === list.id;
  const goToArea = useGoToArea();
  const { setViewBoundaries } = useSavedVisualisations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const visible = isVisible(list.id);
  const { viewConfig } = useMapViews();
  const isOnTheseBoundaries =
    list.areaSetCode === choroplethLayerConfig.areaSetCode ||
    (!viewConfig.areaSetGroupCode && Boolean(viewConfig.boundariesListsOnly));

  // Each area with the figure on the map, highest first, when the map is
  // on the list's boundaries
  const areas = useMemo(() => {
    const valueByCode = new Map(
      areaStats?.areaSetCode === list.areaSetCode
        ? areaStats.stats.map((stat) => [stat.areaCode, stat.primary])
        : [],
    );
    const withValues = list.areas.map((area) => {
      const value = valueByCode.get(area.code);
      return { ...area, value: typeof value === "number" ? value : null };
    });
    return withValues.some((area) => area.value !== null)
      ? withValues.sort(
          (a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity),
        )
      : withValues.sort((a, b) => a.name.localeCompare(b.name));
  }, [areaStats, list.areaSetCode, list.areas]);

  const copyNames = () =>
    navigator.clipboard
      .writeText(list.areas.map((area) => area.name).join("\n"))
      .then(() => toast.success(`Copied ${list.areas.length} names`))
      .catch(() => toast.error("Couldn't copy the names"));

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-neutral-50",
          isInspected && "bg-neutral-100 hover:bg-neutral-100",
          isQuickAdding && "bg-neutral-100 ring-1 ring-neutral-300",
          !visible && "opacity-60",
        )}
      >
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? "Hide" : "Show"} ${list.name}'s areas`}
          className="-ml-0.5 shrink-0 cursor-pointer rounded p-0.5 hover:bg-neutral-100"
        >
          <ChevronRightIcon
            className={cn(
              "size-3.5 text-neutral-400 transition-transform",
              isExpanded && "rotate-90",
            )}
          />
        </button>
        {/* Opens the list in the inspector's place */}
        <button
          type="button"
          onClick={() => {
            resetInspector();
            inspect(list.id);
          }}
          title={`Inspect ${list.name}`}
          data-tour-list={list.id}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-left"
        >
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: list.color }}
          />
          {isRenaming ? (
            <input
              autoFocus
              defaultValue={list.name}
              aria-label="List name"
              maxLength={200}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== list.name) updateList(list.id, { name });
                setIsRenaming(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setIsRenaming(false);
              }}
              className="min-w-0 flex-1 rounded bg-neutral-100 px-1 text-sm outline-none"
            />
          ) : (
            <span
              className="min-w-0 flex-1"
              onDoubleClick={() => setIsRenaming(true)}
            >
              <span className="block truncate text-sm">{list.name}</span>
              {/* Its boundaries: what can join it, and what it's drawn on */}
              <span className="block truncate text-[11px] text-neutral-400">
                {list.areas.length === 0
                  ? "Any boundaries"
                  : getBoundaryName(list.areaSetCode)}
              </span>
            </span>
          )}
          <span className="shrink-0 text-xs tabular-nums text-neutral-400">
            {list.areas.length}
          </span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`${list.name} options`}
              className="shrink-0 cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <EllipsisIcon className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setIsRenaming(true)}>
              <PencilIcon className="size-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                isQuickAdding ? stopQuickAdd() : startQuickAdd(list.id)
              }
            >
              <MousePointerClickIcon className="size-3.5" />
              {isQuickAdding ? "Done adding areas" : "Click areas to add"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setVisible(list.id, !visible)}>
              {visible ? (
                <EyeOffIcon className="size-3.5" />
              ) : (
                <EyeIcon className="size-3.5" />
              )}
              {visible ? "Hide on map" : "Show on map"}
            </DropdownMenuItem>
            {!isOnTheseBoundaries && list.areas.length > 0 && (
              <DropdownMenuItem
                onClick={() =>
                  setViewBoundaries({
                    code: getDefaultAreaSetGroupCode(list.areaSetCode),
                  })
                }
              >
                <MapIcon className="size-3.5" />
                Show {getBoundaryName(list.areaSetCode).toLowerCase()}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={copyNames}
              disabled={list.areas.length === 0}
            >
              <CopyIcon className="size-3.5" />
              Copy names
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] font-normal text-neutral-500">
              Colour
            </DropdownMenuLabel>
            <div className="flex flex-wrap gap-1.5 px-2 pb-2">
              {AREA_LIST_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateList(list.id, { color })}
                  aria-label={`Colour ${color}`}
                  className={cn(
                    "size-5 cursor-pointer rounded-sm",
                    color === list.color &&
                      "ring-2 ring-neutral-900 ring-offset-1",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => removeList(list.id)}
            >
              <TrashIcon className="size-3.5" />
              Delete list
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && (
        <div className="mb-1 ml-5 border-l border-neutral-100 pl-1.5">
          {list.areas.length === 0 ? (
            <p className="px-1.5 py-1 text-[11px] text-neutral-400">
              No areas yet. Click an area on the map, then &ldquo;Add to
              list&rdquo; in the inspector.
            </p>
          ) : (
            <ul className="flex flex-col">
              {areas.map((area) => (
                <li key={area.code} className="group/area relative">
                  <button
                    type="button"
                    onClick={() =>
                      goToArea({
                        code: area.code,
                        name: area.name,
                        areaSetCode: list.areaSetCode,
                      })
                    }
                    title={`Go to ${area.name}`}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 rounded-md py-1 pr-7 pl-1.5 text-left text-xs text-neutral-700 hover:bg-neutral-50",
                      selectedBoundary?.code === area.code && "bg-neutral-100",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{area.name}</span>
                    {area.value !== null && (
                      <span className="shrink-0 tabular-nums text-neutral-400">
                        {formatNumber(area.value)}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setInList({ listId: list.id, area, isIn: false })
                    }
                    aria-label={`Remove ${area.name} from ${list.name}`}
                    title="Remove from list"
                    className="absolute top-1/2 right-1 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-neutral-400 opacity-0 group-hover/area:opacity-100 hover:bg-neutral-200 hover:text-neutral-900 focus-visible:opacity-100"
                  >
                    <XIcon className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!isOnTheseBoundaries && list.areas.length > 0 && (
            <p className="px-1.5 pt-1 text-[11px] leading-snug text-neutral-400">
              {AreaSetCodeLabels[list.areaSetCode]}: outlined on the map when
              those boundaries are shown.
            </p>
          )}
        </div>
      )}
    </>
  );
}
