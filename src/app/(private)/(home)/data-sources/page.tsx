"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Boxes,
  CalendarDays,
  Database,
  LoaderPinwheel,
  MapPin,
  Pentagon,
  PlusIcon,
  Users,
} from "lucide-react";
import { useContext, useState } from "react";
import { AreaSetGroupCode, DataSourceRecordType } from "@/__generated__/types";
import { CollectionIcon } from "@/app/(private)/map/[id]/components/Icons";
import { DataSourceItem } from "@/components/DataSourceItem";
import { Link } from "@/components/Link";
import { mapColors } from "@/components/Map/styles";
import PageHeader from "@/components/PageHeader";
import { AreaSetGroupCodeLabels } from "@/labels";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";

// Define mapped data library items grouped by category
const mappedDataLibrary = {
  localityShapes: [
    {
      id: "boundaries-wmc24",
      name: AreaSetGroupCodeLabels[AreaSetGroupCode.WMC24],
      description: "Westminster Parliamentary Constituencies for UK mapping",
      type: "boundary",
      category: "Locality Shapes",
    },
    {
      id: "boundaries-oa21",
      name: AreaSetGroupCodeLabels[AreaSetGroupCode.OA21],
      description: "Census Output Areas for detailed area mapping",
      type: "boundary",
      category: "Locality Shapes",
    },
  ],
  referenceData: [
    {
      id: "ge-2024",
      name: "General Election 2024",
      description: "Elecectoral results for the 2024 General Election",
      type: "dataset",
      category: "Reference Data",
    },
    {
      id: "deprivation-2021",
      name: "Deprivation 2021",
      description:
        "Deprivation data for the 2021 Index of Multiple Deprivation",
      type: "dataset",
      category: "Reference Data",
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
      { enabled: Boolean(organisationId) },
    ),
  );

  const memberDataSources = dataSources?.filter((dataSource) => {
    return dataSource.recordType === DataSourceRecordType.Members;
  });

  const referenceDataSources = dataSources?.filter((dataSource) => {
    return dataSource.recordType === DataSourceRecordType.Data;
  });

  const eventDataSources = dataSources?.filter((dataSource) => {
    return dataSource.recordType === DataSourceRecordType.Events;
  });

  const locationDataSources = dataSources?.filter((dataSource) => {
    return dataSource.recordType === DataSourceRecordType.Locations;
  });

  const peopleDataSources = dataSources?.filter((dataSource) => {
    return dataSource.recordType === DataSourceRecordType.People;
  });

  const otherDataSources = dataSources?.filter((dataSource) => {
    return dataSource.recordType === DataSourceRecordType.Other;
  });

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
            Your Data
          </TabsTrigger>
          <TabsTrigger
            value="mapped-library"
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Mapped Data Library
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
                title="Your Data Sources"
                description="Here you can find all the data sources that you have uploaded."
                action={
                  <Link href="/data-sources/new">
                    <Button variant="default" size="lg">
                      <PlusIcon className="w-4 h-4" />
                      Add new
                    </Button>
                  </Link>
                }
              />
              {/* Show message if no data sources at all */}
              {dataSources && dataSources.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No dddd sources yet</p>
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

              {/* Member Collections Section */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CollectionIcon color={mapColors.member.color} />
                  Member Collections
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {memberDataSources?.map((dataSource) => (
                    <Link
                      key={dataSource.id}
                      href={`/data-sources/${dataSource.id}`}
                      className="hover:border-blue-300"
                    >
                      <DataSourceItem dataSource={dataSource} />
                    </Link>
                  ))}
                  {memberDataSources?.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-400">
                      <Users className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No member collections yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reference Data Section */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-600" />
                  Reference Data
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {referenceDataSources?.map((dataSource) => (
                    <Link
                      key={dataSource.id}
                      href={`/data-sources/${dataSource.id}`}
                      className="hover:border-blue-300"
                    >
                      <DataSourceItem dataSource={dataSource} />
                    </Link>
                  ))}
                  {referenceDataSources?.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-400">
                      <Database className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No reference data yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Events Section */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-purple-600" />
                  Events
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {eventDataSources?.map((dataSource) => (
                    <Link
                      key={dataSource.id}
                      href={`/data-sources/${dataSource.id}`}
                      className="hover:border-blue-300"
                    >
                      <DataSourceItem dataSource={dataSource} />
                    </Link>
                  ))}
                  {eventDataSources?.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-400">
                      <CalendarDays className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No events data yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Locations Section */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  Locations
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {locationDataSources?.map((dataSource) => (
                    <Link
                      key={dataSource.id}
                      href={`/data-sources/${dataSource.id}`}
                      className="hover:border-blue-300"
                    >
                      <DataSourceItem dataSource={dataSource} />
                    </Link>
                  ))}
                  {locationDataSources?.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-400">
                      <MapPin className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No locations data yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* People Section */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-600" />
                  People
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {peopleDataSources?.map((dataSource) => (
                    <Link
                      key={dataSource.id}
                      href={`/data-sources/${dataSource.id}`}
                      className="hover:border-blue-300"
                    >
                      <DataSourceItem dataSource={dataSource} />
                    </Link>
                  ))}
                  {peopleDataSources?.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-400">
                      <Users className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No people data yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Other Section */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-gray-600" />
                  Other
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {otherDataSources?.map((dataSource) => (
                    <Link
                      key={dataSource.id}
                      href={`/data-sources/${dataSource.id}`}
                      className="hover:border-blue-300"
                    >
                      <DataSourceItem dataSource={dataSource} />
                    </Link>
                  ))}
                  {otherDataSources?.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-400">
                      <Boxes className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No other data yet</p>
                    </div>
                  )}
                </div>
              </div>
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
                  <Link href="/data-sources/new">
                    <Button variant="default" size="lg">
                      <PlusIcon className="w-4 h-4" />
                      Request a new data source
                    </Button>
                  </Link>
                }
              />
            </div>
            {/* Locality Shapes Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Pentagon className="w-5 h-5 text-blue-600" />
                Locality Shapes
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
                Reference Data
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
