"use client";

import { LoaderPinwheelIcon, PlusIcon } from "lucide-react";
import { MapType } from "@/models/MapView";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import { LayerRowVariantContext } from "../../components/controls/LayerRowVariantContext";
import MarkersList from "../../components/controls/MarkersControl/MarkersList";
import MarkerLegend from "../../components/Legend/MarkerLegend";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useFoldersQuery } from "../../hooks/useFolders";
import { useMapConfig } from "../../hooks/useMapConfig";
import { useMapViews } from "../../hooks/useMapViews";
import { useMarkerMenuItems } from "../../hooks/useMarkerMenuItems";
import { useMarkerSettings } from "../../hooks/useMarkerSettings";
import { usePlacedMarkersQuery } from "../../hooks/usePlacedMarkers";
import { useAddMarkersPanel } from "../hooks/useAddMarkersPanel";
import LightDataSourceRow from "./LightDataSourceRow";
import LightEmptyHint from "./LightEmptyHint";
import LightSection from "./LightSection";

export default function LightMarkersSection() {
  const { viewConfig } = useMapViews();
  const { mapConfig } = useMapConfig();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const { data: folders = [] } = useFoldersQuery();
  const { getDropdownItems, loading } = useMarkerMenuItems();
  const isEmpty =
    !mapConfig.membersDataSourceId &&
    mapConfig.markerDataSourceIds.length === 0 &&
    placedMarkers.length === 0 &&
    !folders.some((folder) => !folder.type || folder.type === "placedMarker");
  const [isPanelOpen, setIsPanelOpen] = useAddMarkersPanel();
  const { setBoundariesPanelOpen } = useChoropleth();
  const { setMarkerSettingsDataSourceId } = useMarkerSettings();

  // Opens the Add markers panel in place of any other flyout
  const togglePanel = () => {
    if (!isPanelOpen) {
      setBoundariesPanelOpen(false);
      setMarkerSettingsDataSourceId(null);
    }
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <LightSection
      label="Markers"
      layerType={LayerType.Marker}
      disabled={viewConfig.mapType === MapType.Hex}
      actions={
        <>
          {loading && (
            <LoaderPinwheelIcon className="size-3.5 animate-spin text-neutral-400" />
          )}
          <button
            type="button"
            onClick={togglePanel}
            aria-expanded={isPanelOpen}
            aria-label="Add markers"
            data-tour="add-markers-button"
            title="Add markers"
            className={cn(
              "cursor-pointer rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
              isPanelOpen && "bg-neutral-100 text-neutral-900",
            )}
          >
            <PlusIcon className="size-4" />
          </button>
        </>
      }
    >
      {/* Data source rows are light; placed markers and folders keep their
          drag-and-drop from the classic list. The negative margins cancel
          that list's own padding so every section shares one rhythm. */}
      {isEmpty ? (
        <LightEmptyHint
          text="Members, supporters and places, from your data or pinned by hand."
          actionLabel="Add markers"
          onAction={togglePanel}
        />
      ) : (
        <div className="-mx-1.5 -mt-2 -mb-3">
          {/* Folders and custom markers get the light row: colour swatch
            and visibility on the right, as in Overlays */}
          <LayerRowVariantContext.Provider value="light">
            <MarkersList
              dropdownItems={getDropdownItems()}
              DataSourceRow={LightDataSourceRow}
            />
          </LayerRowVariantContext.Provider>
        </div>
      )}
      <div className="mt-2 empty:hidden">
        <MarkerLegend />
      </div>
    </LightSection>
  );
}
