import { useQuery } from "@tanstack/react-query";
import { LoaderPinwheel } from "lucide-react";
import { useContext, useMemo } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { getDataSourceIds } from "@/app/map/[id]/context/MapContext";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useFoldersQuery } from "@/app/map/[id]/hooks/useFolders";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { usePlacedMarkersQuery } from "@/app/map/[id]/hooks/usePlacedMarkers";
import { MARKER_ID_KEY, MARKER_NAME_KEY } from "@/constants";
import { AreaSetCode } from "@/server/models/AreaSet";
import { DataSourceRecordType } from "@/server/models/DataSource";

import { useTRPC } from "@/services/trpc/react";
import { useMarkerQueries } from "../../hooks/useMarkerQueries";
import {
  checkIfAnyRecords,
  getMarkersInsidePolygon,
  getRecordsInsideBoundary,
  mapPlacedMarkersToRecordsResponse,
} from "./helpers";
import { MarkersList, MembersList, PlacedMarkersList } from "./MarkersLists";

export default function BoundaryMarkersList() {
  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig();
  const { data: folders = [] } = useFoldersQuery();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const markerQueries = useMarkerQueries();
  const { selectedBoundary } = useContext(InspectorContext);
  const dataSourceIds = getDataSourceIds(mapConfig);

  const data = markerQueries?.data?.map((result, i) => ({
    dataSource: getDataSourceById(dataSourceIds[i]),
    records: {
      count: { matched: 0 },
      records: result?.markers?.map((marker) => ({
        id: marker.properties?.[MARKER_ID_KEY] as string,
        name: marker?.properties?.[MARKER_NAME_KEY] as string,
        json: marker.properties,
        geocodePoint: {
          lng: marker?.geometry?.coordinates?.[0],
          lat: marker?.geometry?.coordinates?.[1],
        },
      })),
    },
  }));

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
    if (!areaData || !data) {
      return [];
    }

    return getRecordsInsideBoundary(data, areaData.geography);
  }, [data, areaData]);

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

  const markersInBoundary = useMemo(() => {
    return getMarkersInsidePolygon(placedMarkers, areaData?.geography);
  }, [areaData, placedMarkers]);

  const mappedPlacedMarkers = useMemo(() => {
    return mapPlacedMarkersToRecordsResponse(markersInBoundary, folders);
  }, [folders, markersInBoundary]);

  if (areaDataLoading) {
    return <LoaderPinwheel className="animate-spin" size={16} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {members && (
        <MembersList
          dataSource={members.dataSource}
          records={members.records}
        />
      )}

      {(markers?.length > 0 || mappedPlacedMarkers.length > 0) && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-mono uppercase text-muted-foreground">
            Markers in this boundary
          </h2>

          {!checkIfAnyRecords([...mappedPlacedMarkers, ...markers]) && (
            <p>No markers in this boundary</p>
          )}

          {mappedPlacedMarkers.length > 0 &&
            mappedPlacedMarkers.map((markersGroup, index) => (
              <PlacedMarkersList
                key={`placed-markers-${markersGroup.folder?.id || "no-folder"}-${index}`}
                folder={markersGroup.folder}
                records={markersGroup.records}
              />
            ))}

          {markers?.length > 0 &&
            markers.map((markersGroup, index) => (
              <MarkersList
                key={`markers-${markersGroup.dataSource?.id || "no-datasource"}-${index}`}
                dataSource={markersGroup.dataSource}
                records={markersGroup.records}
              />
            ))}
        </div>
      )}
    </div>
  );
}
