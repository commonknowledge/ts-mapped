"use client";

import { PaletteIcon, PlusIcon } from "lucide-react";
import { Button } from "@/shadcn/ui/button";
import { LayerType } from "@/types";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useSavedVisualisations } from "../../hooks/useSavedVisualisations";
import LightSection from "./LightSection";
import LightVisualisationRow from "./LightVisualisationRow";

// The view's visualisations as a list: the active one colours the map and
// shows its legend; the rest are one click away. Editing happens in the
// visualisation flyout.
export default function LightDataVisSection() {
  const { setBoundariesPanelOpen } = useChoropleth();
  const { items, activeId, select, startNew, remove } =
    useSavedVisualisations();

  // Start an empty visualisation and let the flyout pick its data
  const addData = (dataSourceId?: string) => {
    startNew(dataSourceId);
    setBoundariesPanelOpen(true);
  };

  return (
    <LightSection
      label="Data visualisation"
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
      {items.length > 0 ? (
        <ul className="-mx-1.5 flex flex-col gap-0.5">
          {items.map((item) => (
            <LightVisualisationRow
              key={item.id}
              item={item}
              isActive={item.id === activeId}
              onSelect={() => select(item.id)}
              onEdit={() => {
                select(item.id);
                setBoundariesPanelOpen(true);
              }}
              onAddColumn={() => addData(item.areaDataSourceId)}
              onRemove={() => remove(item.id)}
            />
          ))}
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
