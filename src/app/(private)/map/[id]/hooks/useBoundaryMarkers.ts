"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  getMarkersInsideBoundary,
  getMarkersInsidePolygon,
  groupPlacedMarkersByFolder,
} from "@/app/(private)/map/[id]/components/InspectorPanel/helpers";
import { useDataSources } from "@/hooks/useDataSources";
import { parseAreaGeography } from "@/models/Area";
import { AreaSetCode } from "@/models/AreaSet";
import { DataSourceRecordType } from "@/models/DataSource";
import { useTRPC } from "@/services/trpc/react";
import { useFoldersQuery } from "./useFolders";
import { useMapConfig } from "./useMapConfig";
import { useMarkerQueries } from "./useMarkerQueries";
import { usePlacedMarkersQuery } from "./usePlacedMarkers";
import type { SelectedBoundary } from "../types/inspector";

/**
 * Markers inside a boundary, grouped the way the inspector Markers tab
 * shows them: members, per-source markers and placed markers. `markerCount`
 * counts the "Markers in this boundary" section (markers + placed markers,
 * members excluded) so the tab label always matches the list.
 */
export function useBoundaryMarkers(
  selectedBoundary: SelectedBoundary | null | undefined,
) {
  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig();
  const { data: folders = [] } = useFoldersQuery();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const markerQueries = useMarkerQueries();

  const trpc = useTRPC();
  const { data: areaData, isPending: areaDataLoading } = useQuery(
    trpc.area.byCode.queryOptions(
      {
        code: selectedBoundary?.code || "",
        areaSetCode: selectedBoundary?.areaSetCode || AreaSetCode.WMC24,
      },
      { enabled: Boolean(selectedBoundary) },
    ),
  );

  const geography = useMemo(
    () =>
      areaData?.geoJson ? parseAreaGeography(areaData.geoJson) : undefined,
    [areaData],
  );

  // frontend filtering - looking for markers within the selected boundary
  const filteredData = useMemo(() => {
    if (!geography || !markerQueries.data) {
      return [];
    }

    return getMarkersInsideBoundary(markerQueries.data, geography).map(
      (data) => ({ ...data, dataSource: getDataSourceById(data.dataSourceId) }),
    );
  }, [geography, getDataSourceById, markerQueries.data]);

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
    return getMarkersInsidePolygon(placedMarkers, geography);
  }, [geography, placedMarkers]);

  const placedMarkersByFolder = useMemo(() => {
    return groupPlacedMarkersByFolder(placedMarkersInBoundary, folders);
  }, [folders, placedMarkersInBoundary]);

  const markerCount = useMemo(() => {
    let count = placedMarkersInBoundary.length;
    for (const group of markers) {
      count += group.markers.length;
    }
    return count;
  }, [markers, placedMarkersInBoundary]);

  return {
    areaDataLoading,
    // Raw geoJson string (as stored on turfs) alongside the parsed geography
    areaGeoJson: areaData?.geoJson,
    geography,
    members,
    markers,
    placedMarkersInBoundary,
    placedMarkersByFolder,
    markerCount,
  };
}
