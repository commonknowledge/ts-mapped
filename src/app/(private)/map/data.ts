import { gql, useQuery } from "@apollo/client";
import {
  AreaStatsQuery,
  DataSourcesQuery,
  MarkersQuery,
  Operation,
} from "@/__generated__/types";

export const useDataSourcesQuery = () =>
  useQuery<DataSourcesQuery>(
    gql`
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
    `
  );

export const useMarkersQuery = ({ dataSourceId }: { dataSourceId: string }) =>
  useQuery<MarkersQuery>(
    gql`
      query Markers($dataSourceId: String!) {
        markers(dataSourceId: $dataSourceId) {
          type
          features {
            type
            properties
            geometry {
              type
              coordinates
            }
          }
        }
      }
    `,
    {
      variables: {
        dataSourceId,
      },
      skip: !dataSourceId,
    }
  );

export const useAreaStatsQuery = ({
  areaSetCode,
  dataSourceId,
  column,
  useDummyBoundingBox,
}: {
  areaSetCode: string;
  dataSourceId: string;
  column: string;
  useDummyBoundingBox: boolean;
}) =>
  useQuery<AreaStatsQuery>(
    gql`
      query AreaStats(
        $areaSetCode: String!
        $dataSourceId: String!
        $column: String!
        $operation: Operation!
        $excludeColumns: [String!]!
        $boundingBox: BoundingBox
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
        operation: Operation.Avg,
        excludeColumns: ["segment", "f1", "f2"],
        // Using a dummy boundingBox is required for fetchMore() to update this query's data.
        // Note: this makes the first query return no data. Only fetchMore() returns data.
        boundingBox: useDummyBoundingBox
          ? { north: 0, east: 0, south: 0, west: 0 }
          : null,
      },
      skip: !dataSourceId || !column,
      notifyOnNetworkStatusChange: true,
    }
  );
