import { formatDistanceToNow } from "date-fns";
import { Database, RefreshCw } from "lucide-react";
import DataSourceIcon from "@/components/DataSourceIcon";
import {
  type DataSourceRecordType,
  DataSourceType,
} from "@/server/models/DataSource";
import { cn } from "@/shadcn/utils";
import {
  dataSourceRecordTypeColors,
  dataSourceRecordTypeIcons,
} from "./DataSourceRecordTypeIcon";
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
  const recordType = dataSource.recordType as DataSourceRecordType;
  const style = getDataSourceStyle(dataSourceType);
  const geocodingStatus = getGeocodingStatus(dataSource);
  const lastImported = dataSource.importInfo?.lastCompleted;

  const lastImportedText = lastImported
    ? formatDistanceToNow(new Date(lastImported), { addSuffix: true })
    : null;

  const backgroundColor =
    dataSourceRecordTypeColors[recordType] || "var(--brandGray)";
  const icon = dataSourceRecordTypeIcons[recordType] || (
    <Database className="w-4 h-4" />
  );

  return (
    <div
      className={cn(
        "p-2 border rounded-lg cursor-pointer transition-all border-neutral-200 shadow-sm hover:bg-neutral-100",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-11 h-11 rounded flex items-center justify-center text-white"
          style={{ backgroundColor }}
        >
          <span className="text-white [&>svg]:w-6 [&>svg]:h-6 ">{icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className="font-medium truncate">{dataSource.name}</h4>
              <div className="flex items-center gap-1 text-xs text-neutral-600">
                <DataSourceIcon type={dataSourceType} />
                {style.label}
              </div>
            </div>

            <div className="flex gap-2">
              {dataSource.public && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Public
                </span>
              )}
              {lastImportedText && (
                <span className="flex items-center gap-1 px-2 py-1 bg-neutral-100 text-neutral-500 text-xs rounded-sm">
                  <RefreshCw className="w-3 h-3" />
                  {lastImportedText}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Stats */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500 mt-3">
        <span>{dataSource.columnDefs.length} columns</span>
        <span className="text-neutral-400">•</span>
        <span>{dataSource.recordCount || "Unknown"} records</span>
        <span className="text-neutral-400">•</span>
        <span>{geocodingStatus.status}</span>
      </div>

      {/* Type-specific info */}
      {dataSourceType === DataSourceType.ActionNetwork && (
        <span className="text-xs text-neutral-500">
          Activist engagement data
        </span>
      )}
      {dataSourceType === DataSourceType.Mailchimp && (
        <span className="text-xs text-neutral-500">Email subscriber data</span>
      )}
      {dataSource.autoImport && (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
          <Database className="w-3 h-3" />
          Auto-import enabled
        </span>
      )}
    </div>
  );
}
