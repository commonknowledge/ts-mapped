"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import TogglePanel from "@/app/(private)/map/[id]/components/TogglePanel";
import DataSourceIcon from "@/components/DataSourceIcon";
import { getDataSourceType } from "@/components/DataSourceItem";
import { AreaSetCode } from "@/models/AreaSet";
import { useTRPC } from "@/services/trpc/react";
import { DataRecordMatchType } from "@/types";
import { buildName } from "@/utils/dataRecord";
import { useDataSources } from "../../hooks/useDataSources";
import { getSelectedItemsOrdered } from "./inspectorColumnOrder";
import {
  InspectorPanelIcon,
  getBarColorForLabel,
  getInspectorColorClass,
} from "./inspectorPanelOptions";
import PropertiesList from "./PropertiesList";
import type { PropertyEntry } from "./PropertiesList";
import type { SelectedBoundary } from "../../types/inspector";
import type { DataSource } from "@/models/DataSource";
import type { InspectorDataSourceConfig } from "@/models/MapView";
import type { Point } from "@/models/shared";

const COMPARISON_STAT_LABEL: Record<string, string> = {
  average: "Average",
  median: "Median",
  min: "Min",
  max: "Max",
};

function isDivider(
  item: unknown,
): item is { type: "divider"; id: string; label: string } {
  return (
    typeof item === "object" &&
    item !== null &&
    (item as { type?: string }).type === "divider"
  );
}

function useEffectiveConfig(
  config: InspectorDataSourceConfig,
  dataSource: DataSource | null | undefined,
): InspectorDataSourceConfig {
  return useMemo(() => {
    const defaults = dataSource?.defaultInspectorConfig;
    if (!defaults) return config;

    const hasStoredItems =
      config.inspectorColumnItems != null &&
      config.inspectorColumnItems.length > 0;

    if (hasStoredItems) return config;

    // Per-map config is unconfigured — use the superadmin defaults
    return {
      ...config,
      inspectorColumnItems: defaults.items ?? config.inspectorColumnItems,
      layout: defaults.layout ?? config.layout,
      icon: defaults.icon ?? config.icon ?? undefined,
      color: defaults.color ?? config.color ?? undefined,
    };
  }, [config, dataSource]);
}

export function BoundaryDataPanel({
  config,
  selectedBoundary,
  markerPoint,
  defaultExpanded,
}: {
  config: InspectorDataSourceConfig;
  selectedBoundary?: SelectedBoundary | null | undefined;
  markerPoint?: Point | null | undefined;
  defaultExpanded: boolean;
}) {
  const trpc = useTRPC();
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(config.dataSourceId);
  const effectiveConfig = useEffectiveConfig(config, dataSource);

  const dataSourceType = dataSource ? getDataSourceType(dataSource) : null;

  const allColumnNames = useMemo(
    () => dataSource?.columnDefs?.map((c) => c.name) ?? [],
    [dataSource],
  );

  // Columns that need comparison baselines
  const comparisonColumns = useMemo(
    () =>
      (effectiveConfig.inspectorColumnItems ?? [])
        .filter(
          (item): item is Extract<typeof item, { type: "column" }> =>
            item.type === "column" &&
            item.displayFormat === "NumberWithComparison",
        )
        .map((item) => ({
          col: item.name,
          stat: (item.comparisonStat?.toLowerCase() ?? "average") as
            | "average"
            | "median"
            | "min"
            | "max",
        })),
    [effectiveConfig.inspectorColumnItems],
  );

  const baselineQueries = useQueries({
    queries: comparisonColumns.map(({ col, stat }) =>
      trpc.dataRecord.columnStat.queryOptions({
        dataSourceId: config.dataSourceId,
        columnName: col,
        stat,
      }),
    ),
  });

  const comparisonBaselines = useMemo((): Record<string, number | null> => {
    const out: Record<string, number | null> = {};
    comparisonColumns.forEach(({ col }, i) => {
      out[col] = baselineQueries[i]?.data ?? null;
    });
    return out;
  }, [comparisonColumns, baselineQueries]);

  const comparisonBaselineLoading = useMemo((): Record<string, boolean> => {
    const out: Record<string, boolean> = {};
    comparisonColumns.forEach(({ col }, i) => {
      const q = baselineQueries[i];
      out[col] = q?.isLoading === true || q?.isFetching === true;
    });
    return out;
  }, [comparisonColumns, baselineQueries]);

  const { data: boundaryData, isLoading: isLoadingBoundary } = useQuery(
    trpc.dataRecord.byAreaCode.queryOptions(
      {
        dataSourceId: config.dataSourceId,
        areaCode: selectedBoundary?.code || "",
        areaSetCode: selectedBoundary?.areaSetCode ?? AreaSetCode.WMC24,
      },
      {
        enabled: Boolean(selectedBoundary),
      },
    ),
  );

  const { data: pointData, isLoading: isLoadingPoint } = useQuery(
    trpc.dataRecord.byPoint.queryOptions(
      {
        dataSourceId: config.dataSourceId,
        point: markerPoint || { lat: 0, lng: 0 },
      },
      {
        enabled: Boolean(markerPoint),
      },
    ),
  );

  const isLoading = isLoadingBoundary || isLoadingPoint;
  const data = boundaryData || pointData;

  const panelIcon = effectiveConfig.icon ? (
    <InspectorPanelIcon
      iconName={effectiveConfig.icon}
      className="h-4 w-4 shrink-0"
    />
  ) : dataSourceType ? (
    <span className="shrink-0">
      <DataSourceIcon type={dataSourceType} />
    </span>
  ) : undefined;

  return (
    <TogglePanel
      label={config.name}
      icon={panelIcon}
      defaultExpanded={defaultExpanded}
      wrapperClassName={getInspectorColorClass(effectiveConfig.color)}
    >
      {isLoading ? (
        <div className="py-4 text-center text-muted-foreground">
          <p className="text-sm">Loading...</p>
        </div>
      ) : data?.records.length === 1 ? (
        <BoundaryDataProperties
          json={data.records[0].json}
          effectiveConfig={effectiveConfig}
          allColumnNames={allColumnNames}
          dataSource={dataSource}
          match={data.match}
          comparisonBaselines={comparisonBaselines}
          comparisonBaselineLoading={comparisonBaselineLoading}
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
                  effectiveConfig={effectiveConfig}
                  allColumnNames={allColumnNames}
                  dataSource={dataSource}
                  match={data.match}
                  comparisonBaselines={comparisonBaselines}
                  comparisonBaselineLoading={comparisonBaselineLoading}
                />
              </TogglePanel>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-4 text-center text-muted-foreground">
          <p className="text-sm">No data</p>
        </div>
      )}
    </TogglePanel>
  );
}

function BoundaryDataProperties({
  json,
  effectiveConfig,
  allColumnNames,
  dataSource,
  match,
  comparisonBaselines,
  comparisonBaselineLoading,
}: {
  json: Record<string, unknown>;
  effectiveConfig: InspectorDataSourceConfig;
  allColumnNames: string[];
  dataSource: DataSource | null | undefined;
  match: DataRecordMatchType;
  comparisonBaselines: Record<string, number | null>;
  comparisonBaselineLoading: Record<string, boolean>;
}) {
  const entries = useMemo((): PropertyEntry[] => {
    const items = getSelectedItemsOrdered(effectiveConfig, allColumnNames);

    // If no columns are configured, fall back to showing all columns from json
    if (items.filter((i) => i.type === "column").length === 0) {
      return Object.entries(json)
        .filter(([, v]) => v !== null && v !== undefined && String(v) !== "")
        .map(([key, value]) => ({
          key,
          label: key,
          value,
          description: dataSource?.columnMetadata?.find((c) => c.name === key)
            ?.description,
        }));
    }

    const result: PropertyEntry[] = [];
    let index = 0;

    for (const item of items) {
      if (isDivider(item)) {
        result.push({
          key: `__divider_${item.id}`,
          label: item.label,
          isDivider: true,
        });
      } else {
        const raw = json[item.name];
        const value =
          raw !== undefined && raw !== null && String(raw) !== "" ? raw : "—";
        result.push({
          key: `col-${index}-${item.name}`,
          label: item.name,
          value,
          format: item.displayFormat,
          scaleMax: item.scaleMax,
          barColor: getBarColorForLabel(
            item.name,
            item.name,
            index,
            item.barColor,
          ),
          description: dataSource?.columnMetadata?.find(
            (c) => c.name === item.name,
          )?.description,
          ...(item.displayFormat === "NumberWithComparison" && {
            comparisonBaseline: comparisonBaselines[item.name] ?? null,
            comparisonStat:
              COMPARISON_STAT_LABEL[
                item.comparisonStat?.toLowerCase() ?? "average"
              ] ??
              item.comparisonStat ??
              "Average",
            comparisonBaselineLoading:
              comparisonBaselineLoading[item.name] === true,
          }),
        });
        index += 1;
      }
    }
    return result;
  }, [
    effectiveConfig,
    allColumnNames,
    json,
    dataSource,
    comparisonBaselines,
    comparisonBaselineLoading,
  ]);

  const dividerBgClass = getInspectorColorClass(effectiveConfig.color);

  return (
    <div className="">
      {match === DataRecordMatchType.Approximate && (
        <p className="text-sm text-muted-foreground mb-2 italic">
          Approximate boundary match
        </p>
      )}
      <PropertiesList
        entries={entries}
        layout={effectiveConfig.layout ?? "single"}
        dividerBackgroundClassName={dividerBgClass}
      />
    </div>
  );
}
