import { gql, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import {
  AreaSetCode,
  AreaStatsQuery,
  AreaStatsQueryVariables,
  DataSourcesQuery,
  MapViewsQuery,
  MapViewsQueryVariables,
  Operation,
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

export const useMapViewsQuery = (mapId: string | null) =>
  useQuery<MapViewsQuery, MapViewsQueryVariables>(
    gql`
      query MapViews($mapId: String!) {
        mapViews(mapId: $mapId) {
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
    `,
    { variables: { mapId: mapId || "" }, skip: !mapId },
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
