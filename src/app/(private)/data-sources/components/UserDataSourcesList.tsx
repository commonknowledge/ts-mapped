"use client";

import { Boxes, Database, PlusIcon, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { DataSourceRecordType } from "@/__generated__/types";
import { CollectionIcon } from "@/app/map/[id]/components/Icons";
import { mapColors } from "@/app/map/[id]/styles";
import { DataSourceItem } from "@/components/DataSourceItem";
import DataSourceRecordTypeIcon, {
  dataSourceRecordTypeColors,
  dataSourceRecordTypeLabels,
} from "@/components/DataSourceRecordTypeIcon";
import { Link } from "@/components/Link";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
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
      dataSources?.filter(
        (dataSource) => dataSource.recordType === DataSourceRecordType.Members,
      ),
    [dataSources],
  );

  const otherDataSources = useMemo(
    () =>
      dataSources?.filter(
        (dataSource) => dataSource.recordType !== DataSourceRecordType.Members,
      ),
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
          label: dataSourceRecordTypeLabels[rt],
          color: dataSourceRecordTypeColors[rt],
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
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CollectionIcon color={mapColors.member.color} />
            Member data sources
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ">
            {memberDataSources?.map((dataSource) => (
              <Link
                key={dataSource.id}
                href={`/data-sources/${dataSource.id}`}
                className="hover:border-blue-300 h-full"
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
                const isDisabled = !option.items?.length;
                const isSelected = selectedFilter === option.value;

                return (
                  <button
                    key={option.value}
                    disabled={isDisabled}
                    onClick={() =>
                      !isDisabled && setSelectedFilter(option.value)
                    }
                    className={cn(
                      "px-3 py-1 text-xs rounded-full border transition-colors flex items-center gap-1 cursor-pointer",
                      isDisabled && "pointer-events-none opacity-60",
                      isSelected
                        ? "bg-blue-100 border-blue-200"
                        : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100",
                    )}
                  >
                    {option.value === "all" ? null : (
                      <DataSourceRecordTypeIcon
                        type={option.value}
                        className={option.color}
                        size={16}
                      />
                    )}
                    {option.label} ({option.items?.length || 0})
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
