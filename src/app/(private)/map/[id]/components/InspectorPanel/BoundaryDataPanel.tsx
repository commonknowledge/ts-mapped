import { useQuery } from "@tanstack/react-query";
import TogglePanel from "@/app/(private)/map/[id]/components/TogglePanel";
import DataSourceIcon from "@/components/DataSourceIcon";
import { getDataSourceType } from "@/components/DataSourceItem";
import { AreaSetCode } from "@/models/AreaSet";
import { useTRPC } from "@/services/trpc/react";
import { DataRecordMatchType } from "@/types";
import { buildName } from "@/utils/dataRecord";
import { useDataSources } from "../../hooks/useDataSources";
import DataSourcePropertiesList from "./DataSourcePropertiesList";
import type { SelectedBoundary } from "../../types/inspector";
import type { DataSource } from "@/models/DataSource";
import type { InspectorDataSourceConfig } from "@/models/MapView";
import type { Point } from "@/models/shared";

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

  const dataSourceType = dataSource ? getDataSourceType(dataSource) : null;

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
          columns={config.columns}
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
                  columns={config.columns}
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
