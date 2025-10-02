"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Database,
  LoaderPinwheel,
  Mail,
  Pentagon,
  PlusIcon,
} from "lucide-react";
import { useContext, useState } from "react";
import { AreaSetGroupCode } from "@/__generated__/types";
import { Link } from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import { AreaSetGroupCodeLabels } from "@/labels";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import UserDataSourcesList from "./components/UserDataSourcesList";

// Define mapped data library items grouped by category
const mappedDataLibrary = {
  localityShapes: [
    {
      id: "boundaries-wmc24",
      name: AreaSetGroupCodeLabels[AreaSetGroupCode.WMC24],
      description: "Westminster Parliamentary Constituencies for UK mapping",
      type: "boundary",
      category: "Locality shapes",
    },
    {
      id: "boundaries-oa21",
      name: AreaSetGroupCodeLabels[AreaSetGroupCode.OA21],
      description: "Census Output Areas for detailed area mapping",
      type: "boundary",
      category: "Locality shapes",
    },
  ],
  referenceData: [
    {
      id: "ge-2024",
      name: "General Election 2024",
      description: "Elecectoral results for the 2024 General Election",
      type: "dataset",
      category: "Reference data",
    },
    {
      id: "deprivation-2021",
      name: "Deprivation 2021",
      description:
        "Deprivation data for the 2021 Index of Multiple Deprivation",
      type: "dataset",
      category: "Reference data",
    },
  ],
};

export default function DataSourcesPage() {
  const { organisationId } = useContext(OrganisationsContext);
  const [activeTab, setActiveTab] = useState<"your-data" | "mapped-library">(
    "your-data",
  );

  const trpc = useTRPC();
  const { data: dataSources, isPending } = useQuery(
    trpc.dataSource.byOrganisation.queryOptions(
      { organisationId: organisationId || "" },
      { enabled: Boolean(organisationId), refetchOnMount: "always" },
    ),
  );

  return (
    <div className="">
      {isPending ? (
        <div className="flex justify-center py-8">
          <LoaderPinwheel className="animate-spin" />
        </div>
      ) : (
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
        </div>
      )}
    </div>
  );
}
