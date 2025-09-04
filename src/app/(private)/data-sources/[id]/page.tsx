import {
  DataSourceQuery,
  DataSourceQueryVariables,
} from "@/__generated__/types";
import { DataSourceFeatures } from "@/features";
import { query } from "@/services/apollo";
import { DataSourceType } from "@/types";
import DataSourceDashboard from "./DataSourceDashboard";
import DataSourceEnrichmentDashboard from "./DataSourceEnrichmentDashboard";
import { DATA_SOURCE_QUERY } from "./queries";

export default async function DataSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await query<DataSourceQuery, DataSourceQueryVariables>({
    query: DATA_SOURCE_QUERY,
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
