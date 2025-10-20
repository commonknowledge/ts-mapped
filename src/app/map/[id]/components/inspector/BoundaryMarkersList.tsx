import { useQueries } from "@tanstack/react-query";
import * as turf from "@turf/turf";
import { useContext, useMemo } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { getDataSourceIds } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { useTRPC } from "@/services/trpc/react";
import { type RecordsResponse } from "@/types";
import {
  checkIfAnyRecords,
  getRecordsInsideBoundary,
  mapPlacedMarkersToRecordsResponse,
} from "./helpers";
import { MarkersList, MembersList, PlacedMarkersList } from "./MarkersLists";
import type { Feature, MultiPolygon, Polygon } from "geojson";

export default function BoundaryMarkersList() {
  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig();
  const { folders, placedMarkers } = useContext(MarkerAndTurfContext);
  const { selectedBoundary } = useContext(InspectorContext);
  const trpc = useTRPC();

  const dataSourceIds = getDataSourceIds(mapConfig);

  const boundaryFeature = useMemo(() => {
    if (!selectedBoundary) {
      return null;
    }

    const feature = selectedBoundary?.boundaryFeature ?? null;
    if (!feature) {
      return null;
    }

    if ((feature as unknown as Record<string, unknown>)._vectorTileFeature) {
      return {
        type: "Feature",
        geometry: feature.geometry,
        properties: feature.properties,
      } as Feature<Polygon | MultiPolygon>;
    }

    return feature;
  }, [selectedBoundary]);

  // TODO: change to FE mapping
  const { data } = useQueries({
    queries: dataSourceIds.map((dataSourceId) =>
      trpc.dataRecord.list.queryOptions(
        {
          dataSourceId,
          page: 0,
        },
        { refetchOnMount: "always" },
      ),
    ),
    combine: (results) => ({
      data: results.map((result, i) => ({
        dataSource: getDataSourceById(dataSourceIds[i]),
        records: (result.data as RecordsResponse) ?? {
          count: { matched: 0 },
          records: [],
        },
      })),
      isFetching: results.some((r) => r.isFetching),
    }),
  });

  const filteredData = useMemo(() => {
    if (!boundaryFeature) {
      return [];
    }

    return getRecordsInsideBoundary(data, boundaryFeature as Feature<Polygon>);
  }, [data, boundaryFeature]);

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
    if (!boundaryFeature) {
      console.log(
        "BoundaryMarkersList - No boundaryFeature for markers filtering",
      );
      return [];
    }

    const filtered = (placedMarkers || []).filter((marker) => {
      if (!boundaryFeature.geometry) {
        return false;
      }

      const point = turf.point([marker.point.lng, marker.point.lat]);
      const isInside = turf.booleanPointInPolygon(
        point,
        boundaryFeature as Feature<Polygon>,
      );

      return isInside;
    });

    return filtered;
  }, [boundaryFeature, placedMarkers]);

  const mappedPlacedMarkers = useMemo(() => {
    return mapPlacedMarkersToRecordsResponse(markersInBoundary, folders);
  }, [folders, markersInBoundary]);

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
