"use client";

import { Check, ChevronDownIcon, ChevronRightIcon, X } from "lucide-react";
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PublicMapColumnType } from "@/server/models/PublicMap";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { cn } from "@/shadcn/utils";
import { PublicFiltersContext } from "../context/PublicFiltersContext";
import { PublicMapContext } from "../context/PublicMapContext";
import { buildName, groupRecords, toBoolean } from "../utils";
import type { RecordGroup } from "../utils";
import type { SelectedRecord } from "@/app/map/[id]/context/InspectorContext";
import type { PublicMapColorScheme } from "@/app/map/[id]/styles";
import type { PublicMapDataSourceConfig } from "@/server/models/PublicMap";
import type { RouterOutputs } from "@/services/trpc/react";
import type { RefObject } from "react";
import type { MapRef } from "react-map-gl/mapbox";

interface DataRecordsListProps {
  dataRecordsQuery: {
    data: RouterOutputs["dataSource"]["byIdWithRecords"] | undefined;
    isPending: boolean;
  };
  colorScheme: PublicMapColorScheme;
}

export default function DataRecordsList({
  dataRecordsQuery,
  colorScheme,
}: DataRecordsListProps) {
  const isMobile = useIsMobile();
  const { publicMap } = useContext(PublicMapContext);
  const { setSelectedRecords, selectedRecord } = useContext(InspectorContext);
  const { mapRef } = useContext(MapContext);
  const { filteredRecords } = useContext(PublicFiltersContext);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (selectedRecord) {
      setExpandedId(selectedRecord.id);
      const item = listRef.current?.querySelector<HTMLLIElement>(
        `li[data-id~="${selectedRecord.id}"]`
      );
      item?.scrollIntoView({
        behavior: "smooth",
        block: window.innerWidth < 768 ? "start" : "center",
      });
    }
  }, [selectedRecord]);

  const dataSourceConfig = publicMap?.dataSourceConfigs.find(
    (dsc) => dsc.dataSourceId === dataRecordsQuery.data?.id
  );

  const recordGroups = useMemo(
    () => groupRecords(dataSourceConfig, filteredRecords),
    [dataSourceConfig, filteredRecords]
  );

  if (!recordGroups?.length) {
    return <></>;
  }

  return (
    <ul className="flex flex-col" ref={listRef}>
      {recordGroups.map((recordGroup) => {
        const isSelected = recordGroup.children.some(
          (c) => c.id === selectedRecord?.id
        );

        const isExpanded = recordGroup.children.some(
          (c) => c.id === expandedId
        );

        // Separate with spaces so the above selector for scrolling is more efficient
        const id = recordGroup.children.map((c) => c.id).join(" ");

        return (
          <RecordGroupItem
            key={id}
            colorScheme={colorScheme}
            dataSourceConfig={dataSourceConfig}
            id={id}
            isExpanded={isExpanded}
            isSelected={isSelected}
            isMobile={isMobile}
            mapRef={mapRef}
            recordGroup={recordGroup}
            setExpandedId={setExpandedId}
            setSelectedRecords={setSelectedRecords}
          />
        );
      })}
    </ul>
  );
}

// memo(...) ensures that the function is only re-run when the props change
const RecordGroupItem = memo(function RecordGroupItem({
  colorScheme,
  dataSourceConfig,
  id,
  isExpanded,
  isSelected,
  isMobile,
  mapRef,
  recordGroup,
  setExpandedId,
  setSelectedRecords,
}: {
  colorScheme: PublicMapColorScheme;
  dataSourceConfig: PublicMapDataSourceConfig | undefined;
  id: string;
  isExpanded: boolean;
  isSelected: boolean;
  isMobile: boolean;
  mapRef: RefObject<MapRef | null> | null;
  recordGroup: RecordGroup;
  setExpandedId: (id: string | null) => void;
  setSelectedRecords: (records: SelectedRecord[]) => void;
}) {
  const getDescription = (record: { json: Record<string, unknown> }) => {
    const descriptionColumn = dataSourceConfig?.descriptionColumn;
    return descriptionColumn && Boolean(record.json[descriptionColumn])
      ? `${record.json[descriptionColumn]}`
      : "";
  };

  // Show first non-empty description
  const descriptions = recordGroup.children.map((c) => getDescription(c));
  const description = descriptions.find(Boolean);

  const handleRecordClick = useCallback(
    (recordGroup: RecordGroup) => {
      if (!isSelected) {
        setSelectedRecords(
          recordGroup.children.map((c) => ({
            id: c.id,
            dataSourceId: c.dataSourceId,
          }))
        );
      }

      let nextExpandedId = null;
      const firstRecordId = recordGroup.children[0]?.id || null;
      if (isSelected) {
        nextExpandedId = isExpanded ? null : firstRecordId;
      } else {
        nextExpandedId = firstRecordId;
      }

      if (recordGroup.geocodePoint && nextExpandedId) {
        mapRef?.current?.flyTo({
          center: recordGroup.geocodePoint,
          zoom: 14,
        });
      }

      console.log("setting expanded id", nextExpandedId);
      setExpandedId(nextExpandedId);
    },
    [isExpanded, isSelected, mapRef, setExpandedId, setSelectedRecords]
  );

  return (
    <li
      className={cn(
        "rounded transition-all duration-200",
        isSelected ? "" : "hover:bg-accent"
      )}
      data-id={id}
      style={
        isSelected ? { backgroundColor: colorScheme.primaryMuted } : undefined
      }
    >
      {/* Main record item */}
      <button
        type="button"
        onClick={() => handleRecordClick(recordGroup)}
        className="py-3 px-4 flex flex-col gap-[2px] w-full / text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: colorScheme.primary }}
          />
          <span className="font-medium flex-1">{recordGroup.name}</span>
          {/* Only show arrow on mobile */}
          {isMobile && (
            <div className="text-xs text-neutral-500 md:hidden">
              {isSelected && isExpanded ? (
                <ChevronDownIcon size={16} />
              ) : (
                <ChevronRightIcon size={16} />
              )}
            </div>
          )}
        </div>
        {description && description !== recordGroup.name && (
          <span className="text-sm ml-[1.1rem]">{description}</span>
        )}
      </button>

      {/* Expanded content - only on mobile */}
      {isMobile && isSelected && isExpanded && (
        <div className="px-4 pb-4 border-b border-neutral-200 md:hidden">
          <MobileRecordDetails
            recordGroup={recordGroup}
            dataSourceConfig={dataSourceConfig}
          />
        </div>
      )}
    </li>
  );
});

// Mobile-optimized record details component for accordion
function MobileRecordDetails({
  recordGroup,
  dataSourceConfig,
}: {
  recordGroup: RecordGroup;
  dataSourceConfig?: PublicMapDataSourceConfig;
}) {
  const [groupIndex, setGroupIndex] = useState(0);
  const record = recordGroup.children[groupIndex];
  if (!record) {
    return null;
  }

  const name = buildName(dataSourceConfig, record);
  const description = String(
    record.json[dataSourceConfig?.descriptionColumn || ""] || ""
  );
  const additionalColumns = dataSourceConfig?.additionalColumns || [];

  return (
    <div className="flex flex-col gap-3 pt-3">
      {/* Name and Description */}
      <div className="flex">
        <div className="flex flex-col gap-2 mr-auto">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-neutral-600 font-medium">
              {dataSourceConfig?.nameLabel || "Name"}
            </span>
            <span className="text-base font-semibold">{name}</span>
          </div>

          {description && name !== description && (
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
        {recordGroup.children.length > 1 && (
          <div className="flex gap-1 ">
            <Button
              type="button"
              className="p-0"
              variant="outline"
              size="icon"
              onClick={() => {
                setGroupIndex(groupIndex - 1);
              }}
              disabled={groupIndex <= 0}
            >
              &lt;
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setGroupIndex(groupIndex + 1);
              }}
              disabled={groupIndex >= recordGroup.children.length - 1}
            >
              &gt;
            </Button>
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
                      .join(", ") || "-"}
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
  return (
    <div className="flex flex-col gap-1">
      {sourceColumns.map((column) => (
        <div key={column} className="flex items-center gap-2">
          {String(json[column]).toLowerCase() === "unknown" ? (
            <div className="w-3 h-5 text-center font-semibold">?</div>
          ) : toBoolean(json[column]) ? (
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
      .filter(Boolean)
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
