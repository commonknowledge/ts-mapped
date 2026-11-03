"use client";

import {
  EyeIcon,
  EyeOffIcon,
  FolderPlusIcon,
  LoaderPinwheelIcon,
  PlusIcon,
} from "lucide-react";
import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { MapType } from "@/models/MapView";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import { LayerRowVariantContext } from "../../components/controls/LayerRowVariantContext";
import TurfsList from "../../components/controls/TurfsControl/TurfsList";
import { useFolderMutations, useFoldersQuery } from "../../hooks/useFolders";
import { useLayers } from "../../hooks/useLayers";
import {
  useEditAreaMode,
  useSetEditAreaMode,
} from "../../hooks/useMapControls";
import { useMapViews } from "../../hooks/useMapViews";
import { useTurfState } from "../../hooks/useTurfState";

export default function LightCustomAreas() {
  const { handleAddArea } = useTurfState();
  const { viewConfig } = useMapViews();
  const editAreaMode = useEditAreaMode();
  const setEditAreaMode = useSetEditAreaMode();
  const { data: folders = [] } = useFoldersQuery();
  const { insertFolder, isMutating } = useFolderMutations();

  const turfFolders = useMemo(
    () => folders.filter((f) => f.type === "turf"),
    [folders],
  );

  const onAddArea = () => {
    if (editAreaMode) {
      setEditAreaMode(false);
    } else {
      setEditAreaMode(true);
      handleAddArea();
    }
  };

  const createFolder = () =>
    insertFolder({
      id: uuidv4(),
      name: `New Folder ${turfFolders.length + 1}`,
      notes: "",
      type: "turf",
    });

  const { getLayerVisibility, hideLayer, showLayer } = useLayers();
  const isVisible = getLayerVisibility(LayerType.Turf);

  if (viewConfig.mapType === MapType.Hex) {
    return null;
  }

  // Drawn areas are boundaries you make yourself, so they sit with the
  // boundary sets rather than as a separate layer
  return (
    <div className="mt-3">
      <div className="group/areas flex items-center gap-1">
        <p className="text-[11px] text-neutral-500">Drawn areas</p>
        <button
          type="button"
          onClick={() =>
            isVisible ? hideLayer(LayerType.Turf) : showLayer(LayerType.Turf)
          }
          aria-label={`${isVisible ? "Hide" : "Show"} drawn areas`}
          title={isVisible ? "Hide all" : "Show all"}
          className={cn(
            "cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700",
            isVisible && "opacity-0 group-hover/areas:opacity-100",
          )}
        >
          {isVisible ? (
            <EyeIcon className="size-3.5" />
          ) : (
            <EyeOffIcon className="size-3.5" />
          )}
        </button>
        <div className="ml-auto flex items-center gap-1">
          {isMutating && (
            <LoaderPinwheelIcon className="size-3.5 animate-spin text-neutral-400" />
          )}
          {editAreaMode ? (
            <span className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
              Drawing…
            </span>
          ) : (
            <IconButtonWithTooltip
              align="start"
              side="right"
              tooltip="Add drawn areas"
              dropdownLabel="Add drawn areas"
              dropdownItems={[
                { type: "item", label: "Draw area", onClick: onAddArea },
                { type: "separator" },
                {
                  type: "item",
                  icon: (
                    <FolderPlusIcon className="size-4 text-muted-foreground" />
                  ),
                  label: "Add folder",
                  onClick: createFolder,
                },
              ]}
            >
              <PlusIcon className="size-4" />
            </IconButtonWithTooltip>
          )}
        </div>
      </div>
      {/* Light rows put each area's colour on the row, in line with the
          boundary swatches above */}
      <div className={cn("-mb-3", !isVisible && "opacity-50")}>
        <LayerRowVariantContext.Provider value="light">
          <TurfsList onAddArea={onAddArea} />
        </LayerRowVariantContext.Provider>
      </div>
    </div>
  );
}
