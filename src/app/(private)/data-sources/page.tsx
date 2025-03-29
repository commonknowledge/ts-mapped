import { gql } from "@apollo/client";
import { Link } from "@/components/Link";
import { getClient } from "@/services/ApolloClient";
import { UserDataSourceCard } from "./components/DataSourceCard";
import { DataSourceType } from "@/types";
import { Separator } from "@/shadcn/ui/separator";
import { Button } from "@/shadcn/ui/button";
import { PlusIcon } from "lucide-react";
import PageHeader from "@/components/PageHeader";
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
    <div className="p-4 mx-auto max-w-6xl w-full">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Data sources"
          description="Here you can find all the data sources that are available to use to import into your maps."
        />
        <Link href="/data-sources/new">
          <Button variant="default" size="lg">
            <PlusIcon className="w-4 h-4" />
            Add new
          </Button>
        </Link>
      </div>
      <Separator className="my-4" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 overflow-y-auto w-full">
        {data.dataSources.map(
          ({
            id,
            name,
            config,
            createdAt,
          }: {
            id: string;
            name: string;
            config: { type: DataSourceType; createdAt: Date };
            createdAt: Date;
          }) => (
            <UserDataSourceCard
              key={id}
              id={id}
              name={name}
              config={config}
              createdAt={createdAt}
            />
          )
        )}
      </div>
    </div>
  );
}
