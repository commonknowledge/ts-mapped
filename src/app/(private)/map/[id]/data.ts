import { gql, useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import {
  AreaSetCode,
  AreaStatsQuery,
  AreaStatsQueryVariables,
  DataRecordsQuery,
  DataRecordsQueryVariables,
  DataSourcesQuery,
  DeletePlacedMarkerMutationMutation,
  DeletePlacedMarkerMutationMutationVariables,
  DeleteTurfMutation,
  DeleteTurfMutationVariables,
  MapQuery,
  MapQueryVariables,
  Operation,
  UpsertPlacedMarkerMutation,
  UpsertPlacedMarkerMutationVariables,
  UpsertTurfMutation,
  UpsertTurfMutationVariables,
} from "@/__generated__/types";
import { PointFeature } from "@/types";
import { MarkersQueryResult } from "./types";

export const useDataSourcesQuery = () =>
  useQuery<DataSourcesQuery>(gql`
    query DataSources {
      dataSources {
        id
        name
        columnDefs {
          name
          type
        }
      }
    }
  `);

export const useMapQuery = (mapId: string | null) =>
  useQuery<MapQuery, MapQueryVariables>(
    gql`
      query Map($id: String!) {
        map(id: $id) {
          placedMarkers {
            id
            label
            notes
            point {
              lat
              lng
            }
          }
          turfs {
            id
            label
            notes
            area
            geometry
            createdAt
          }
          views {
            id
            config {
              areaDataSourceId
              areaDataColumn
              areaSetGroupCode
              excludeColumnsString
              markersDataSourceId
              mapStyleName
              showBoundaryOutline
              showLabels
              showLocations
              showMembers
              showTurf
            }
          }
        }
      }
    `,
    { variables: { id: mapId || "" }, skip: !mapId },
  );

// Use API request instead of GraphQL to avoid server memory load
// TODO: replace with gql @stream directive when Apollo client supports it
export const useMarkersQuery = ({
  dataSourceId,
}: {
  dataSourceId: string;
}): MarkersQueryResult => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    dataSource: {
      id: string;
      name: string;
      markers: { type: "FeatureCollection"; features: PointFeature[] };
    };
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!dataSourceId) {
      return;
    }

    const fetchMarkers = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/data-sources/${dataSourceId}/markers`,
        );
        if (!response.ok) {
          throw new Error(`Bad response: ${response.status}`);
        }
        const dataSource = await response.json();
        setData(dataSource);
      } catch (e) {
        console.error("Fetch markers error", e);
        setError("Failed");
      }
      setLoading(false);
    };

    fetchMarkers();
  }, [dataSourceId]);
  return { loading, data, error };
};

export const useDataRecordsQuery = (dataSourceId: string) =>
  useQuery<DataRecordsQuery, DataRecordsQueryVariables>(
    gql`
      query DataRecords($dataSourceId: String!) {
        dataSource(id: $dataSourceId) {
          id
          name
          columnDefs {
            name
            type
          }
          records {
            id
            externalId
            json
          }
        }
      }
    `,
    { variables: { dataSourceId } },
  );

export const useAreaStatsQuery = ({
  areaSetCode,
  dataSourceId,
  column,
  excludeColumns,
  useDummyBoundingBox,
}: {
  areaSetCode: AreaSetCode;
  dataSourceId: string;
  column: string;
  excludeColumns: string[];
  useDummyBoundingBox: boolean;
}) =>
  useQuery<AreaStatsQuery, AreaStatsQueryVariables>(
    gql`
      query AreaStats(
        $areaSetCode: AreaSetCode!
        $dataSourceId: String!
        $column: String!
        $operation: Operation!
        $excludeColumns: [String!]!
        $boundingBox: BoundingBoxInput
      ) {
        areaStats(
          areaSetCode: $areaSetCode
          dataSourceId: $dataSourceId
          column: $column
          operation: $operation
          excludeColumns: $excludeColumns
          boundingBox: $boundingBox
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
        column,
        operation: Operation.AVG,
        excludeColumns,
        // Using a dummy boundingBox is required for fetchMore() to update this query's data.
        // Note: this makes the first query return no data. Only fetchMore() returns data.
        boundingBox: useDummyBoundingBox
          ? { north: 0, east: 0, south: 0, west: 0 }
          : null,
      },
      skip: !dataSourceId || !column,
      notifyOnNetworkStatusChange: true,
    },
  );

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
      $id: String
      $label: String!
      $notes: String!
      $point: PointInput!
      $mapId: String!
    ) {
      upsertPlacedMarker(
        id: $id
        label: $label
        notes: $notes
        point: $point
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
      $geometry: JSON!
      $createdAt: Date!
      $mapId: String!
    ) {
      upsertTurf(
        id: $id
        label: $label
        notes: $notes
        area: $area
        geometry: $geometry
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
