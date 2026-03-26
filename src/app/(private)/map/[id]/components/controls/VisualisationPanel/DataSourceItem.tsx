import { BookOpen } from "lucide-react";

import DataSourceIcon from "@/components/DataSourceIcon";
import { cn } from "@/shadcn/utils";
import type { DataSourceType } from "@/models/DataSource";
import type { RouterOutputs } from "@/services/trpc/react";

type DataSourceItemType = NonNullable<
  RouterOutputs["dataSource"]["byOrganisation"]
>[0];

// Helper function to get data source type from config
const getDataSourceType = (
  dataSource: DataSourceItemType,
): DataSourceType | "unknown" => {
  try {
    const config = dataSource.config;
    return config?.type || "unknown";
  } catch {
    return "unknown";
  }
};

// Helper function to get geocoding status
const getGeocodingStatus = (dataSource: DataSourceItemType) => {
  const geocodingConfig = dataSource.geocodingConfig;
  if (geocodingConfig.type === "None") {
    return { status: "No geocoding", color: "text-neutral-500" };
  }
  if (geocodingConfig.type === "Address") {
    return { status: "Address geocoding", color: "text-green-600" };
  }
  if (geocodingConfig.type === "Code" || geocodingConfig.type === "Name") {
    return { status: "Area-based geocoding", color: "text-blue-600" };
  }
  return { status: "Geocoding configured", color: "text-blue-600" };
};

export function DataSourceItem({
  dataSource,
  className,
}: {
  dataSource: DataSourceItemType;
  className?: string;
}) {
  const dataSourceType = getDataSourceType(dataSource);
  const geocodingStatus = getGeocodingStatus(dataSource);

  return (
    <div
      className={cn(
        "flex flex-col p-2 border rounded-lg cursor-pointer transition-all border-neutral-200 shadow-sm hover:bg-neutral-100",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 text-neutral-600">
          <div className="flex min-w-0 items-center gap-2">
            <DataSourceIcon type={dataSourceType} />
            <p className="text-xs font-mono uppercase">{dataSourceType}</p>
          </div>
          {dataSource.public && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded border border-green-200 bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700">
              <BookOpen className="h-3 w-3 shrink-0" aria-hidden />
              Published
            </span>
          )}
        </div>
        <h4 className="truncate font-medium text-neutral-900">
          {dataSource.name}
        </h4>
      </div>
      {/* Stats */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500 mt-2">
        <span>{dataSource.columnDefs.length} columns</span>
        <span className="text-neutral-400">•</span>
        <span>{dataSource.recordCount || "Unknown"} records</span>
        <span className="text-neutral-400">•</span>
        <span>{geocodingStatus.status}</span>
      </div>
    </div>
  );
}
