import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useFoldersQuery } from "@/app/map/[id]/hooks/useFolders";
import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { usePlacedMarkersQuery } from "@/app/map/[id]/hooks/usePlacedMarkers";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { FilterType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { buildName } from "@/utils/dataRecord";
import { getDataSourceIds } from "../../utils/map";
import {
  getMarkersInsidePolygon,
  groupPlacedMarkersByFolder,
  mapTurfToGeoFeature,
} from "./helpers";
import { MarkersList, MembersList, PlacedMarkersList } from "./MarkersLists";
import type { MarkerFeature } from "@/types";

export default function TurfMarkersList() {
  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig();
  const { data: folders = [] } = useFoldersQuery();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const { selectedTurf } = useInspector();
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
        return {
          dataSource,
          markers: result.data
            ? result.data.records
                .filter((r) => r.geocodePoint !== null)
                .map(
                  (r): MarkerFeature => ({
                    type: "Feature",
                    geometry: {
                      // [0, 0] should never happen because this query is filtering by geocodePoint
                      coordinates: [
                        r.geocodePoint?.lng || 0,
                        r.geocodePoint?.lat || 0,
                      ],
                      type: "Point",
                    },
                    properties: {
                      id: r.id,
                      name: buildName(dataSource, r),
                      dataSourceId: r.dataSourceId,
                      matched: true,
                    },
                  }),
                )
            : [],
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

  const placedMarkersInArea = useMemo(() => {
    const activePlacedMarkers = getMarkersInsidePolygon(
      placedMarkers,
      turfFeature?.geometry,
    );
    return groupPlacedMarkersByFolder(activePlacedMarkers, folders);
  }, [folders, placedMarkers, turfFeature]);

  if (isFetching) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {members && (
        <MembersList
          dataSource={members.dataSource}
          markers={members.markers}
          areaType="area"
        />
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-mono uppercase text-muted-foreground">
          Markers in this area
        </h2>

        {placedMarkersInArea.length === 0 &&
          markers.every((m) => m.markers.length === 0) && (
            <p>No markers in this area</p>
          )}

        {placedMarkersInArea.length > 0 &&
          placedMarkersInArea.map((markersGroup) => (
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
