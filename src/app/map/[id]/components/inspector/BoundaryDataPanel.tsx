import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import TogglePanel from "@/app/map/[id]/components/TogglePanel";
import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import DataSourceIcon from "@/components/DataSourceIcon";
import { getDataSourceType } from "@/components/DataSourceItem";
import { AreaSetCode } from "@/server/models/AreaSet";
import { useTRPC } from "@/services/trpc/react";
import { DataRecordMatchType } from "@/types";
import { buildName } from "@/utils/dataRecord";
import { useDataSources } from "../../hooks/useDataSources";
import {
  InspectorPanelIcon,
  getBarColorForLabel,
  getInspectorColorClass,
} from "./inspectorPanelOptions";
import PropertiesList, { type PropertyEntry } from "./PropertiesList";

import type { InspectorBoundaryConfig } from "@/server/models/MapView";

export function BoundaryDataPanel({
  config,
  dataSourceId,
  areaCode,
  columns,
  columnMetadata,
  columnGroups,
  layout,
  defaultExpanded,
}: {
  config: Pick<
    InspectorBoundaryConfig,
    "name" | "dataSourceId" | "icon" | "color" | "columnItems"
  >;
  dataSourceId: string;
  areaCode: string;
  columns: string[];
  columnMetadata?: InspectorBoundaryConfig["columnMetadata"];
  columnGroups?: InspectorBoundaryConfig["columnGroups"];
  layout?: InspectorBoundaryConfig["layout"];
  defaultExpanded?: boolean;
}) {
  const expanded = defaultExpanded ?? true;
  const trpc = useTRPC();
  const { selectedBoundary } = useInspector();
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);

  const dataSourceType = dataSource ? getDataSourceType(dataSource) : null;
  const panelIcon = config.icon ? (
    <InspectorPanelIcon iconName={config.icon} className="h-4 w-4 shrink-0" />
  ) : dataSourceType ? (
    <DataSourceIcon type={dataSourceType} />
  ) : undefined;

  const { data, isLoading } = useQuery(
    trpc.dataRecord.byAreaCode.queryOptions(
      {
        dataSourceId,
        areaCode,
        areaSetCode:
          (selectedBoundary?.areaSetCode as AreaSetCode) || AreaSetCode.WMC24,
      },
      {
        enabled: Boolean(selectedBoundary?.areaSetCode && dataSourceId),
      },
    ),
  );

  return (
    <TogglePanel
      label={config.name}
      icon={panelIcon}
      defaultExpanded={expanded}
      wrapperClassName={getInspectorColorClass(config.color)}
    >
      {isLoading ? (
        <div className="py-4 text-center text-muted-foreground">
          <p className="text-sm">Loading...</p>
        </div>
      ) : data?.records.length === 1 ? (
        <BoundaryDataProperties
          json={data.records[0].json}
          columns={columns}
          columnMetadata={columnMetadata}
          columnGroups={columnGroups}
          columnItems={config.columnItems}
          layout={layout}
          match={data.match}
          dividerBackgroundClassName={getInspectorColorClass(config.color)}
        />
      ) : data?.records.length ? (
        <ul className="ml-2">
          {data.records.map((d, i) => (
            <li key={d.id}>
              <TogglePanel
                label={buildName(dataSource, d)}
                defaultExpanded={i === 0}
              >
                <BoundaryDataProperties
                  json={d.json}
                  columns={columns}
                  columnMetadata={columnMetadata}
                  columnGroups={columnGroups}
                  columnItems={config.columnItems}
                  layout={layout}
                  match={data.match}
                  dividerBackgroundClassName={getInspectorColorClass(
                    config.color,
                  )}
                />
              </TogglePanel>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-4 text-center text-muted-foreground">
          <p className="text-sm">No data available</p>
        </div>
      )}
    </TogglePanel>
  );
}

function isColumnItemDivider(
  item: unknown,
): item is { type: "divider"; id: string; label: string } {
  return (
    typeof item === "object" &&
    item !== null &&
    (item as { type?: string }).type === "divider"
  );
}

function BoundaryDataProperties({
  json,
  columns,
  columnMetadata,
  columnGroups,
  columnItems,
  layout,
  match,
  dividerBackgroundClassName,
}: {
  json: Record<string, unknown>;
  columns: string[];
  columnMetadata?: InspectorBoundaryConfig["columnMetadata"];
  columnGroups?: InspectorBoundaryConfig["columnGroups"];
  columnItems?: InspectorBoundaryConfig["columnItems"];
  layout?: InspectorBoundaryConfig["layout"];
  match: DataRecordMatchType;
  /** Background class for divider labels. Matches panel color. */
  dividerBackgroundClassName?: string;
}) {
  const entries = useMemo((): PropertyEntry[] => {
    const meta = columnMetadata ?? {};
    const columnsSet = new Set(columns);

    if (columnItems?.length) {
      const ordered: PropertyEntry[] = [];
      let currentGroupLabel: string | undefined;
      for (const item of columnItems) {
        if (isColumnItemDivider(item)) {
          ordered.push({
            key: `__divider_${item.id}`,
            label: item.label,
            isDivider: true,
          });
          currentGroupLabel = item.label;
        } else if (typeof item === "string" && columnsSet.has(item)) {
          if (json[item] === undefined) continue;
          const m = meta[item];
          const label = m?.displayName ?? item;
          ordered.push({
            key: `${item}-${ordered.length}`,
            label,
            value: json[item],
            groupLabel: currentGroupLabel,
            format: m?.format,
            scaleMax: m?.scaleMax,
            barColor: getBarColorForLabel(
              label,
              item,
              ordered.length,
              m?.barColor,
            ),
          });
        }
      }
      return ordered;
    }

    const groups = columnGroups ?? [];
    const keyToGroup = new Map<string, string>();
    groups.forEach((g) => {
      g.columnNames.forEach((col) => keyToGroup.set(col, g.label));
    });
    const ordered: PropertyEntry[] = [];
    groups.forEach((g) => {
      g.columnNames.forEach((col) => {
        if (json[col] === undefined) return;
        const m = meta[col];
        const label = m?.displayName ?? col;
        ordered.push({
          key: `${col}-${ordered.length}`,
          label,
          value: json[col],
          groupLabel: g.label,
          format: m?.format,
          scaleMax: m?.scaleMax,
          barColor: getBarColorForLabel(
            label,
            col,
            ordered.length,
            m?.barColor,
          ),
        });
      });
    });
    columns.forEach((col) => {
      if (keyToGroup.has(col)) return;
      if (json[col] === undefined) return;
      const m = meta[col];
      const label = m?.displayName ?? col;
      ordered.push({
        key: `${col}-${ordered.length}`,
        label,
        value: json[col],
        format: m?.format,
        scaleMax: m?.scaleMax,
        barColor: getBarColorForLabel(label, col, ordered.length, m?.barColor),
      });
    });
    return ordered;
  }, [json, columns, columnMetadata, columnGroups, columnItems]);
  return (
    <div className="">
      {match === DataRecordMatchType.Approximate && (
        <p className="text-sm text-muted-foreground mb-2 italic">
          Approximate boundary match
        </p>
      )}
      {entries.length > 0 ? (
        <PropertiesList
          entries={entries}
          layout={layout ?? "single"}
          dividerBackgroundClassName={dividerBackgroundClassName}
        />
      ) : columns.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No columns added. Click the settings icon to add columns from this
          data source.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">No data available</p>
      )}
    </div>
  );
}
