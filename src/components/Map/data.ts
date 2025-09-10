import { gql, useMutation, useQuery } from "@apollo/client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaSetCode,
  AreaStatsQuery,
  AreaStatsQueryVariables,
  CalculationType,
  DataRecordsQuery,
  DataRecordsQueryVariables,
  DataSourceView,
  DataSourcesQuery,
  DeleteFolderMutationMutation,
  DeleteFolderMutationMutationVariables,
  DeletePlacedMarkerMutationMutation,
  DeletePlacedMarkerMutationMutationVariables,
  DeleteTurfMutation,
  DeleteTurfMutationVariables,
  MapQuery,
  MapQueryVariables,
  RecordFilterInput,
  SortInput,
  UpdateMapConfigMutation,
  UpdateMapConfigMutationVariables,
  UpsertFolderMutation,
  UpsertFolderMutationVariables,
  UpsertPlacedMarkerMutation,
  UpsertPlacedMarkerMutationVariables,
  UpsertTurfMutation,
  UpsertTurfMutationVariables,
  VisualisationType,
} from "@/__generated__/types";
import { ViewConfig } from "./context/MapContext";
import { DataSourceMarkers } from "./types";

export const useDataSourcesQuery = () =>
  useQuery<DataSourcesQuery>(gql`
    query DataSources {
      dataSources(includePublic: true) {
        id
        name
        config
        columnDefs {
          name
          type
        }
        columnRoles {
          nameColumns
        }
        geocodingConfig {
          areaSetCode
          type
          column
        }
        recordCount {
          count
        }
        autoImport
        public
        config
      }
    }
  `);

export const useDataRecordsQuery = (variables: {
  dataSourceId: string;
  filter?: RecordFilterInput;
  search?: string;
  page: number;
  sort?: SortInput[];
}) =>
  useQuery<DataRecordsQuery, DataRecordsQueryVariables>(
    gql`
      query DataRecords(
        $dataSourceId: String!
        $filter: RecordFilterInput
        $search: String
        $page: Int!
        $sort: [SortInput!]
      ) {
        dataSource(id: $dataSourceId) {
          id
          name
          columnDefs {
            name
            type
          }
          records(filter: $filter, search: $search, page: $page, sort: $sort) {
            id
            externalId
            geocodePoint {
              lat
              lng
            }
            json
          }
          recordCount(filter: $filter, search: $search) {
            count
            matched
          }
        }
      }
    `,
    { variables, skip: !variables.dataSourceId }
  );

export const useMapQuery = (mapId: string | null) =>
  useQuery<MapQuery, MapQueryVariables>(
    gql`
      query Map($id: String!) {
        map(id: $id) {
          name
          config {
            markerDataSourceIds
            membersDataSourceId
          }
          folders {
            id
            name
            notes
            position
          }
          placedMarkers {
            id
            label
            notes
            point {
              lat
              lng
            }
            folderId
            position
          }
          turfs {
            id
            label
            notes
            area
            polygon
            createdAt
          }
          views {
            id
            name
            position
            config {
              areaDataSourceId
              areaDataColumn
              areaSetGroupCode
              excludeColumnsString
              mapStyleName
              showBoundaryOutline
              showLabels
              showLocations
              showMembers
              showTurf
              visualisationType
              calculationType
              colorScheme
            }
            dataSourceViews {
              dataSourceId
              filter {
                children {
                  column
                  dataSourceId
                  dataRecordId
                  distance
                  label
                  operator
                  placedMarker
                  search
                  turf
                  type
                }
                type
              }
              search
              sort {
                name
                desc
              }
            }
          }
        }
      }
    `,
    {
      variables: { id: mapId || "" },
      skip: !mapId,
      fetchPolicy: "network-only",
    }
  );

// Use API request instead of GraphQL to avoid server memory load
// TODO: replace with gql @stream directive when Apollo client supports it
export const useMarkerQueries = ({
  membersDataSourceId,
  markerDataSourceIds,
  dataSourceViews,
}: {
  membersDataSourceId: string;
  markerDataSourceIds: string[];
  dataSourceViews: DataSourceView[];
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<DataSourceMarkers[]>([]);
  const cache = useRef<Record<string, DataSourceMarkers>>({});
  const cacheKeyByDataSource = useRef<Record<string, string>>({});

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
          const filter = JSON.stringify(
            dataSourceViews.find((dsv) => dsv.dataSourceId === id)?.filter ||
              null
          );
          const search =
            dataSourceViews.find((dsv) => dsv.dataSourceId === id)?.search ||
            "";
          const cacheId = `${id}:${filter}:${search}`;
          if (!cache.current[cacheId]) {
            const params = new URLSearchParams();
            params.set("filter", filter);
            params.set("search", search);
            const response = await fetch(
              `/api/data-sources/${id}/markers?${params.toString()}`
            );
            if (!response.ok) {
              throw new Error(`Bad response: ${response.status}`);
            }
            const dataSourceMarkers =
              (await response.json()) as DataSourceMarkers;
            cache.current[cacheId] = dataSourceMarkers;
          }
          cacheKeyByDataSource.current[id] = cacheId;
          // For each active cache key, get the cached value
          // which will be a DataSourceMarkers object
          setData(
            Object.values(cacheKeyByDataSource.current)
              .map((k) => cache.current[k])
              .filter(Boolean)
          );
        }
      } catch (e) {
        console.error("Fetch markers error", e);
        setError("Failed");
      }
      setLoading(false);
    };
    fetchMarkers();
  }, [dataSourceViews, markerDataSourceIds, membersDataSourceId]);

  return useMemo(() => ({ loading, data, error }), [data, error, loading]);
};

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
    }
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
    `
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
    ) {
      upsertFolder(
        id: $id
        name: $name
        notes: $notes
        position: $position
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
