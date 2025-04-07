import { gql } from "@apollo/client";
import {
  DataSourceQuery,
  DataSourceQueryVariables,
} from "@/__generated__/types";
import { query } from "@/services/ApolloClient";
import { EditableDataSourceTypes } from "@/types";
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
          columnRoles {
            nameColumn
          }
          enrichments {
            sourceType
            areaSetCode
            areaProperty
            dataSourceId
            dataSourceColumn
          }
          enrichmentDataSources {
            id
            name
          }
          geocodingConfig {
            type
            column
            areaSetCode
          }
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
      {EditableDataSourceTypes.includes(result.data.dataSource.config.type) && (
        <DataSourceEnrichmentDashboard dataSource={result.data.dataSource} />
      )}
    </>
  );
}
