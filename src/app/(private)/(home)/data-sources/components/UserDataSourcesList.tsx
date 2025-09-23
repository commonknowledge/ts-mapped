"use client";

import { Boxes, Database, PlusIcon, Users } from "lucide-react";
import { useState } from "react";
import { DataSourceRecordType } from "@/__generated__/types";
import { CollectionIcon } from "@/app/(private)/map/[id]/components/Icons";
import { DataSourceItem } from "@/components/DataSourceItem";
import {
  DataSourceRecordTypeIcon,
  dataSourceRecordTypeColors,
  dataSourceRecordTypeIcons,
  dataSourceRecordTypeLabels,
} from "@/components/DataSourceRecordTypeIcon";
import { Link } from "@/components/Link";
import { mapColors } from "@/components/Map/styles";

import { Button } from "@/shadcn/ui/button";

import type { RouterOutputs } from "@/services/trpc/react";

type DataSourceItemType = NonNullable<
  RouterOutputs["dataSource"]["byOrganisation"]
>[0];

export default function UserDataSourcesList({
  dataSources,
}: {
  dataSources: DataSourceItemType[];
}) {
  const [selectedFilter, setSelectedFilter] = useState<
    DataSourceRecordType | "all"
  >("all");

  const memberDataSources = dataSources?.filter((dataSource) => {
    return dataSource.recordType === DataSourceRecordType.Members;
  });

  // Combine all non-member data sources
  const otherDataSources = dataSources?.filter((dataSource) => {
    return dataSource.recordType !== DataSourceRecordType.Members;
  });

  // Filter other data sources based on selected filter
  const filteredOtherDataSources =
    selectedFilter === "all"
      ? otherDataSources
      : otherDataSources?.filter(
          (dataSource) => dataSource.recordType === selectedFilter,
        );

  // Define filter options with their labels and icons
  const filterOptions = [
    {
      value: "all" as const,
      label: "All",
      icon: null,
      color: "text-neutral-600",
    },
    {
      value: DataSourceRecordType.Data,
      label: dataSourceRecordTypeLabels[DataSourceRecordType.Data],
      icon: dataSourceRecordTypeIcons[DataSourceRecordType.Data],
      color: dataSourceRecordTypeColors[DataSourceRecordType.Data],
    },
    {
      value: DataSourceRecordType.Events,
      label: dataSourceRecordTypeLabels[DataSourceRecordType.Events],
      icon: dataSourceRecordTypeIcons[DataSourceRecordType.Events],
      color: dataSourceRecordTypeColors[DataSourceRecordType.Events],
    },
    {
      value: DataSourceRecordType.Locations,
      label: dataSourceRecordTypeLabels[DataSourceRecordType.Locations],
      icon: dataSourceRecordTypeIcons[DataSourceRecordType.Locations],
      color: dataSourceRecordTypeColors[DataSourceRecordType.Locations],
    },
    {
      value: DataSourceRecordType.People,
      label: dataSourceRecordTypeLabels[DataSourceRecordType.People],
      icon: dataSourceRecordTypeIcons[DataSourceRecordType.People],
      color: dataSourceRecordTypeColors[DataSourceRecordType.People],
    },
    {
      value: DataSourceRecordType.Other,
      label: dataSourceRecordTypeLabels[DataSourceRecordType.Other],
      icon: dataSourceRecordTypeIcons[DataSourceRecordType.Other],
      color: dataSourceRecordTypeColors[DataSourceRecordType.Other],
    },
  ];

  return (
    <div>
      <div className="py-6 flex flex-col gap-12">
        {/* Show message if no data sources at all */}
        {dataSources && dataSources.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            <Database className="w-12 h-12 mx-auto mb-6 text-neutral-300" />
            <p className="text-lg font-medium">No sources yet</p>
            <p className="text-sm mb-4">
              Create your first data source to get started
            </p>
            <Link href="/data-sources/new">
              <Button variant="outline" size="sm">
                <PlusIcon className="w-4 h-4 mr-2" />
                Create your first data source
              </Button>
            </Link>
          </div>
        )}

        {/* Member Collections Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CollectionIcon color={mapColors.member.color} />
            Member data sources
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ">
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
              <div className="col-span-full text-center py-8 text-neutral-400">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No member data sources yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Other Data Sources Section */}
        <div>
          <div className="flex items-center mb-6 gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CollectionIcon color={mapColors.dataSource.color} />
              Other data sources
            </h2>
            <div className="flex gap-2 flex-wrap">
              {filterOptions.map((option) => {
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedFilter(option.value)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors flex items-center gap-1 cursor-pointer ${
                      selectedFilter === option.value
                        ? "bg-blue-100 border-blue-200"
                        : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    {option.value === "all" ? null : (
                      <DataSourceRecordTypeIcon
                        type={option.value}
                        className={option.color}
                      />
                    )}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filteredOtherDataSources?.map((dataSource) => (
              <Link
                key={dataSource.id}
                href={`/data-sources/${dataSource.id}`}
                className="hover:border-blue-300"
              >
                <DataSourceItem dataSource={dataSource} />
              </Link>
            ))}
            {filteredOtherDataSources?.length === 0 && (
              <div className="col-span-full text-center py-8 text-neutral-400">
                <Boxes className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">
                  {selectedFilter === "all"
                    ? "No other data sources yet"
                    : `No ${filterOptions.find((opt) => opt.value === selectedFilter)?.label.toLowerCase()} data yet`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
