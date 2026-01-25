import { useMemo } from "react";

import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useMarkerQueries } from "@/app/map/[id]/hooks/useMarkerQueries";
import { useLayers } from "../../hooks/useLayers";
import { DataSourceMarkers } from "./DataSourceMarkers";

export default function Markers() {
  const { viewConfig } = useMapViews();
  const { mapConfig } = useMapConfig();
  const markerQueries = useMarkerQueries();
  const { getDataSourceVisibility } = useLayers();

  const memberMarkers = useMemo(
    () =>
      markerQueries?.data.find(
        (dsm) => dsm.dataSourceId === mapConfig.membersDataSourceId,
      ),
    [markerQueries, mapConfig.membersDataSourceId],
  );

  const otherMarkers = useMemo(
    () =>
      mapConfig.markerDataSourceIds.map((id) =>
        markerQueries?.data.find((dsm) => dsm.dataSourceId === id),
      ),
    [markerQueries, mapConfig.markerDataSourceIds],
  );

  return (
    <>
      {memberMarkers && getDataSourceVisibility(memberMarkers.dataSourceId) && (
        <DataSourceMarkers
          key={memberMarkers.dataSourceId}
          dataSourceMarkers={memberMarkers}
          isMembers
          mapConfig={mapConfig}
        />
      )}
      {otherMarkers.map((markers) => {
        if (
          !markers ||
          !viewConfig.showLocations ||
          !getDataSourceVisibility(markers.dataSourceId)
        ) {
          return null;
        }
        return (
          <DataSourceMarkers
            key={markers.dataSourceId}
            dataSourceMarkers={markers}
            isMembers={false}
            mapConfig={mapConfig}
          />
        );
      })}
    </>
  );
}
