"use client";

import { formatDistanceToNow } from "date-fns";
import { Database, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { InspectorPanelIcon } from "@/app/(private)/map/[id]/components/InspectorPanel/inspectorPanelOptions";
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

export interface DataSourceItemProps {
  dataSource: DataSourceWithImportInfo;
  className?: string;
  density?: "default" | "compact" | "compactPreview";
  previewImageUrl?: string | null | undefined;
  showColumnPreview?: boolean;
  defaultColumnName?: string | null | undefined;
  maxColumnPills?: number;
  columnPreviewVariant?: "pills" | "text";
  singleLineColumnPreview?: boolean;
  overrideTitle?: string | null | undefined;
  overrideIconName?: string | null | undefined;
  overrideDescription?: string | null | undefined;
  hideTypeLabel?: boolean;
}

export function DataSourceItem({
  dataSource,
  className,
  density = "default",
  previewImageUrl,
  showColumnPreview,
  defaultColumnName,
  maxColumnPills = 8,
  columnPreviewVariant = "pills",
  singleLineColumnPreview,
  overrideTitle,
  overrideIconName,
  overrideDescription,
  hideTypeLabel,
}: DataSourceItemProps) {
  const dataSourceType = getDataSourceType(dataSource);
  const lastImported = dataSource.importInfo?.lastCompleted;
  const [previewState, setPreviewState] = useState<"jpg" | "png" | "none">(
    "jpg",
  );

  const resolvedPreviewUrl = useMemo(() => {
    if (!previewImageUrl) return null;
    if (previewState === "none") return null;

    // If the caller is not using our `/data-source-previews/...` scheme, don't mutate it.
    if (!previewImageUrl.includes("/data-source-previews/"))
      return previewImageUrl;

    const match = previewImageUrl.match(/^(.*)\.(jpg|png)(\?.*)?$/);
    if (!match) return previewImageUrl;
    const [, base, , query = ""] = match;
    return `${base}.${previewState}${query}`;
  }, [previewImageUrl, previewState]);

  const lastImportedText = lastImported
    ? formatDistanceToNow(new Date(lastImported), { addSuffix: true })
    : null;

  const displayTitle = overrideTitle?.trim()
    ? overrideTitle.trim()
    : dataSource.name;
  const iconName = overrideIconName?.trim() ? overrideIconName.trim() : "";
  const fallbackDescription = (
    dataSource as unknown as { movementLibraryDescription?: string | null }
  ).movementLibraryDescription;
  const displayDescription = overrideDescription?.trim()
    ? overrideDescription.trim()
    : fallbackDescription?.trim()
      ? fallbackDescription.trim()
      : null;

  const columnNames = useMemo(() => {
    const cols = dataSource.columnDefs.map((c) => c.name);
    const defaultCol =
      defaultColumnName && cols.includes(defaultColumnName)
        ? defaultColumnName
        : null;
    if (!defaultCol) return cols;
    return [defaultCol, ...cols.filter((c) => c !== defaultCol)];
  }, [dataSource.columnDefs, defaultColumnName]);

  const columnPills = useMemo(() => {
    if (!showColumnPreview) return [];
    return columnNames.slice(0, maxColumnPills);
  }, [columnNames, maxColumnPills, showColumnPreview]);

  const { visibleColumnPills, columnPillsExcess } = useMemo(() => {
    if (!showColumnPreview || columnPreviewVariant !== "pills") {
      return { visibleColumnPills: [] as string[], columnPillsExcess: 0 };
    }
    const total = columnNames.length;
    if (total <= maxColumnPills) {
      return { visibleColumnPills: columnNames, columnPillsExcess: 0 };
    }
    // Reserve the final "slot" for the +N pill
    const visibleCount = Math.max(0, maxColumnPills - 1);
    return {
      visibleColumnPills: columnNames.slice(0, visibleCount),
      columnPillsExcess: total - visibleCount,
    };
  }, [columnNames, columnPreviewVariant, maxColumnPills, showColumnPreview]);

  const columnPreviewText = useMemo(() => {
    if (!showColumnPreview) return "";
    const names = columnNames.slice(0, maxColumnPills);
    const more =
      dataSource.columnDefs.length > maxColumnPills
        ? ` +${dataSource.columnDefs.length - maxColumnPills} more`
        : "";
    return `${names.join(" · ")}${more}`;
  }, [
    columnNames,
    dataSource.columnDefs.length,
    maxColumnPills,
    showColumnPreview,
  ]);

  if (density === "compactPreview") {
    return (
      <div
        className={cn(
          "h-full w-full border rounded-lg cursor-pointer transition-all border-neutral-200 shadow-sm hover:bg-neutral-50 hover:border-neutral-300",
          "p-2 flex flex-col",
          className,
        )}
      >
        <div className="relative w-full aspect-video shrink-0">
          <Image
            src={resolvedPreviewUrl || "/screenshot-placeholder.jpeg"}
            alt=""
            fill
            sizes="(max-width: 768px) 90vw, 640px"
            className="rounded-md border border-neutral-200 object-cover bg-neutral-50"
            onError={() => {
              setPreviewState((prev) => (prev === "jpg" ? "png" : "none"));
            }}
          />
        </div>

        <div className="min-w-0 flex-1 pt-2 flex flex-col">
          <div
            className={cn(
              "grid gap-x-3 gap-y-1 items-start",
              "grid-cols-[minmax(0,1fr)_auto]",
            )}
          >
            <div className="min-w-0">
              <h4 className=" font-medium text-neutral-900 truncate leading-tight flex items-center gap-1.5">
                {iconName ? (
                  <InspectorPanelIcon
                    iconName={iconName}
                    className="h-4 w-4 shrink-0 text-neutral-600"
                  />
                ) : (
                  <span className="shrink-0 text-neutral-600">
                    <DataSourceIcon type={dataSourceType} />
                  </span>
                )}
                <span className="truncate">{displayTitle}</span>
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
                  {dataSource.recordCount?.toLocaleString() || "Unknown"}{" "}
                  records
                </span>{" "}
                <span className="text-neutral-400">•</span>{" "}
                <span>{dataSource.columnDefs.length} cols</span>
              </div>
            </div>
          </div>

          {displayDescription && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 mb-3">
              {displayDescription}
            </p>
          )}

          {columnPills.length > 0 && columnPreviewVariant === "pills" && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {columnPills.map((name) => {
                const isDefault = name === defaultColumnName;
                return (
                  <span
                    key={name}
                    className={cn(
                      "px-2 py-0.5 rounded-full border text-xs font-medium",
                      isDefault
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-neutral-100 border-neutral-200 text-neutral-700",
                    )}
                    title={isDefault ? `${name} (default)` : name}
                  >
                    {name.length > 18 ? `${name.slice(0, 18)}…` : name}
                  </span>
                );
              })}
              {showColumnPreview &&
                dataSource.columnDefs.length > maxColumnPills && (
                  <span className="px-2 py-0.5 rounded-full bg-neutral-50 border border-neutral-200 text-xs text-muted-foreground">
                    +{dataSource.columnDefs.length - maxColumnPills} more
                  </span>
                )}
            </div>
          )}
          {columnPreviewVariant === "text" && columnPreviewText && (
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {columnPreviewText}
            </p>
          )}

          {dataSource.autoImport && (
            <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                <Database className="w-3 h-3" />
                Auto-import
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (density === "compact") {
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
            "grid-cols-[minmax(0,1fr)_auto]",
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-neutral-600">
              {iconName ? (
                <InspectorPanelIcon
                  iconName={iconName}
                  className="h-4 w-4 shrink-0"
                />
              ) : (
                <DataSourceIcon type={dataSourceType} />
              )}
              {!hideTypeLabel && (
                <p className="text-xs font-mono uppercase">{dataSourceType}</p>
              )}
            </div>
            <h4 className="mt-0.5 text-sm font-medium text-neutral-900 truncate leading-tight">
              {displayTitle}
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
            className={cn("flex items-center gap-2 flex-wrap", "col-span-2")}
          >
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

          {showColumnPreview && columnPreviewVariant === "text" ? (
            columnPreviewText ? (
              <p
                className={cn(
                  "col-span-2 pt-1 text-xs text-muted-foreground",
                  singleLineColumnPreview ? "truncate" : "",
                )}
              >
                {columnPreviewText}
              </p>
            ) : null
          ) : visibleColumnPills.length > 0 ? (
            <div
              className={cn(
                "col-span-2 flex gap-1.5 pt-1",
                singleLineColumnPreview
                  ? "flex-nowrap overflow-hidden"
                  : "flex-wrap",
              )}
            >
              {visibleColumnPills.map((name) => {
                const isDefault = name === defaultColumnName;
                return (
                  <span
                    key={name}
                    className={cn(
                      "px-2 py-0.5 rounded-full border text-xs font-medium",
                      "shrink-0",
                      isDefault
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-neutral-100 border-neutral-200 text-neutral-700",
                    )}
                    title={isDefault ? `${name} (default)` : name}
                  >
                    {name.length > 18 ? `${name.slice(0, 18)}…` : name}
                  </span>
                );
              })}
              {columnPillsExcess > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-neutral-50 border border-neutral-200 text-xs text-muted-foreground shrink-0">
                  +{columnPillsExcess}
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const geocodingConfig = (
    dataSource as unknown as { geocodingConfig?: { type?: string } }
  ).geocodingConfig;
  const geocodingStatus =
    geocodingConfig?.type && geocodingConfig.type !== "None"
      ? { status: geocodingConfig.type, color: "text-neutral-500" }
      : { status: "No geocoding", color: "text-neutral-400" };

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
