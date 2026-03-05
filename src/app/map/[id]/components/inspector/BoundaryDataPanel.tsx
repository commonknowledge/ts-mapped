import { useQuery } from "@tanstack/react-query";
import TogglePanel from "@/app/map/[id]/components/TogglePanel";
import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import DataSourceIcon from "@/components/DataSourceIcon";
import { getDataSourceType } from "@/components/DataSourceItem";
import { AreaSetCode } from "@/server/models/AreaSet";
import { useTRPC } from "@/services/trpc/react";
import { DataRecordMatchType } from "@/types";
import { buildName } from "@/utils/dataRecord";
import { useDataSources } from "../../hooks/useDataSources";
import DataSourcePropertiesList from "./DataSourcePropertiesList";
import type { DataSource } from "@/server/models/DataSource";

export function BoundaryDataPanel({
  config,
  dataSourceId,
  areaCode,
  columns,
  defaultExpanded,
}: {
  config: { name: string; dataSourceId: string };
  dataSourceId: string;
  areaCode: string;
  columns: string[];
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
          dataSource={dataSource}
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
                  dataSource={dataSource}
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
  dataSource,
  match,
}: {
  json: Record<string, unknown>;
  columns: string[];
  dataSource: DataSource | null | undefined;
  match: DataRecordMatchType;
}) {
  return (
    <div className="ml-6">
      {match === DataRecordMatchType.Approximate && (
        <p className="text-sm text-muted-foreground mb-2 italic">
          Approximate boundary match
        </p>
      )}
      <DataSourcePropertiesList
        onlyColumns={columns}
        dataSource={dataSource}
        json={json}
      />
    </div>
  );
}
