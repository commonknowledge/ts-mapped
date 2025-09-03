"use client";

import { QueryResult } from "@apollo/client";
import { Check, ChevronDownIcon, ChevronRightIcon, X } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import {
  PublicMapDataRecordsQuery,
  PublicMapDataRecordsQueryVariables,
  PublicMapDataSourceConfig,
} from "@/__generated__/types";
import { PublicMapColumnType } from "@/__generated__/types";
import { DataRecordContext } from "@/components/Map/context/DataRecordContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { Separator } from "@/shadcn/ui/separator";
import { cn } from "@/shadcn/utils";
import { Point } from "@/types";
import { PublicFiltersContext } from "../context/PublicFiltersContext";
import Filters from "./Filters";
import { buildName } from "./utils";

interface DataRecordsListProps {
  dataRecordsQuery: QueryResult<
    PublicMapDataRecordsQuery,
    PublicMapDataRecordsQueryVariables
  >;
  onSelect: (r: { id: string; dataSourceId: string }) => void;
  colourScheme: { primary: string; muted: string };
}

export default function DataRecordsList({
  dataRecordsQuery,
  onSelect,
  colourScheme,
}: DataRecordsListProps) {
  const { publicMap, setRecordSidebarVisible } = useContext(PublicMapContext);
  const { mapRef } = useContext(MapContext);
  const { selectedDataRecord } = useContext(DataRecordContext);
  const { publicFilters } = useContext(PublicFiltersContext);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [records, setRecords] = useState<
    NonNullable<PublicMapDataRecordsQuery["dataSource"]>["records"]
  >([]);

  useEffect(() => {
    const allRecords = dataRecordsQuery?.data?.dataSource?.records || [];

    if (!publicFilters?.length) {
      setRecords(allRecords);
      return;
    }

    const activeFilters = publicFilters.filter(
      (f) => f?.value || f?.selectedOptions?.length,
    );

    if (!activeFilters?.length || !allRecords?.length) {
      return;
    }

    const filteredRecords = allRecords.filter((record) => {
      return activeFilters.every((filter) => {
        if (
          filter.type === PublicMapColumnType.Boolean &&
          filter.value === "Yes"
        ) {
          return record.json[filter.name] === "Yes";
        }

        if (filter.type === PublicMapColumnType.String && filter.value) {
          const fieldValue = String(record.json[filter.name] || "");
          return fieldValue.toLowerCase().includes(filter.value.toLowerCase());
        }

        if (
          filter.type === PublicMapColumnType.CommaSeparatedList &&
          filter?.selectedOptions?.length
        ) {
          const recordArr = record.json[filter.name]
            ? record.json[filter.name].split(", ")
            : [];

          return recordArr.some((val: string) =>
            filter?.selectedOptions?.includes(val),
          );
        }

        return true;
      });
    });

    setRecords(filteredRecords);
  }, [publicFilters, setRecords, dataRecordsQuery?.data?.dataSource?.records]);

  const dataSourceConfig = publicMap?.dataSourceConfigs.find(
    (dsc) => dsc.dataSourceId === dataRecordsQuery.data?.dataSource?.id,
  );

  const getName = (record: {
    externalId: string;
    json: Record<string, unknown>;
  }) => {
    const nameColumns = dataSourceConfig?.nameColumns;
    if (!nameColumns?.length) {
      return record.externalId;
    }
    const name = buildName(nameColumns, record.json);
    return name || record.externalId;
  };

  const getDescription = (record: { json: Record<string, unknown> }) => {
    const descriptionColumn = dataSourceConfig?.descriptionColumn;
    return descriptionColumn ? String(record.json[descriptionColumn]) : null;
  };

  const handleRecordClick = (record: {
    id: string;
    geocodePoint?: Point | null;
  }) => {
    if (dataRecordsQuery.data?.dataSource?.id) {
      onSelect({
        id: record.id,
        dataSourceId: dataRecordsQuery.data?.dataSource?.id,
      });

      // On mobile: toggle accordion expansion
      // On desktop: open sidebar
      if (window.innerWidth < 768) {
        setExpandedRecordId(expandedRecordId === record.id ? null : record.id);
      } else {
        setRecordSidebarVisible(true);
      }
    }

    if (record.geocodePoint) {
      mapRef?.current?.flyTo({
        center: record.geocodePoint,
        zoom: 14,
      });
    }
  };

  if (!records?.length) {
    return <span className="text-sm">No records found</span>;
  }

  return (
    <>
      <div className="flex justify-between items-center gap-4 px-4 my-2">
        <span className="text-sm">{records?.length || 0} Listings</span>
        <Filters />
      </div>
      <ul className="flex flex-col">
        {records.map((r) => {
          const isExpanded = expandedRecordId === r.id;
          const isSelected = selectedDataRecord?.id === r.id;

          return (
            <li
              key={r.id}
              className={cn(
                "cursor-pointer rounded transition-all duration-200",
                isSelected ? "" : "hover:bg-accent",
              )}
              style={
                isSelected ? { backgroundColor: colourScheme.muted } : undefined
              }
            >
              {/* Main record item */}
              <div
                role="button"
                onClick={() => handleRecordClick(r)}
                className="py-3 px-4 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: colourScheme.primary }}
                  />
                  <span className="font-medium flex-1">{getName(r)}</span>
                  {/* Only show arrow on mobile */}
                  <div className="text-xs text-neutral-500 md:hidden">
                    {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                  </div>
                </div>
                {getDescription(r) && (
                  <span className="text-sm ml-[1.1rem]">
                    {getDescription(r)}
                  </span>
                )}
              </div>

              {/* Expanded content - only on mobile */}
              {isExpanded && (
                <div className="px-4 pb-4 border-b border-neutral-200 md:hidden">
                  <MobileRecordDetails
                    record={r}
                    dataSourceConfig={dataSourceConfig}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

// Mobile-optimized record details component for accordion
function MobileRecordDetails({
  record,
  dataSourceConfig,
}: {
  record: { json: Record<string, unknown> };
  dataSourceConfig?: PublicMapDataSourceConfig;
}) {
  const name = buildName(dataSourceConfig?.nameColumns || [], record.json);
  const description = String(
    record.json[dataSourceConfig?.descriptionColumn || ""] || "",
  );
  const additionalColumns = dataSourceConfig?.additionalColumns || [];

  return (
    <div className="flex flex-col gap-3 pt-3">
      {/* Name and Description */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-600 font-medium">
            {dataSourceConfig?.nameLabel || "Name"}
          </span>
          <span className="text-base font-semibold">{name}</span>
        </div>

        {description && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-neutral-600 font-medium">
              {dataSourceConfig?.descriptionLabel ||
                dataSourceConfig?.descriptionColumn ||
                "Description"}
            </span>
            <span className="text-sm">{description}</span>
          </div>
        )}
      </div>

      {/* Additional Columns */}
      {additionalColumns.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            {additionalColumns.map((columnConfig, i: number) => (
              <div key={i} className="flex flex-col gap-1">
                {columnConfig.type !== PublicMapColumnType.Boolean && (
                  <span className="text-xs text-neutral-600 font-medium">
                    {columnConfig.label}
                  </span>
                )}
                {columnConfig.type === PublicMapColumnType.Boolean ? (
                  <MobileCheckList
                    sourceColumns={columnConfig.sourceColumns}
                    json={record.json}
                  />
                ) : columnConfig.type ===
                  PublicMapColumnType.CommaSeparatedList ? (
                  <MobileCommaSeparatedList
                    sourceColumns={columnConfig.sourceColumns}
                    json={record.json}
                  />
                ) : (
                  <span className="text-sm">
                    {columnConfig.sourceColumns
                      .map((c: string) => record.json[c])
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MobileCheckList({
  sourceColumns,
  json,
}: {
  sourceColumns: string[];
  json: Record<string, unknown>;
}) {
  const toBoolean = (val: unknown): boolean => {
    if (!val) return false;
    if (["false", "0", "no"].includes(String(val).toLowerCase())) return false;
    return Boolean(val);
  };

  return (
    <div className="flex flex-col gap-1">
      {sourceColumns.map((column) => (
        <div key={column} className="flex items-center gap-2">
          {toBoolean(json[column]) ? (
            <Check className="w-3 h-3 text-green-600" />
          ) : (
            <X className="w-3 h-3 text-red-600" />
          )}
          <span className="text-xs">{column}</span>
        </div>
      ))}
    </div>
  );
}

function MobileCommaSeparatedList({
  sourceColumns,
  json,
}: {
  sourceColumns: string[];
  json: Record<string, unknown>;
}) {
  const values = sourceColumns.flatMap((c) =>
    String(json[c] || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  return (
    <div className="flex flex-wrap gap-1">
      {values.map((v) => (
        <span
          className="inline-block rounded-full bg-neutral-100 px-2 py-1 text-xs"
          key={v}
        >
          {v}
        </span>
      ))}
    </div>
  );
}
