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
import { InspectorChart } from "./InspectorChart";
import { getChartColumnNames } from "./inspectorColumnOrder";
import {
  InspectorPanelIcon,
  getBarColorForLabel,
  getInspectorColorClass,
} from "./inspectorPanelOptions";
import PropertiesList, { type PropertyEntry } from "./PropertiesList";

import type {
  InspectorBoundaryConfig,
  InspectorChartConfig,
} from "@/server/models/MapView";

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
    "name" | "dataSourceId" | "icon" | "color" | "chart"
  >;
  dataSourceId: string;
  areaCode: string;
  columns: string[];
  columnMetadata?: InspectorBoundaryConfig["columnMetadata"];
  columnGroups?: InspectorBoundaryConfig["columnGroups"];
  layout?: InspectorBoundaryConfig["layout"];
  defaultExpanded: boolean;
}) {
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
      defaultExpanded={defaultExpanded}
      wrapperClassName={getInspectorColorClass(config.color)}
    >
      {isLoading ? (
        <div className="py-4 text-center text-muted-foreground">
          <p className="text-sm">Loading...</p>
        </div>
      ) : data?.records.length === 1 ? (
        <>
          {config.chart?.enabled && (
            <BoundaryChart
              json={data.records[0].json}
              columns={columns}
              columnMetadata={columnMetadata}
              chart={config.chart}
            />
          )}
          <BoundaryDataProperties
            json={data.records[0].json}
            columns={columns}
            columnMetadata={columnMetadata}
            columnGroups={columnGroups}
            layout={layout}
            match={data.match}
            hideFromListColumnNames={
              config.chart?.enabled && config.chart?.hideChartColumnsFromList
                ? getChartColumnNames(
                    columns,
                    columnMetadata,
                    config.chart.dataSource,
                    config.chart.columnNames,
                  )
                : undefined
            }
          />
        </>
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
                  layout={layout}
                  match={data.match}
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

function BoundaryChart({
  json,
  columns,
  columnMetadata,
  chart,
}: {
  json: Record<string, unknown>;
  columns: string[];
  columnMetadata?: InspectorBoundaryConfig["columnMetadata"];
  chart: InspectorChartConfig;
}) {
  const chartColumns = getChartColumnNames(
    columns,
    columnMetadata,
    chart.dataSource,
    chart.columnNames,
  );
  if (chartColumns.length === 0) return null;
  return (
    <InspectorChart
      json={json}
      columnNames={chartColumns}
      columnMetadata={columnMetadata}
      hideZeroValues={chart.hideZeroValues}
    />
  );
}

function BoundaryDataProperties({
  json,
  columns,
  columnMetadata,
  columnGroups,
  layout,
  match,
  hideFromListColumnNames,
}: {
  json: Record<string, unknown>;
  columns: string[];
  columnMetadata?: InspectorBoundaryConfig["columnMetadata"];
  columnGroups?: InspectorBoundaryConfig["columnGroups"];
  layout?: InspectorBoundaryConfig["layout"];
  match: DataRecordMatchType;
  /** When set, these columns are excluded from the list (e.g. already shown in chart) */
  hideFromListColumnNames?: string[];
}) {
  const hideSet = useMemo(
    () =>
      hideFromListColumnNames?.length
        ? new Set(hideFromListColumnNames)
        : undefined,
    [hideFromListColumnNames],
  );
  const entries = useMemo((): PropertyEntry[] => {
    const meta = columnMetadata ?? {};
    const groups = columnGroups ?? [];
    const keyToGroup = new Map<string, string>();
    groups.forEach((g) => {
      g.columnNames.forEach((col) => keyToGroup.set(col, g.label));
    });
    const ordered: PropertyEntry[] = [];
    groups.forEach((g) => {
      g.columnNames.forEach((col) => {
        if (hideSet?.has(col)) return;
        if (json[col] === undefined) return;
        const m = meta[col];
        const label = m?.displayName ?? col;
        ordered.push({
          key: col,
          label,
          value: json[col],
          groupLabel: g.label,
          format: m?.format,
          scaleMax: m?.scaleMax,
          barColor: getBarColorForLabel(label, col, ordered.length, m?.barColor),
        });
      });
    });
    columns.forEach((col) => {
      if (hideSet?.has(col)) return;
      if (keyToGroup.has(col)) return;
      if (json[col] === undefined) return;
      const m = meta[col];
      const label = m?.displayName ?? col;
      ordered.push({
        key: col,
        label,
        value: json[col],
        format: m?.format,
        scaleMax: m?.scaleMax,
        barColor: getBarColorForLabel(label, col, ordered.length, m?.barColor),
      });
    });
    return ordered;
  }, [json, columns, columnMetadata, columnGroups, hideSet]);
  return (
    <div className="">
      {match === DataRecordMatchType.Approximate && (
        <p className="text-sm text-muted-foreground mb-2 italic">
          Approximate boundary match
        </p>
      )}
      {entries.length > 0 ? (
        <PropertiesList entries={entries} layout={layout ?? "single"} />
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
