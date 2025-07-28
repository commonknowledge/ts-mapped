"use client";
import { gql, useQuery } from "@apollo/client";
import { LoaderPinwheel, PlusIcon } from "lucide-react";
import { useContext } from "react";
import {
  ListDataSourcesQuery,
  ListDataSourcesQueryVariables,
} from "@/__generated__/types";
import { Link } from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { DataSourceType } from "@/types";
import { DataSourceCard } from "./components/DataSourceCard";

export default function DataSourcesPage() {
  const { organisationId } = useContext(OrganisationsContext);
  const { data, loading } = useQuery<
    ListDataSourcesQuery,
    ListDataSourcesQueryVariables
  >(
    gql`
      query ListDataSources($organisationId: String) {
        dataSources(organisationId: $organisationId) {
          id
          name
          config
          createdAt
        }
      }
    `,
    {
      variables: { organisationId },
      skip: !organisationId,
      fetchPolicy: "network-only",
    },
  );
  const dataSources = data?.dataSources || [];

  return (
    <div className="">
      <span
        id="data-sources-tour-start"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1,
          height: 1,
          pointerEvents: "none",
        }}
      />
      <div className="flex items-center justify-between">
        <PageHeader
          title="Data sources"
          description="Here you can find all the data sources that are available to use to import into your maps."
        />
        <Link href="/data-sources/new" id="joyride-datasources-addnew">
          <Button variant="default" size="lg">
            <PlusIcon className="w-4 h-4" />
            Add new
          </Button>
        </Link>
      </div>
      <Separator className="my-4" />
      {loading ? (
        <LoaderPinwheel className="animate-spin" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 overflow-y-auto w-full">
          {dataSources.map(
            ({
              id,
              name,
              config,
              createdAt,
            }: {
              id: string;
              name: string;
              config: { type: DataSourceType };
              createdAt: string;
            }) => (
              <DataSourceCard
                key={id}
                id={id}
                name={name}
                config={config}
                createdAt={createdAt}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
