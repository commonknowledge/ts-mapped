import { gql, useMutation, useQuery } from "@apollo/client";
import { SortingState } from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";
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
  MemberDataSourceQuery,
  MemberDataSourceQueryVariables,
  Operation,
  UpsertPlacedMarkerMutation,
  UpsertPlacedMarkerMutationVariables,
  UpsertTurfMutation,
  UpsertTurfMutationVariables,
} from "@/__generated__/types";
import { DataSourceMarkers } from "./types";

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
        recordCount
      }
    }
  `);

export const useDataRecordsQuery = (variables: {
  dataSourceId: string;
  filter: string;
  page: number;
  sort: SortingState;
}) =>
  useQuery<DataRecordsQuery, DataRecordsQueryVariables>(
    gql`
      query DataRecords(
        $dataSourceId: String!
        $filter: String!
        $page: Int!
        $sort: [SortInput]!
      ) {
        dataSource(id: $dataSourceId) {
          id
          name
          columnDefs {
            name
            type
          }
          records(filter: $filter, page: $page, sort: $sort) {
            id
            externalId
            geocodePoint {
              lat
              lng
            }
            json
          }
          recordCount
        }
      }
    `,
    { variables },
  );

export const useMapQuery = (mapId: string | null) =>
  useQuery<MapQuery, MapQueryVariables>(
    gql`
      query Map($id: String!) {
        map(id: $id) {
          name
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
              markerDataSourceIds
              membersDataSourceId
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
export const useMarkerQueries = ({
  membersDataSourceId,
  markerDataSourceIds,
}: {
  membersDataSourceId: string;
  markerDataSourceIds: string[];
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<DataSourceMarkers[]>([]);
  const cache = useRef<Record<string, DataSourceMarkers>>({});

  useEffect(() => {
    const fetchMarkers = async () => {
      setLoading(true);
      setData([]);
      const dataSourceIds = [
        membersDataSourceId,
        ...markerDataSourceIds,
      ].filter(Boolean);
      try {
        for (const id of dataSourceIds) {
          if (!cache.current[id]) {
            const response = await fetch(`/api/data-sources/${id}/markers`);
            if (!response.ok) {
              throw new Error(`Bad response: ${response.status}`);
            }
            const dataSourceMarkers = await response.json();
            cache.current[id] = dataSourceMarkers;
          }
          setData(Object.values(cache.current));
        }
      } catch (e) {
        console.error("Fetch markers error", e);
        setError("Failed");
      }
      setLoading(false);
    };
    fetchMarkers();
  }, [markerDataSourceIds, membersDataSourceId]);

  return { loading, data, error };
};

export const useMemberDataSourceQuery = (dataSourceId: string) =>
  useQuery<MemberDataSourceQuery, MemberDataSourceQueryVariables>(
    gql`
      query MemberDataSource($dataSourceId: String!) {
        dataSource(id: $dataSourceId) {
          id
          name
          config
          columnDefs {
            name
            type
          }
          recordCount
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
