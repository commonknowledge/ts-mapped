import { gql } from "@apollo/client";
import {
  DataSourceQuery,
  DataSourceQueryVariables,
} from "@/__generated__/types";
import { query } from "@/services/ApolloClient";
import DataSourceDashboard from "./DataSourceDashboard";
import DataSourceEnrichmentDashboard from "./DataSourceEnrichmentDashboard";

export default async function GeocodeDataSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await query<DataSourceQuery, DataSourceQueryVariables>({
    query: gql`
      query DataSource($id: String!) {
        dataSource(id: $id) {
          id
          name
          columnDefs {
            name
            type
          }
          config
          columnsConfig {
            nameColumn
          }
          enrichmentColumns
          enrichmentDataSources {
            id
            name
          }
          geocodingConfig
          enrichmentInfo {
            lastCompleted
            status
          }
          importInfo {
            lastCompleted
            status
          }
          recordCount
        }
      }
    `,
    variables: { id },
  });

  if (!result.data.dataSource) {
    return (
      <div className="container">
        <h1>Not found</h1>
      </div>
    );
  }

  return (
    <>
      <DataSourceDashboard dataSource={result.data.dataSource} />
      <DataSourceEnrichmentDashboard dataSource={result.data.dataSource} />
    </>
  );
}
