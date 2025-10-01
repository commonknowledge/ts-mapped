import { gql, useMutation, useQuery } from "@apollo/client";
import { useMutation as useTanstackMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalculationType, VisualisationType } from "@/__generated__/types";
import { useTRPC } from "@/services/trpc/react";
import type { ViewConfig } from "./context/MapContext";
import type {
  AreaSetCode,
  AreaStatsQuery,
  AreaStatsQueryVariables,
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

export const useAreaStatsQuery = ({
  viewConfig,
  areaSetCode,
  useDummyBoundingBox,
}: {
  viewConfig: ViewConfig;
  areaSetCode: AreaSetCode;
  useDummyBoundingBox: boolean;
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

  return useQuery<AreaStatsQuery, AreaStatsQueryVariables>(
    gql`
      query AreaStats(
        $areaSetCode: AreaSetCode!
        $dataSourceId: String!
        $column: String!
        $excludeColumns: [String!]!
        $boundingBox: BoundingBoxInput
        $calculationType: CalculationType!
      ) {
        areaStats(
          areaSetCode: $areaSetCode
          dataSourceId: $dataSourceId
          column: $column
          excludeColumns: $excludeColumns
          boundingBox: $boundingBox
          calculationType: $calculationType
        ) {
          column
          columnType
          stats {
            areaCode
            value
          }
        }
      }
    `,
    {
      variables: {
        areaSetCode,
        dataSourceId,
        column: columnOrCount,
        excludeColumns: viewConfig.getExcludeColumns(),
        // Using a dummy boundingBox is required for fetchMore() to update this query's data.
        // Note: this makes the first query return no data. Only fetchMore() returns data.
        boundingBox: useDummyBoundingBox
          ? { north: 0, east: 0, south: 0, west: 0 }
          : null,
        calculationType: calculationType || CalculationType.Value,
      },
      skip: skipCondition,
      notifyOnNetworkStatusChange: true,
    },
  );
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
