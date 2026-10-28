import { LoaderPinwheel, PlusIcon } from "lucide-react";
import { useState } from "react";

import { usePlacedMarkersQuery } from "@/app/(private)/map/[id]/hooks/usePlacedMarkers";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import {
  useMarkerDataSources,
  useMembersDataSource,
} from "@/hooks/useDataSources";
import { MapType } from "@/models/MapView";
import { LayerType } from "@/types";
import { useMapViews } from "../../../hooks/useMapViews";
import { useMarkerMenuItems } from "../../../hooks/useMarkerMenuItems";
import MarkerLegend from "../../Legend/MarkerLegend";
import LayerControlWrapper from "../LayerControlWrapper";
import LayerHeader from "../LayerHeader";
import MarkersList from "./MarkersList";

export default function MarkersControl() {
  const { viewConfig } = useMapViews();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const markerDataSources = useMarkerDataSources() || [];
  const membersDataSource = useMembersDataSource();
  const [expanded, setExpanded] = useState(true);
  const isHex = viewConfig.mapType === MapType.Hex;
  const { getDropdownItems, loading } = useMarkerMenuItems();

  return (
    <LayerControlWrapper
      className={isHex ? "opacity-45 pointer-events-none" : undefined}
    >
      <LayerHeader
        label="Markers"
        type={LayerType.Marker}
        expanded={expanded}
        setExpanded={setExpanded}
        enableVisibilityToggle={Boolean(
          placedMarkers.length > 0 ||
          markerDataSources.length > 0 ||
          membersDataSource,
        )}
      >
        {loading && <LoaderPinwheel className="animate-spin" size={16} />}
        <IconButtonWithTooltip
          align="start"
          side="right"
          tooltip="Marker options"
          dropdownLabel="Marker options"
          dropdownItems={getDropdownItems()}
        >
          <PlusIcon size={16} />
        </IconButtonWithTooltip>
      </LayerHeader>
      {expanded && (
        <div className="px-4 pb-6 flex flex-col gap-3">
          <MarkersList dropdownItems={getDropdownItems()} />
          <MarkerLegend />
        </div>
      )}
    </LayerControlWrapper>
  );
}
