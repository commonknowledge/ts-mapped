import { gql } from "@apollo/client";
import { Link } from "@/components/Link";
import { getClient } from "@/services/ApolloClient";

export default async function DataSourcesPage() {
  const apolloClient = await getClient();
  const { data } = await apolloClient.query({
    query: gql`
      query ListDataSources {
        dataSources {
          id
          name
          config
          createdAt
        }
      }
    `,
  });

  return (
    <div className="container">
      <h1>Data Sources</h1>
      <ul>
        {data.dataSources.map(({ id, name }: { id: string; name: string }) => (
          <li key={id}>
            <Link href={`/data-sources/${id}`}>{name}</Link>
          </li>
        ))}
      </ul>
      <Link href="/data-sources/new">Add new</Link>
    </div>
  );
}
