"use client";

import { Boxes, Database, PlusIcon, Users, UsersIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { DataSourceItem } from "@/components/DataSourceItem";
import DataSourceRecordTypeIcon from "@/components/DataSourceRecordTypeIcon";
import { Link } from "@/components/Link";
import { DataSourceRecordTypeLabels } from "@/labels";
import { DataSourceRecordType } from "@/models/DataSource";
import { Button } from "@/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
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

  const memberDataSources = useMemo(
    () =>
      dataSources
        ?.filter(
          (dataSource) =>
            dataSource.recordType === DataSourceRecordType.Members,
        )
        .sort((a, b) => {
          const aDate = a.importInfo?.lastCompleted
            ? new Date(a.importInfo.lastCompleted).getTime()
            : 0;
          const bDate = b.importInfo?.lastCompleted
            ? new Date(b.importInfo.lastCompleted).getTime()
            : 0;
          return bDate - aDate; // Most recent first
        }),
    [dataSources],
  );

  const otherDataSources = useMemo(
    () =>
      dataSources
        ?.filter(
          (dataSource) =>
            dataSource.recordType !== DataSourceRecordType.Members,
        )
        .sort((a, b) => {
          const aDate = a.importInfo?.lastCompleted
            ? new Date(a.importInfo.lastCompleted).getTime()
            : 0;
          const bDate = b.importInfo?.lastCompleted
            ? new Date(b.importInfo.lastCompleted).getTime()
            : 0;
          return bDate - aDate; // Most recent first
        }),
    [dataSources],
  );

  const filterOptions = useMemo(() => {
    const options = [
      {
        value: "all" as const,
        label: "All",
        color: "text-neutral-600",
        items: otherDataSources,
      },
      ...Object.values(DataSourceRecordType)
        .filter((rt) => rt !== DataSourceRecordType.Members)
        .map((rt) => ({
          value: rt,
          label: DataSourceRecordTypeLabels[rt],
          items: otherDataSources?.filter((ds) => ds.recordType === rt),
        })),
    ];

    // push ones with no items to the end
    return options.sort((a, b) => {
      const aEmpty = !a.items?.length;
      const bEmpty = !b.items?.length;
      if (aEmpty === bEmpty) return 0;
      return aEmpty ? 1 : -1;
    });
  }, [otherDataSources]);

  const filteredOtherDataSources =
    filterOptions.find((o) => o.value === selectedFilter)?.items || [];

  return (
    <div>
      <div className="py-6 flex flex-col gap-12">
        {/* Empty state */}
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
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-neutral-500" />
            Member data sources
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ">
            {memberDataSources?.map((dataSource) => (
              <Link
                key={dataSource.id}
                href={`/data-sources/${dataSource.id}`}
                className="hover:border-blue-300 h-full"
              >
                <DataSourceItem
                  dataSource={dataSource}
                  showColumnPreview={true}
                  columnPreviewVariant="pills"
                  maxColumnPills={8}
                />
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
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium shrink-0">Other data sources</h2>
            <div className="w-full sm:ml-auto sm:w-auto sm:max-w-[40ch]">
              <Select
                value={selectedFilter}
                onValueChange={(value) =>
                  setSelectedFilter(value as DataSourceRecordType | "all")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a record type" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((option) => {
                    const isDisabled =
                      option.value !== "all" && !option.items?.length;
                    return (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={isDisabled}
                      >
                        {option.value === "all" ? null : (
                          <DataSourceRecordTypeIcon
                            type={option.value}
                            size={16}
                          />
                        )}
                        {option.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filteredOtherDataSources?.map((dataSource) => (
              <Link
                key={dataSource.id}
                href={`/data-sources/${dataSource.id}`}
                className="hover:border-blue-300"
              >
                <DataSourceItem
                  dataSource={dataSource}
                  showColumnPreview={true}
                  columnPreviewVariant="pills"
                  maxColumnPills={8}
                />
              </Link>
            ))}
            {filteredOtherDataSources?.length === 0 && (
              <div className="col-span-full text-center py-8 text-neutral-400">
                <Boxes className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">
                  {selectedFilter === "all"
                    ? "No other data sources yet"
                    : `No ${filterOptions
                        .find((opt) => opt.value === selectedFilter)
                        ?.label.toLowerCase()} data yet`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
