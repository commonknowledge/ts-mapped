import { useQueries } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { getDataSourceIds } from "@/app/map/[id]/context/MapContext";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useFoldersQuery } from "@/app/map/[id]/hooks/useFolders";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { usePlacedMarkersQuery } from "@/app/map/[id]/hooks/usePlacedMarkers";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { FilterType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { getDataRecordName } from "@/utils/text";
import {
  checkIfAnyRecords,
  getMarkersInsidePolygon,
  mapPlacedMarkersToRecordsResponse,
  mapTurfToGeoFeature,
} from "./helpers";
import { MarkersList, MembersList, PlacedMarkersList } from "./MarkersLists";
import type { RecordData } from "@/types";

export default function TurfMarkersList() {
  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig();
  const { data: folders = [] } = useFoldersQuery();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const { selectedTurf } = useContext(InspectorContext);
  const trpc = useTRPC();

  const dataSourceIds = getDataSourceIds(mapConfig);

  const { data, isFetching } = useQueries({
    queries: dataSourceIds.map((dataSourceId) =>
      trpc.dataRecord.list.queryOptions(
        {
          dataSourceId,
          filter: { type: FilterType.GEO, turf: selectedTurf?.id },
          page: 0,
        },
        { refetchOnMount: "always" },
      ),
    ),
    combine: (results) => ({
      data: results.map((result, i) => {
        const dataSource = getDataSourceById(dataSourceIds[i]);

        if (!result.data) {
          return {
            dataSource,
            recordsResponse: {
              count: { matched: 0 },
              records: [],
            },
          };
        }

        const geocodedRecords: RecordData[] = [];
        for (const r of result.data.records) {
          if (r.geocodePoint) {
            geocodedRecords.push({
              id: r.id,
              name: getDataRecordName(r, dataSource),
              geocodePoint: r.geocodePoint,
            });
          }
        }

        return {
          dataSource,
          recordsResponse: {
            count: result.data.count,
            records: geocodedRecords,
          },
        };
      }),
      isFetching: results.some((r) => r.isFetching),
    }),
  });

  const members = useMemo(
    () =>
      data.find(
        (item) => item?.dataSource?.recordType === DataSourceRecordType.Members,
      ),
    [data],
  );

  const markers = useMemo(
    () =>
      data.filter(
        (item) => item?.dataSource?.recordType !== DataSourceRecordType.Members,
      ),
    [data],
  );

  const turfFeature = useMemo(() => {
    return mapTurfToGeoFeature(selectedTurf);
  }, [selectedTurf]);

  const mappedPlacedMarkers = useMemo(() => {
    const activePlacedMarkers = getMarkersInsidePolygon(
      placedMarkers,
      turfFeature?.geometry,
    );
    return mapPlacedMarkersToRecordsResponse(activePlacedMarkers, folders);
  }, [folders, placedMarkers, turfFeature]);

  if (isFetching) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {members && (
        <MembersList
          dataSource={members.dataSource}
          records={members.recordsResponse}
        />
      )}

      {(markers?.length > 0 || mappedPlacedMarkers.length > 0) && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-mono uppercase text-muted-foreground">
            Markers in this area
          </h2>

          {!checkIfAnyRecords([...mappedPlacedMarkers, ...markers]) && (
            <p>No markers in this area</p>
          )}

          {mappedPlacedMarkers.length > 0 &&
            mappedPlacedMarkers.map((markersGroup, index) => (
              <PlacedMarkersList
                key={index}
                folder={markersGroup.folder}
                records={markersGroup.recordsResponse}
              ></PlacedMarkersList>
            ))}

          {markers?.length > 0 &&
            markers.map((markersGroup, index) => (
              <MarkersList
                key={index}
                dataSource={markersGroup.dataSource}
                records={markersGroup.recordsResponse}
              ></MarkersList>
            ))}
        </div>
      )}
    </div>
  );
}
