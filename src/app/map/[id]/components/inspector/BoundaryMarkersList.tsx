import { useQueries } from "@tanstack/react-query";
import * as turf from "@turf/turf";
import { useContext, useMemo } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import {
  useChoroplethDataSource,
  useDataSources,
} from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { FilterType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { type RecordsResponse } from "@/types";
import {
  checkIfAnyRecords,
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
  const choroplethDataSource = useChoroplethDataSource();

  // Use the same data source as the boundary list for consistency
  const dataSourceIds = choroplethDataSource?.id
    ? [choroplethDataSource.id]
    : [];

  // Get boundary feature from the inspector content
  const boundaryFeature = useMemo(() => {
    if (!selectedBoundary) {
      console.log("BoundaryMarkersList - No inspector content or wrong type");
      return null;
    }

    const feature = selectedBoundary?.boundaryFeature ?? null;
    if (!feature) {
      console.log(
        "BoundaryMarkersList - No boundaryFeature in inspectorContent"
      );
      return null;
    }

    // Convert vector tile feature to proper GeoJSON if needed
    if ((feature as unknown as Record<string, unknown>)._vectorTileFeature) {
      return {
        type: "Feature",
        geometry: feature.geometry,
        properties: feature.properties,
      } as Feature<Polygon | MultiPolygon>;
    }

    return feature;
  }, [selectedBoundary]);

  // Fetch all data source records (we'll filter them spatially)
  const { data, isFetching } = useQueries({
    queries: dataSourceIds.map((dataSourceId) =>
      trpc.dataRecord.list.queryOptions(
        {
          dataSourceId,
          filter: {
            type: FilterType.GEO,
            // Note: We can't use turf filter for boundaries like we do for areas
            // because boundaries are vector tiles, not individual features
          },
          page: 0,
        },
        { refetchOnMount: "always" }
      )
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

  // Filter records that are within the boundary
  const filteredData = useMemo(() => {
    if (!boundaryFeature) {
      return [];
    }

    return data.map(({ dataSource, records }) => {
      const filteredRecords = records.records.filter((record) => {
        if (!boundaryFeature) {
          return false;
        }

        // Additional safety check for boundaryFeature structure
        if (!boundaryFeature.geometry) {
          return false;
        }

        const point = turf.point([
          record.geocodePoint.lng,
          record.geocodePoint.lat,
        ]);
        const isInside = turf.booleanPointInPolygon(
          point,
          boundaryFeature as Feature<Polygon>
        );

        return isInside;
      });

      return {
        dataSource,
        records: {
          count: { matched: filteredRecords.length },
          records: filteredRecords,
        },
      };
    });
  }, [data, boundaryFeature]);

  const members = useMemo(
    () =>
      filteredData.find(
        (item) =>
          item?.dataSource?.recordType === DataSourceRecordType.Members ||
          item?.dataSource?.id === mapConfig.membersDataSourceId
      ),
    [filteredData, mapConfig.membersDataSourceId]
  );

  const markers = useMemo(
    () =>
      filteredData.filter(
        (item) =>
          item?.dataSource?.recordType !== DataSourceRecordType.Members &&
          item?.dataSource?.id !== mapConfig.membersDataSourceId
      ),
    [filteredData, mapConfig.membersDataSourceId]
  );

  // Filter placed markers that are within the boundary
  const markersInBoundary = useMemo(() => {
    if (!boundaryFeature) {
      console.log(
        "BoundaryMarkersList - No boundaryFeature for markers filtering"
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
        boundaryFeature as Feature<Polygon>
      );

      return isInside;
    });

    return filtered;
  }, [boundaryFeature, placedMarkers]);

  const mappedPlacedMarkers = useMemo(() => {
    return mapPlacedMarkersToRecordsResponse(markersInBoundary, folders);
  }, [folders, markersInBoundary]);

  if (isFetching) {
    return <p>Loading...</p>;
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
