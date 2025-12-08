import DataSourceIcon from "@/components/DataSourceIcon";
import { cn } from "@/shadcn/utils";
import type {
  DataSourceType,
} from "@/server/models/DataSource";
import type { RouterOutputs } from "@/services/trpc/react";

type DataSourceItemType = NonNullable<
  RouterOutputs["dataSource"]["byOrganisation"]
>[0];

// Helper function to get data source type from config
const getDataSourceType = (
  dataSource: DataSourceItemType
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
        className
      )}
    >
      <div className="flex gap-2 items-center">
        <DataSourceIcon type={dataSourceType} />
        <h4 className="font-medium truncate">{dataSource.name}</h4>

        {dataSource.public && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full ml-auto">
            Public
          </span>
        )}
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
