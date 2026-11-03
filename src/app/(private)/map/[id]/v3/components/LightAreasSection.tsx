"use client";

import { LockIcon, LockOpenIcon, PaletteIcon, PlusIcon } from "lucide-react";
import { useMemo } from "react";
import { useDataSources } from "@/hooks/useDataSources";
import { AreaSetGroupCodeLabels } from "@/labels";
import { Button } from "@/shadcn/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import { useAreaSettings } from "../../hooks/useAreaSettings";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useInspectorLayers } from "../../hooks/useInspectorLayers";
import { useMapViews } from "../../hooks/useMapViews";
import { useSavedVisualisations } from "../../hooks/useSavedVisualisations";
import { useAddAreaData } from "../hooks/useAddAreaData";
import { useOpenInspectorSectionEditor } from "../hooks/useInspectorCustomise";
import LightAreaSourceGroup from "./LightAreaSourceGroup";
import LightBoundaryPicker from "./LightBoundaryPicker";
import LightSection from "./LightSection";
import LightVisualisationRow, {
  ActiveDetails,
  getColumnLabel,
} from "./LightVisualisationRow";

// What the areas are coloured by: a list of visualisations, each carrying the
// boundaries it's shown on. The active one colours the map and shows its
// boundaries and legend; the rest are one click away. With none active the
// view just draws outlines. Editing happens in the visualisation flyout.
export default function LightAreasSection() {
  const { setBoundariesPanelOpen } = useChoropleth();
  const { viewConfig } = useMapViews();
  const { areaSettings } = useAreaSettings();
  const { setHidden: setInspectorHidden } = useInspectorLayers();
  const openInspectorSection = useOpenInspectorSectionEditor();
  const { getDataSourceById } = useDataSources();
  const {
    items,
    activeId,
    select,
    deactivate,
    remove,
    removeSource,
    boundariesLocked,
    setBoundariesLocked,
    lockedBoundary,
    setLockedBoundary,
    fitsLockedBoundary,
    getBoundariesFor,
  } = useSavedVisualisations();

  // Locked boundaries that don't fit an entry's data: greyed, and shown at
  // the closest level that does fit
  const getLockedNote = (dataSourceId: string) => {
    if (!boundariesLocked || !lockedBoundary) return null;
    if (fitsLockedBoundary(dataSourceId)) return null;
    const closest = getBoundariesFor(dataSourceId);
    return `Not available by ${AreaSetGroupCodeLabels[lockedBoundary]} · shown by ${AreaSetGroupCodeLabels[closest]}`;
  };
  const activeName = items.find((item) => item.id === activeId)
    ? getDataSourceById(viewConfig.areaDataSourceId)?.name
    : null;

  // One group per data source, in the order they were first added
  const groups = useMemo(() => {
    const order = [...new Set(items.map((item) => item.areaDataSourceId))];
    return order.map((dataSourceId) => ({
      dataSourceId,
      items: items.filter((item) => item.areaDataSourceId === dataSourceId),
    }));
  }, [items]);
  const isHiddenFromInspector = (dataSourceId: string) =>
    Boolean(areaSettings.inspectorHiddenDataSourceIds?.includes(dataSourceId));

  // Start an empty visualisation and let the flyout pick its data
  const addData = useAddAreaData();

  return (
    <LightSection
      label="Areas"
      layerType={activeId ? LayerType.Boundary : undefined}
      actions={
        items.length > 0 && (
          <button
            type="button"
            onClick={() => addData()}
            aria-label="Add data"
            title="Add data"
            className="cursor-pointer rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <PlusIcon className="size-4" />
          </button>
        )
      }
    >
      {/* Always shown, so the list doesn't jump; greyed out while the
          active visualisation is setting the boundaries */}
      <div className="mb-2 flex items-center gap-1">
        <LightBoundaryPicker
          label="Boundaries"
          allowNone={!activeId}
          disabled={Boolean(activeId) && !boundariesLocked}
          disabledReason={`Set by ${activeName ?? "the active visualisation"}. Lock to use one set of boundaries for all data.`}
          {...(boundariesLocked
            ? { value: lockedBoundary, onChange: setLockedBoundary }
            : {})}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setBoundariesLocked(!boundariesLocked)}
              aria-pressed={boundariesLocked}
              aria-label={
                boundariesLocked
                  ? "Let each visualisation use its own boundaries"
                  : "Use these boundaries for all data"
              }
              className={cn(
                "shrink-0 cursor-pointer rounded p-1.5 hover:bg-neutral-100",
                boundariesLocked
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-700",
              )}
            >
              {boundariesLocked ? (
                <LockIcon className="size-3.5" />
              ) : (
                <LockOpenIcon className="size-3.5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-60 text-left">
            <p className="font-medium">
              {boundariesLocked ? "Boundaries locked" : "Lock boundaries"}
            </p>
            <p className="mt-0.5 opacity-80">
              {boundariesLocked
                ? "Every visualisation uses these boundaries. Unlock to let each one go back to its own."
                : "Each visualisation currently uses its own boundaries. Lock to use these for all of them instead."}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      {items.length > 0 ? (
        <ul className="-mx-1.5 flex flex-col gap-2">
          {groups.map((group) => {
            // A source with one column is a single row: its header shows
            // and edits that column
            const single = group.items.length === 1 ? group.items[0] : null;
            // Library data comes with its column (e.g. 2024 GE Results' Result)
            const dataSource = getDataSourceById(group.dataSourceId);
            const libraryDefault = dataSource?.public
              ? dataSource.defaultChoroplethConfig
              : null;
            const active = group.items.find((item) => item.id === activeId);
            const edit = (id: string) => {
              select(id);
              setBoundariesPanelOpen(true);
            };
            const turnOff = () => {
              deactivate();
              setBoundariesPanelOpen(false);
            };
            return (
              <LightAreaSourceGroup
                key={group.dataSourceId || "new"}
                dataSourceId={group.dataSourceId}
                hasActive={Boolean(active)}
                subtitle={
                  single
                    ? single.areaDataColumn
                      ? getColumnLabel(single)
                      : (libraryDefault?.column ?? "Choose a column")
                    : undefined
                }
                onToggle={() => {
                  if (active) return turnOff();
                  if (single && !single.areaDataColumn) {
                    return libraryDefault
                      ? select(single.id, {
                          areaDataColumn: libraryDefault.column,
                          calculationType: libraryDefault.calculationType,
                        })
                      : edit(single.id);
                  }
                  select(group.items[0].id);
                }}
                onEdit={single ? () => edit(single.id) : undefined}
                isInInspector={!isHiddenFromInspector(group.dataSourceId)}
                onToggleInspector={() =>
                  setInspectorHidden(
                    group.dataSourceId,
                    !isHiddenFromInspector(group.dataSourceId),
                  )
                }
                onEditInspector={() => openInspectorSection(group.dataSourceId)}
                onAddColumn={() => addData(group.dataSourceId)}
                onRemove={() => removeSource(group.dataSourceId)}
              >
                {single ? (
                  active && <ActiveDetails dataSourceId={group.dataSourceId} />
                ) : (
                  <ul className="flex flex-col gap-0.5">
                    {group.items.map((item) => (
                      <LightVisualisationRow
                        key={item.id}
                        item={item}
                        isActive={item.id === activeId}
                        onSelect={() => select(item.id)}
                        onDeactivate={turnOff}
                        onEdit={() => edit(item.id)}
                        onRemove={() => remove(item.id)}
                        lockedNote={getLockedNote(item.areaDataSourceId)}
                      />
                    ))}
                  </ul>
                )}
              </LightAreaSourceGroup>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-200 p-3 text-center">
          <p className="text-xs text-neutral-500">
            Colour areas by election results, census figures or your own data.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 h-7 text-xs"
            onClick={() => addData()}
          >
            <PaletteIcon className="size-3.5" />
            Choose data
          </Button>
        </div>
      )}
    </LightSection>
  );
}
