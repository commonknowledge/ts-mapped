"use client";

import { useMemo } from "react";
import { cn } from "@/shadcn/utils";
import { useInspectorDataSourceConfig } from "../../hooks/useInspectorDataSourceConfig";
import { useMapViews } from "../../hooks/useMapViews";
import ConfiguredDataRecordDisplay from "./ConfiguredDataRecordDisplay";
import DataRecordColumns from "./DataRecordColumns";
import type { InspectorItem } from "@/models/shared";

const hasValue = (value: unknown) =>
  value !== undefined && value !== null && String(value).trim() !== "";

// A record led by the columns pinned in the section editor, as tiles (the
// one coloured on the map now is outlined), then the section's other columns
export default function RecordKeyFigures({
  json,
  dataSourceId,
}: {
  json: Record<string, unknown>;
  dataSourceId: string;
}) {
  const { viewConfig } = useMapViews();
  const inspectorConfig = useInspectorDataSourceConfig(dataSourceId);

  const activeColumn =
    viewConfig.areaDataSourceId === dataSourceId
      ? viewConfig.areaDataColumn
      : undefined;

  const pinnedColumns = useMemo(
    () =>
      (inspectorConfig?.items ?? [])
        .filter(
          (item): item is Extract<InspectorItem, { type: "column" }> =>
            item.type === "column" && Boolean(item.pinned),
        )
        .map((item) => item.name),
    [inspectorConfig?.items],
  );
  const keyColumns = pinnedColumns.filter((column) => hasValue(json[column]));

  return (
    <div className="flex flex-col gap-4">
      {keyColumns.length > 0 && (
        <dl
          className="grid grid-cols-2 gap-2 [&_dd]:text-base"
          title="Pinned in the section editor"
        >
          {keyColumns.map((column) => (
            <div
              key={column}
              className={cn(
                "min-w-0 rounded-lg px-2.5 py-2",
                column === activeColumn
                  ? "bg-white shadow-[inset_0_0_0_1.5px_#15213b]"
                  : "bg-neutral-50 shadow-[inset_0_0_0_1px_#ececec]",
              )}
            >
              <DataRecordColumns
                columns={[column]}
                json={json}
                dataSourceId={dataSourceId}
              />
            </div>
          ))}
        </dl>
      )}
      <ConfiguredDataRecordDisplay
        json={json}
        dataSourceId={dataSourceId}
        excludeColumns={pinnedColumns}
      />
    </div>
  );
}
