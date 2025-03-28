import { gql } from "@apollo/client";
import {
  DataSourceQuery,
  DataSourceQueryVariables,
} from "@/__generated__/types";
import { query } from "@/services/ApolloClient";
import GeocodeDataSourceForm from "./GeocodeDataSourceForm";

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
          geocodingConfig
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
    <div className="container">
      <h1>Geocode {result.data.dataSource.name}</h1>
      <GeocodeDataSourceForm dataSource={result.data.dataSource} />
    </div>
  );
}
