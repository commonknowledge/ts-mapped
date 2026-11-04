"use client";

import { useDataSources } from "@/hooks/useDataSources";
import { mapColors } from "../styles";
import { useMapConfig } from "./useMapConfig";
import { useMarkerColors } from "./useMarkerColors";

/**
 * The colour a data source's markers are drawn in, or null when it isn't a
 * member or marker layer on this map: the map's colour, then the data
 * source default, then the member / marker layer colour.
 */
export function useMarkerLayerColor(dataSourceId: string | null | undefined) {
  const { mapConfig } = useMapConfig();
  const { markerColors } = useMarkerColors();
  const { getDataSourceById } = useDataSources();

  if (!dataSourceId) return null;
  const isMembers = mapConfig.membersDataSourceId === dataSourceId;
  const isMarkers = mapConfig.markerDataSourceIds.includes(dataSourceId);
  if (!isMembers && !isMarkers) return null;

  return (
    markerColors[dataSourceId] ??
    getDataSourceById(dataSourceId)?.defaultMarkerColor ??
    (isMembers ? mapColors.member.color : mapColors.markers.color)
  );
}
