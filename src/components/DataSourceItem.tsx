import { formatDistanceToNow } from "date-fns";
import { Database, RefreshCw } from "lucide-react";
import Image from "next/image";
import DataSourceIcon from "@/components/DataSourceIcon";
import { cn } from "@/shadcn/utils";
import type { DataSourceType } from "@/models/DataSource";
import type { RouterOutputs } from "@/services/trpc/react";

export type DataSourceWithImportInfo = NonNullable<
  RouterOutputs["dataSource"]["byOrganisation"]
>[0];

// Helper function to get data source type from config
export const getDataSourceType = (
  dataSource: DataSourceWithImportInfo,
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
const getGeocodingStatus = (dataSource: DataSourceWithImportInfo) => {
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
  density = "default",
  previewImageUrl,
}: {
  dataSource: DataSourceWithImportInfo;
  className?: string;
  density?: "default" | "compact" | "compactPreview";
  previewImageUrl?: string | null | undefined;
}) {
  const dataSourceType = getDataSourceType(dataSource);
  const geocodingStatus = getGeocodingStatus(dataSource);
  const lastImported = dataSource.importInfo?.lastCompleted;

  const lastImportedText = lastImported
    ? formatDistanceToNow(new Date(lastImported), { addSuffix: true })
    : null;

  if (density === "compact" || density === "compactPreview") {
    return (
      <div
        className={cn(
          "h-full w-full border rounded-lg cursor-pointer transition-all border-neutral-200 shadow-sm hover:bg-neutral-50 hover:border-neutral-300",
          "p-2",
          className,
        )}
      >
        <div
          className={cn(
            "grid gap-x-3 gap-y-1 items-start",
            density === "compactPreview"
              ? "grid-cols-[auto_minmax(0,1fr)_auto]"
              : "grid-cols-[minmax(0,1fr)_auto]",
          )}
        >
          {density === "compactPreview" && (
            <div className="row-span-2">
              <Image
                src={previewImageUrl || "/screenshot-placeholder.jpeg"}
                alt=""
                width={80}
                height={48}
                className="h-12 w-20 rounded-md border border-neutral-200 object-cover bg-neutral-50"
              />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1 text-neutral-600">
              <DataSourceIcon type={dataSourceType} />
              <p className="text-xs font-mono uppercase">{dataSourceType}</p>
            </div>
            <h4 className="mt-0.5 text-sm font-medium text-neutral-900 truncate leading-tight">
              {dataSource.name}
            </h4>
          </div>

          <div className="flex flex-col items-end gap-1 text-xs">
            {lastImportedText && (
              <span className="text-[11px] inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 rounded-md px-1.5 py-0.5 whitespace-nowrap">
                <RefreshCw className="w-3.5 h-3.5" />
                {lastImportedText}
              </span>
            )}
            <div className="text-neutral-600 whitespace-nowrap">
              <span className="text-neutral-700">
                {dataSource.recordCount?.toLocaleString() || "Unknown"} records
              </span>{" "}
              <span className="text-neutral-400">•</span>{" "}
              <span>{dataSource.columnDefs.length} cols</span>
            </div>
          </div>

          <div
            className={cn(
              "flex items-center gap-2 flex-wrap",
              density === "compactPreview" ? "col-span-3" : "col-span-2",
            )}
          >
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

  return (
    <div
      className={cn(
        "h-full flex flex-col items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all border-neutral-200 shadow-sm hover:bg-neutral-50 hover:border-neutral-300",
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
      <h4 className="text-lg font-medium text-neutral-900 truncate leading-tight max-w-full">
        {dataSource.name}
      </h4>

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
