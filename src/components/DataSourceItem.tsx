"use client";

import { formatDistanceToNow } from "date-fns";
import { BookOpen, Database, RefreshCw } from "lucide-react";
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

function LastImportedOrDateAddedMeta({
  lastImportedText,
  createdAt,
  compact,
}: {
  lastImportedText: string | null;
  createdAt: string | Date | undefined;
  compact?: boolean;
}) {
  if (lastImportedText) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground",
          compact ? "text-[11px]" : "text-xs",
        )}
      >
        <RefreshCw className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        {lastImportedText}
      </span>
    );
  }
  if (createdAt) {
    const addedRelative = formatDistanceToNow(new Date(createdAt), {
      addSuffix: true,
    });
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground",
          compact ? "text-[11px]" : "text-xs",
        )}
      >
        Added {addedRelative}
      </span>
    );
  }
  return null;
}

export interface DataSourceItemProps {
  dataSource: DataSourceWithImportInfo;
  className?: string;
  density?: "default" | "compact" | "compactPreview";
  showColumnPreview?: boolean;
  maxColumnPills?: number;
  columnPreviewVariant?: "pills" | "text";
  singleLineColumnPreview?: boolean;
  hideTypeLabel?: boolean;
  /** Hide when every item in context is published (e.g. Movement Data Library). */
  hidePublishedBadge?: boolean;
}

export function DataSourceItem({
  dataSource,
  className,
  density = "default",
  showColumnPreview,
  maxColumnPills = 8,
  columnPreviewVariant = "pills",
  singleLineColumnPreview,
  hideTypeLabel,
  hidePublishedBadge = false,
}: DataSourceItemProps) {
  const dataSourceType = getDataSourceType(dataSource);
  const lastImported = dataSource.importInfo?.lastCompleted;
  const [imageError, setImageError] = useState(false);

  const resolvedPreviewUrl = !imageError
    ? (dataSource.defaultInspectorConfig?.screenshotUrl ?? null)
    : null;

  const lastImportedText = lastImported
    ? formatDistanceToNow(new Date(lastImported), { addSuffix: true })
    : null;

  const defaultColumnName = dataSource.defaultChoroplethConfig?.column ?? null;
  const displayTitle =
    dataSource.defaultInspectorConfig?.name?.trim() || dataSource.name;
  const iconName = dataSource.defaultInspectorConfig?.icon?.trim() ?? "";
  const displayDescription =
    dataSource.defaultInspectorConfig?.description?.trim() || null;

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
            onError={() => setImageError(true)}
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
              <h4 className="flex min-w-0 items-center gap-1.5 font-medium leading-tight text-neutral-900">
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
                {!hideTypeLabel && (
                  <p className="shrink-0 text-xs font-mono uppercase text-neutral-600">
                    {dataSourceType}
                  </p>
                )}
                <span className="min-w-0 truncate">{displayTitle}</span>
              </h4>
            </div>

            <div className="flex flex-col items-end gap-1 text-xs">
              {dataSource.public && !hidePublishedBadge && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded border border-green-200 bg-green-50 px-1.5 py-0.5 font-medium text-green-700">
                  <BookOpen className="h-3 w-3 shrink-0" aria-hidden />
                  Published
                </span>
              )}
              <div className="whitespace-nowrap text-neutral-600">
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
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {displayDescription}
            </p>
          )}

          {(lastImportedText || dataSource.createdAt) && (
            <div className="mt-1">
              <LastImportedOrDateAddedMeta
                lastImportedText={lastImportedText}
                createdAt={dataSource.createdAt}
                compact
              />
            </div>
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
          <div className="col-span-2 flex items-center justify-between gap-2 text-neutral-600">
            <div className="flex min-w-0 flex-wrap items-center gap-1">
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
            {dataSource.public && !hidePublishedBadge && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded border border-green-200 bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700">
                <BookOpen className="h-3 w-3 shrink-0" aria-hidden />
                Published
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-medium text-neutral-900 truncate leading-tight text-left w-full">
              {displayTitle}
            </h4>
          </div>

          <div className="flex flex-col items-end gap-1 text-xs">
            <LastImportedOrDateAddedMeta
              lastImportedText={lastImportedText}
              createdAt={dataSource.createdAt}
              compact
            />
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

  return (
    <div
      className={cn(
        "h-full flex flex-col items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all border-neutral-200 shadow-sm hover:bg-neutral-50 hover:border-neutral-300",
        className,
      )}
    >
      {/* Header: Icon and Name */}
      <div className="w-full flex justify-between items-start gap-2 text-neutral-600">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <DataSourceIcon type={dataSourceType} />
          <p className="text-sm font-mono uppercase">{dataSourceType}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {dataSource.public && !hidePublishedBadge && (
            <span className="inline-flex items-center gap-1 rounded border border-green-200 bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700">
              <BookOpen className="h-3 w-3 shrink-0" aria-hidden />
              Published
            </span>
          )}
        </div>
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

        {/* Secondary info: last import and status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <LastImportedOrDateAddedMeta
            lastImportedText={lastImportedText}
            createdAt={dataSource.createdAt}
          />

          {dataSource.autoImport && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
              <Database className="w-3 h-3" />
              Auto-import
            </span>
          )}
        </div>
      </div>

      {showColumnPreview && columnPreviewVariant === "text" ? (
        columnPreviewText ? (
          <p
            className={cn(
              "w-full pt-3 mt-1 border-t border-neutral-100 text-xs text-muted-foreground",
              singleLineColumnPreview ? "truncate" : "",
            )}
          >
            {columnPreviewText}
          </p>
        ) : null
      ) : showColumnPreview && visibleColumnPills.length > 0 ? (
        <div className="w-full pt-3 mt-1 border-t border-neutral-100 flex flex-wrap gap-1.5">
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
  );
}
