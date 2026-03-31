import React, { useMemo } from "react";
import { cn } from "@/shadcn/utils";
import { useInspectorDataSourceConfig } from "../../hooks/useInspectorDataSourceConfig";
import DataRecordColumns from "./DataRecordColumns";
import { getInspectorColorClass } from "./inspectorPanelOptions";
import { buildInspectorBlocks } from "./utils";
import type { InspectorItem } from "@/models/shared";

// ============================================================================
// ConfiguredDataRecordDisplay
// Renders a single record's json using inspector config items directly.
// Falls back to DataRecordColumns when no column items are configured.
// ============================================================================

export default function ConfiguredDataRecordDisplay({
  json,
  dataSourceId,
}: {
  json: Record<string, unknown>;
  dataSourceId: string;
}) {
  const inspectorConfig = useInspectorDataSourceConfig(dataSourceId);

  const inspectorColumns = useMemo(
    () =>
      inspectorConfig?.items?.filter(
        (i): i is Extract<InspectorItem, { type: "column" }> =>
          i.type === "column",
      ) || [],
    [inspectorConfig],
  );

  const hasValues = inspectorColumns.some((item) => {
    const raw = json[item.name];
    return raw !== undefined && raw !== null && String(raw) !== "";
  });

  const blocks = useMemo(
    () => buildInspectorBlocks(inspectorConfig?.items),
    [inspectorConfig?.items],
  );

  if (inspectorColumns.length === 0) {
    return <DataRecordColumns json={json} dataSourceId={dataSourceId} />;
  }

  if (!hasValues) {
    return <></>;
  }

  const isTwoColumn = inspectorConfig?.layout === "twoColumn";

  const dividerBackgroundClassName = getInspectorColorClass(
    inspectorConfig?.color,
  );

  return (
    <dl
      className={cn(
        "flex flex-col gap-3",
        isTwoColumn &&
          "grid grid-cols-2 gap-x-4 gap-y-3 relative before:content-[''] before:absolute before:left-1/2 before:top-0 before:bottom-0 before:w-px before:bg-neutral-200 before:-translate-x-px",
      )}
    >
      {blocks.map((block, blockIndex) => {
        const divider =
          block.group !== undefined ? (
            <div
              key={`divider-${blockIndex}`}
              className={cn(
                "text-neutral-500 text-xs font-medium uppercase tracking-wide pt-4 relative z-10",
                dividerBackgroundClassName ?? "bg-inherit",
                isTwoColumn
                  ? "col-span-2 mt-2 first:mt-0 first:border-t-0 first:pt-0"
                  : "mt-3 first:mt-0 first:border-t-0 first:pt-0",
              )}
            >
              <div className="border-t border-neutral-400 pt-2">
                {block.group}
              </div>
            </div>
          ) : null;

        return (
          <React.Fragment key={`properties-${blockIndex}`}>
            {divider}
            <DataRecordColumns
              columns={block.columns}
              json={json}
              dataSourceId={dataSourceId}
            />
          </React.Fragment>
        );
      })}
    </dl>
  );
}
