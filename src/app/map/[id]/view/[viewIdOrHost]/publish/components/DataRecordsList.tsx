"use client";

import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import { cn } from "@/shadcn/utils";
import { PublicFiltersContext } from "../context/PublicFiltersContext";
import { PublicMapContext } from "../context/PublicMapContext";
import { buildPublicMapName, groupRecords } from "../utils";
import type { RecordGroup } from "../utils";
import type { SelectedRecord } from "@/app/map/[id]/types/inspector";
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
  const { publicMap } = useContext(PublicMapContext);
  const { setSelectedRecords, focusedRecord } = useInspector();
  const { mapRef } = useContext(MapContext);
  const { filteredRecords } = useContext(PublicFiltersContext);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (focusedRecord) {
      const item = listRef.current?.querySelector<HTMLLIElement>(
        `li[data-id~="${focusedRecord.id}"]`,
      );
      item?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [focusedRecord]);

  const dataSourceConfig = publicMap?.dataSourceConfigs.find(
    (dsc) => dsc.dataSourceId === dataRecordsQuery.data?.id,
  );

  const recordGroups = useMemo(
    () => groupRecords(dataSourceConfig, filteredRecords),
    [dataSourceConfig, filteredRecords],
  );

  if (!recordGroups?.length) {
    return <></>;
  }

  return (
    <ul className="flex flex-col" ref={listRef}>
      {recordGroups.map((recordGroup) => {
        const isSelected = recordGroup.children.some(
          (c) => c.id === focusedRecord?.id,
        );

        // Separate with spaces so the above selector for scrolling is more efficient
        const id = recordGroup.children.map((c) => c.id).join(" ");

        return (
          <RecordGroupItem
            key={id}
            colorScheme={colorScheme}
            dataSourceConfig={dataSourceConfig}
            id={id}
            isSelected={isSelected}
            mapRef={mapRef}
            recordGroup={recordGroup}
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
  isSelected,
  mapRef,
  recordGroup,
  setSelectedRecords,
}: {
  colorScheme: PublicMapColorScheme;
  dataSourceConfig: PublicMapDataSourceConfig | undefined;
  id: string;
  isSelected: boolean;
  mapRef: RefObject<MapRef | null> | null;
  recordGroup: RecordGroup;
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
            name: buildPublicMapName(dataSourceConfig, c),
            geocodePoint: c.geocodePoint,
          })),
        );
      }

      if (recordGroup.geocodePoint) {
        mapRef?.current?.flyTo({
          center: recordGroup.geocodePoint,
          zoom: 14,
        });
      }
    },
    [dataSourceConfig, isSelected, mapRef, setSelectedRecords],
  );

  return (
    <li
      className={cn(
        "rounded transition-all duration-200",
        isSelected ? "" : "hover:bg-accent",
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
        </div>
        {description && description !== recordGroup.name && (
          <span className="text-sm ml-[1.1rem]">{description}</span>
        )}
      </button>
    </li>
  );
});
