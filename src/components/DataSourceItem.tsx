import { formatDistanceToNow } from "date-fns";
import { Database, RefreshCw } from "lucide-react";
import DataSourceIcon from "@/components/DataSourceIcon";
import { cn } from "@/shadcn/utils";
import type { DataSourceType } from "@/server/models/DataSource";
import type { RouterOutputs } from "@/services/trpc/react";

type DataSourceItemType = NonNullable<
  RouterOutputs["dataSource"]["byOrganisation"]
>[0];

// Helper function to get data source type from config
export const getDataSourceType = (
  dataSource: DataSourceItemType,
): DataSourceType | "unknown" => {
  try {
    const config = dataSource.config;
    return config?.type || "unknown";
  } catch {
    return "unknown";
  }
};
/* 
// Helper function to get appropriate color and label for data source type
const getDataSourceStyle = (type: DataSourceType | "unknown") => {
  switch (type) {
    case DataSourceType.ActionNetwork:
      return {
        bgColor: "from-green-400 to-blue-500",
        label: "Action Network",
        description: "Activist and supporter data",
      };
    case DataSourceType.Airtable:
      return {
        bgColor: "from-orange-400 to-red-500",
        label: "Airtable",
        description: "Database and spreadsheet data",
      };
    case DataSourceType.CSV:
      return {
        bgColor: "from-neutral-400 to-neutral-600",
        label: "CSV",
        description: "Comma-separated values data",
      };
    case DataSourceType.GoogleSheets:
      return {
        bgColor: "from-green-500 to-green-700",
        label: "Google Sheets",
        description: "Spreadsheet data from Google",
      };
    case DataSourceType.Mailchimp:
      return {
        bgColor: "from-yellow-400 to-orange-500",
        label: "Mailchimp",
        description: "Email marketing and subscriber data",
      };
    default:
      return {
        bgColor: "from-blue-400 to-purple-500",
        label: "Data Source",
        description: "General data source",
      };
  }
}; */

// Helper function to get geocoding status
const getGeocodingStatus = (dataSource: DataSourceItemType) => {
  const geocodingConfig = dataSource.geocodingConfig;
  if (geocodingConfig.type === "None") {
    return { status: "No geocoding", color: "text-neutral-400" };
  }
  if (geocodingConfig.type === "Address") {
    return { status: "Address geocoding", color: "text-neutral-400" };
  }
  if (geocodingConfig.type === "Code" || geocodingConfig.type === "Name") {
    return { status: "Area-based geocoding", color: "text-neutral-400" };
  }
  return { status: "Geocoding configured", color: "text-neutral-400" };
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
  const lastImported = dataSource.importInfo?.lastCompleted;

  const lastImportedText = lastImported
    ? formatDistanceToNow(new Date(lastImported), { addSuffix: true })
    : null;

  return (
    <div
      className={cn(
        "h-full flex flex-col gap-3 p-4 border rounded-lg cursor-pointer transition-all border-neutral-200 shadow-sm hover:bg-neutral-50 hover:border-neutral-300",
        className,
      )}
    >
      {/* Header: Icon and Name */}
      <div className="flex justify-between gap-2 text-neutral-600">
        <div className="flex items-center gap-1">
          <DataSourceIcon type={dataSourceType} />
          <p className="text-sm font-mono uppercase">{dataSourceType}</p>
        </div>
        {lastImportedText && (
          <span className="text-xs inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-md">
            <RefreshCw className="w-3.5 h-3.5" />
            {lastImportedText}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className=" text-xl font-medium text-neutral-900 truncate leading-tight">
          {dataSource.name}
        </h4>
      </div>

      {/* Metadata: Consolidated stats and status */}
      <div className="flex flex-col gap-2 text-xs">
        {/* Primary stats: Records, columns, and last updated */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-neutral-700">
            {dataSource.recordCount?.toLocaleString() || "Unknown"} records
          </span>
          <span className="text-neutral-400">•</span>
          <span className="text-neutral-600">
            {dataSource.columnDefs.length} columns
          </span>
        </div>

        {/* Secondary info: Geocoding (muted) and status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-xs", geocodingStatus.color)}>
            {geocodingStatus.status}
          </span>

          {dataSource.public && (
            <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
              Public
            </span>
          )}

          {dataSource.autoImport && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
              <Database className="w-3 h-3" />
              Auto-import
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
