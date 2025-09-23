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
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "your-data" | "mapped-library")
        }
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="your-data" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Your data
          </TabsTrigger>
          <TabsTrigger
            value="mapped-library"
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Mapped data library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="your-data" className="mt-6">
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
        </TabsContent>

        <TabsContent value="mapped-library" className="mt-6">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <PageHeader
                title="Mapped Data Library"
                description="Here you can find all the data sources that Mapped manages and makes available to use in your maps."
                action={
                  <Button variant="default" size="lg" asChild={true}>
                    <Link href="mailto:mapped@commonknowledge.coop?subject=Movement Data Library request">
                      <Mail size={16} />
                      Request a new data source
                    </Link>
                  </Button>
                }
              />
            </div>
            {/* Locality Shapes Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Pentagon className="w-5 h-5 text-blue-600" />
                Locality shapes
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mappedDataLibrary.localityShapes.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white">
                        <Pentagon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {item.name}
                          </h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Boundary
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {item.description}
                        </p>
                        <span className="text-xs text-gray-500">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reference Data Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-green-600" />
                Reference data
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mappedDataLibrary.referenceData.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-lg flex items-center justify-center text-white">
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {item.name}
                          </h4>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Dataset
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {item.description}
                        </p>
                        <span className="text-xs text-gray-500">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
