import { gql, useQuery } from "@apollo/client";
import {
  AreaSetCode,
  AreaStatsQuery,
  AreaStatsQueryVariables,
  DataSourcesQuery,
  MarkersQuery,
  MarkersQueryVariables,
  Operation,
} from "@/__generated__/types";

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

export const useMarkersQuery = ({ dataSourceId }: { dataSourceId: string }) =>
  useQuery<MarkersQuery, MarkersQueryVariables>(
    gql`
      query Markers($dataSourceId: String!) {
        dataSource(id: $dataSourceId) {
          name
          markers
        }
      }
    `,
    {
      variables: {
        dataSourceId,
      },
      skip: !dataSourceId,
    },
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
