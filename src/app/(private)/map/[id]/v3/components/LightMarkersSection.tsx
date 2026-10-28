"use client";

import { LoaderPinwheelIcon, PlusIcon } from "lucide-react";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { MapType } from "@/models/MapView";
import { LayerType } from "@/types";
import MarkersList from "../../components/controls/MarkersControl/MarkersList";
import MarkerLegend from "../../components/Legend/MarkerLegend";
import { useMapViews } from "../../hooks/useMapViews";
import { useMarkerMenuItems } from "../../hooks/useMarkerMenuItems";
import LightDataSourceRow from "./LightDataSourceRow";
import LightSection from "./LightSection";

export default function LightMarkersSection() {
  const { viewConfig } = useMapViews();
  const { getDropdownItems, loading } = useMarkerMenuItems();

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
          <IconButtonWithTooltip
            align="start"
            side="right"
            tooltip="Add markers"
            dropdownLabel="Add markers"
            dropdownItems={getDropdownItems()}
          >
            <PlusIcon className="size-4" />
          </IconButtonWithTooltip>
        </>
      }
    >
      {/* Data source rows are light; placed markers and folders keep their
          drag-and-drop from the classic list. The negative margins cancel
          that list's own padding so every section shares one rhythm. */}
      <div className="-mx-1.5 -mt-2 -mb-3">
        <MarkersList
          dropdownItems={getDropdownItems()}
          DataSourceRow={LightDataSourceRow}
        />
      </div>
      <div className="mt-2 empty:hidden">
        <MarkerLegend />
      </div>
    </LightSection>
  );
}
