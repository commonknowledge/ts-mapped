import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import TogglePanel from "@/app/map/[id]/components/TogglePanel";
import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import DataSourceIcon from "@/components/DataSourceIcon";
import { getDataSourceType } from "@/components/DataSourceItem";
import { AreaSetCode } from "@/server/models/AreaSet";
import type { InspectorBoundaryConfig } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { DataRecordMatchType } from "@/types";
import { buildName } from "@/utils/dataRecord";
import { useDataSources } from "../../hooks/useDataSources";
import PropertiesList, { type PropertyEntry } from "./PropertiesList";

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
  config: { name: string; dataSourceId: string };
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
      icon={
        dataSourceType ? <DataSourceIcon type={dataSourceType} /> : undefined
      }
      defaultExpanded={defaultExpanded}
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
          layout={layout}
          match={data.match}
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

function BoundaryDataProperties({
  json,
  columns,
  columnMetadata,
  columnGroups,
  layout,
  match,
}: {
  json: Record<string, unknown>;
  columns: string[];
  columnMetadata?: InspectorBoundaryConfig["columnMetadata"];
  columnGroups?: InspectorBoundaryConfig["columnGroups"];
  layout?: InspectorBoundaryConfig["layout"];
  match: DataRecordMatchType;
}) {
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
        if (json[col] === undefined) return;
        ordered.push({
          key: col,
          label: meta[col]?.displayName ?? col,
          value: json[col],
          groupLabel: g.label,
        });
      });
    });
    columns.forEach((col) => {
      if (keyToGroup.has(col)) return;
      if (json[col] === undefined) return;
      ordered.push({
        key: col,
        label: meta[col]?.displayName ?? col,
        value: json[col],
      });
    });
    return ordered;
  }, [json, columns, columnMetadata, columnGroups]);
  return (
    <div className="">
      {match === DataRecordMatchType.Approximate && (
        <p className="text-sm text-muted-foreground mb-2 italic">
          Approximate boundary match
        </p>
      )}
      {entries.length > 0 ? (
        <PropertiesList entries={entries} layout={layout ?? "single"} />
      ) : (
        <p className="text-sm">No data available</p>
      )}
    </div>
  );
}
