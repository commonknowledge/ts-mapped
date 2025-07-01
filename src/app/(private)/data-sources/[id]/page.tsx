import { gql } from "@apollo/client";
import {
  DataSourceQuery,
  DataSourceQueryVariables,
} from "@/__generated__/types";
import { DataSourceFeatures } from "@/features";
import { query } from "@/services/ApolloClient";
import { DataSourceType } from "@/types";
import DataSourceDashboard from "./DataSourceDashboard";
import DataSourceEnrichmentDashboard from "./DataSourceEnrichmentDashboard";

export default async function DataSourcePage({
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
          autoEnrich
          autoImport
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

  const dataSource = result.data.dataSource;
  if (!dataSource) {
    return (
      <div className="container">
        <h1>Not found</h1>
      </div>
    );
  }

  const features = DataSourceFeatures[dataSource.config.type as DataSourceType];
  return (
    <>
      <DataSourceDashboard dataSource={dataSource} />
      {features.enrichment && (
        <DataSourceEnrichmentDashboard dataSource={dataSource} />
      )}
    </>
  );
}
