"use client";

import { useQuery } from "@tanstack/react-query";
import { Database, LoaderPinwheel, PlusIcon } from "lucide-react";
import { Link } from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import UserDataSourcesList from "./components/UserDataSourcesList";

export default function DataSourcesPage() {
  const { organisationId } = useOrganisations();

  const trpc = useTRPC();
  const { data: dataSources, isPending } = useQuery(
    trpc.dataSource.byOrganisation.queryOptions(
      { organisationId: organisationId || "" },
      { enabled: Boolean(organisationId), refetchOnMount: "always" },
    ),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Your data sources"
        action={
          <Button variant="default" size="lg" asChild={true}>
            <Link href="/data-sources/new">
              <PlusIcon className="w-4 h-4" />
              Add new
            </Link>
          </Button>
        }
      />

      {isPending ? (
        <div className="flex justify-center py-8">
          <LoaderPinwheel className="animate-spin" />
        </div>
      ) : (
        <>
          {/* Show message if no data sources at all */}
          {dataSources && dataSources.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No sources yet</p>
              <p className="text-sm mb-4">
                Create your first data source to get started
              </p>
              <Link href="/data-sources/new">
                <Button variant="outline" size="sm">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Your First Data Source
                </Button>
              </Link>
            </div>
          )}

          {dataSources && dataSources.length > 0 && (
            <UserDataSourcesList dataSources={dataSources} />
          )}
        </>
      )}
    </div>
  );
}
