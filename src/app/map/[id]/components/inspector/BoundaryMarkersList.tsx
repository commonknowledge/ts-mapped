import { useQuery } from "@tanstack/react-query";
import { LoaderPinwheel } from "lucide-react";
import { useContext, useMemo } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useFoldersQuery } from "@/app/map/[id]/hooks/useFolders";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { usePlacedMarkersQuery } from "@/app/map/[id]/hooks/usePlacedMarkers";
import { AreaSetCode } from "@/server/models/AreaSet";
import { DataSourceRecordType } from "@/server/models/DataSource";

import { useTRPC } from "@/services/trpc/react";
import { useMarkerQueries } from "../../hooks/useMarkerQueries";
import {
  getMarkersInsideBoundary,
  getMarkersInsidePolygon,
  groupPlacedMarkersByFolder,
} from "./helpers";
import { MarkersList, MembersList, PlacedMarkersList } from "./MarkersLists";

export default function BoundaryMarkersList() {
  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig();
  const { data: folders = [] } = useFoldersQuery();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const markerQueries = useMarkerQueries();
  const { selectedBoundary } = useContext(InspectorContext);

  const trpc = useTRPC();
  const { data: areaData, isPending: areaDataLoading } = useQuery(
    trpc.area.byCode.queryOptions(
      {
        code: selectedBoundary?.areaCode || "",
        areaSetCode: selectedBoundary?.areaSetCode || AreaSetCode.WMC24,
      },
      { enabled: Boolean(selectedBoundary) },
    ),
  );

  // frontend filtering - looking for markers within the selected boundary
  const filteredData = useMemo(() => {
    if (!areaData || !markerQueries.data) {
      return [];
    }

    return getMarkersInsideBoundary(markerQueries.data, areaData.geography).map(
      (data) => ({ ...data, dataSource: getDataSourceById(data.dataSourceId) }),
    );
  }, [areaData, getDataSourceById, markerQueries.data]);

  const members = useMemo(
    () =>
      filteredData.find(
        (item) =>
          item?.dataSource?.recordType === DataSourceRecordType.Members ||
          item?.dataSource?.id === mapConfig.membersDataSourceId,
      ),
    [filteredData, mapConfig.membersDataSourceId],
  );

  const markers = useMemo(
    () =>
      filteredData.filter(
        (item) =>
          item?.dataSource?.recordType !== DataSourceRecordType.Members &&
          item?.dataSource?.id !== mapConfig.membersDataSourceId,
      ),
    [filteredData, mapConfig.membersDataSourceId],
  );

  const placedMarkersInBoundary = useMemo(() => {
    return getMarkersInsidePolygon(placedMarkers, areaData?.geography);
  }, [areaData, placedMarkers]);

  const placedMarkersByFolder = useMemo(() => {
    return groupPlacedMarkersByFolder(placedMarkersInBoundary, folders);
  }, [folders, placedMarkersInBoundary]);

  if (areaDataLoading) {
    return <LoaderPinwheel className="animate-spin" size={16} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {members && (
        <MembersList
          dataSource={members.dataSource}
          markers={members.markers}
          areaType="boundary"
        />
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-mono uppercase text-muted-foreground">
          Markers in this boundary
        </h2>

        {placedMarkersInBoundary.length === 0 &&
          markers.every((m) => m.markers.length === 0) && (
            <p>No markers in this boundary</p>
          )}

        {placedMarkersInBoundary.length > 0 &&
          placedMarkersByFolder.map((markersGroup) => (
            <PlacedMarkersList
              key={`placed-markers-${markersGroup.folder?.id || "no-folder"}`}
              folder={markersGroup.folder}
              placedMarkers={markersGroup.placedMarkers}
            />
          ))}

        {markers?.length > 0 &&
          markers.map((markersGroup) => (
            <MarkersList
              key={`markers-${markersGroup.dataSource?.id || "no-datasource"}`}
              dataSource={markersGroup.dataSource}
              markers={markersGroup.markers}
            />
          ))}
      </div>
    </div>
  );
}
