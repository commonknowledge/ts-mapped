import { gql, useMutation } from "@apollo/client";
import {
  useMutation as useTanstackMutation,
  useQuery as useTanstackQuery,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalculationType, VisualisationType } from "@/__generated__/types";
import { useTRPC } from "@/services/trpc/react";
import type { ViewConfig } from "./context/MapContext";
import type {
  AreaSetCode,
  DeleteFolderMutationMutation,
  DeleteFolderMutationMutationVariables,
  DeletePlacedMarkerMutationMutation,
  DeletePlacedMarkerMutationMutationVariables,
  DeleteTurfMutation,
  DeleteTurfMutationVariables,
  UpdateMapConfigMutation,
  UpdateMapConfigMutationVariables,
  UpsertFolderMutation,
  UpsertFolderMutationVariables,
  UpsertPlacedMarkerMutation,
  UpsertPlacedMarkerMutationVariables,
  UpsertTurfMutation,
  UpsertTurfMutationVariables,
} from "@/__generated__/types";
import type { ColumnType } from "@/server/models/DataSource";
import type { AreaStat, BoundingBox } from "@/types";

export const useAreaStats = ({
  viewConfig,
  areaSetCode,
  boundingBox,
}: {
  viewConfig: ViewConfig;
  areaSetCode: AreaSetCode;
  boundingBox?: BoundingBox | null;
}) => {
  const {
    calculationType,
    areaDataColumn: column,
    areaDataSourceId: dataSourceId,
    areaSetGroupCode,
    visualisationType,
  } = viewConfig;

  // Use a dummy column for counts to avoid un-necessary refetching
  const columnOrCount =
    calculationType === CalculationType.Count ? "__count" : column;

  const viewIsChoropleth = visualisationType === VisualisationType.Choropleth;
  const isMissingDataColumn =
    !column && calculationType !== CalculationType.Count;

  const skipCondition =
    !dataSourceId || // Skip if user has not selected a data source
    !areaSetGroupCode || // Skip if user has not selected an area set group
    !viewIsChoropleth ||
    isMissingDataColumn;

  const trpc = useTRPC();

  // Deduplicate stats by area code
  const [dedupedAreaStats, setDedupedAreaStats] = useState<{
    column: string;
    columnType: ColumnType;
    stats: Record<string, AreaStat>;
  } | null>();

  const excludeColumns = useMemo(() => {
    return viewConfig.excludeColumnsString
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }, [viewConfig.excludeColumnsString]);

  // The results of this query aren't used directly, as data for different
  // bounding boxes needs to be added together. Instead, useEffect is used
  // to add incoming data to the dedupedAreaStats state.
  const areaStatsQuery = useTanstackQuery(
    trpc.area.stats.queryOptions(
      {
        areaSetCode,
        calculationType: calculationType || CalculationType.Value,
        dataSourceId,
        column: columnOrCount,
        excludeColumns,
        boundingBox: boundingBox || { north: 0, east: 0, south: 0, west: 0 },
      },
      { enabled: !skipCondition },
    ),
  );

  // Reset area stats when calculation changes
  // Note: this only works if all the useEffect dependencies trigger a change in areaStatsQuery.data
  useEffect(() => {
    setDedupedAreaStats(null);
  }, [areaSetCode, calculationType, dataSourceId, column, excludeColumns]);

  // Store area stats when queries complete, and aggregate data for different bounding boxes
  useEffect(() => {
    if (!areaStatsQuery.data) {
      return;
    }
    setDedupedAreaStats((prev) => {
      const nextStats = areaStatsQuery.data.stats.reduce(
        (o, s) => {
          o[s.areaCode] = s as AreaStat;
          return o;
        },
        {} as Record<string, AreaStat>,
      );

      if (!prev) {
        return {
          column: areaStatsQuery.data.column,
          columnType: areaStatsQuery.data.columnType,
          stats: nextStats,
        };
      }
      if (
        prev.column === areaStatsQuery.data.column &&
        prev.columnType === areaStatsQuery.data.columnType
      ) {
        return {
          ...prev,
          stats: { ...prev.stats, ...nextStats },
        };
      }
    });
  }, [areaStatsQuery.data]);

  // Return an array of stats for use in components, instead of an object
  const areaStats = useMemo(() => {
    return dedupedAreaStats
      ? {
          column: dedupedAreaStats.column,
          columnType: dedupedAreaStats.columnType,
          stats: Object.values(dedupedAreaStats.stats),
        }
      : null;
  }, [dedupedAreaStats]);

  return { data: areaStats, isFetching: areaStatsQuery.isFetching };
};

export const useUpdateMapConfigMutation = () => {
  return useMutation<UpdateMapConfigMutation, UpdateMapConfigMutationVariables>(
    gql`
      mutation UpdateMapConfig(
        $mapId: String!
        $mapConfig: MapConfigInput!
        $views: [MapViewInput!]!
      ) {
        updateMapConfig(mapId: $mapId, mapConfig: $mapConfig, views: $views) {
          code
        }
      }
    `,
  );
};

export const useDeleteMapViewMutation = () => {
  const trpc = useTRPC();

  return useTanstackMutation(
    trpc.mapView.delete.mutationOptions({
      onSuccess: () => {
        toast.success("View deleted successfully");
      },
      onError: () => {
        toast.error("Failed to delete view");
      },
    }),
  );
};

export const useDeleteFolderMutation = () => {
  return useMutation<
    DeleteFolderMutationMutation,
    DeleteFolderMutationMutationVariables
  >(gql`
    mutation DeleteFolderMutation($id: String!, $mapId: String!) {
      deleteFolder(id: $id, mapId: $mapId) {
        code
      }
    }
  `);
};

export const useUpsertFolderMutation = () => {
  return useMutation<UpsertFolderMutation, UpsertFolderMutationVariables>(gql`
    mutation UpsertFolder(
      $id: String!
      $name: String!
      $notes: String!
      $mapId: String!
      $position: Float!
      $hideMarkers: Boolean
    ) {
      upsertFolder(
        id: $id
        name: $name
        notes: $notes
        position: $position
        mapId: $mapId
        hideMarkers: $hideMarkers
      ) {
        code
        result {
          id
        }
      }
    }
  `);
};

export const useDeletePlacedMarkerMutation = () => {
  return useMutation<
    DeletePlacedMarkerMutationMutation,
    DeletePlacedMarkerMutationMutationVariables
  >(gql`
    mutation DeletePlacedMarkerMutation($id: String!, $mapId: String!) {
      deletePlacedMarker(id: $id, mapId: $mapId) {
        code
      }
    }
  `);
};

export const useUpsertPlacedMarkerMutation = () => {
  return useMutation<
    UpsertPlacedMarkerMutation,
    UpsertPlacedMarkerMutationVariables
  >(gql`
    mutation UpsertPlacedMarker(
      $id: String!
      $label: String!
      $notes: String!
      $point: PointInput!
      $mapId: String!
      $folderId: String
      $position: Float!
    ) {
      upsertPlacedMarker(
        id: $id
        label: $label
        notes: $notes
        point: $point
        mapId: $mapId
        folderId: $folderId
        position: $position
      ) {
        code
        result {
          id
        }
      }
    }
  `);
};

export const useDeleteTurfMutation = () => {
  return useMutation<DeleteTurfMutation, DeleteTurfMutationVariables>(gql`
    mutation DeleteTurf($id: String!, $mapId: String!) {
      deleteTurf(id: $id, mapId: $mapId) {
        code
      }
    }
  `);
};

export const useUpsertTurfMutation = () => {
  return useMutation<UpsertTurfMutation, UpsertTurfMutationVariables>(gql`
    mutation UpsertTurf(
      $id: String
      $label: String!
      $notes: String!
      $area: Float!
      $polygon: JSON!
      $createdAt: Date!
      $mapId: String!
    ) {
      upsertTurf(
        id: $id
        label: $label
        notes: $notes
        area: $area
        polygon: $polygon
        createdAt: $createdAt
        mapId: $mapId
      ) {
        code
        result {
          id
        }
      }
    }
  `);
};
