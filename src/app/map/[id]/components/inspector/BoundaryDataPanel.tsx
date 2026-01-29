import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import TogglePanel from "@/app/map/[id]/components/TogglePanel";
import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import DataSourceIcon from "@/components/DataSourceIcon";
import { getDataSourceType } from "@/components/DataSourceItem";
import { AreaSetCode } from "@/server/models/AreaSet";
import { useTRPC } from "@/services/trpc/react";
import { buildName } from "@/utils/dataRecord";
import { useDataSources } from "../../hooks/useDataSources";
import PropertiesList from "./PropertiesList";

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
      ) : data?.length === 1 ? (
        <BoundaryDataProperties json={data[0].json} columns={columns} />
      ) : data?.length ? (
        <ul className="ml-2">
          {data.map((d, i) => (
            <li key={d.id}>
              <TogglePanel
                label={buildName(dataSource, d)}
                defaultExpanded={i === 0}
              >
                <BoundaryDataProperties json={d.json} columns={columns} />
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
}: {
  json: Record<string, unknown>;
  columns: string[];
}) {
  const filteredProperties = useMemo(() => {
    const filtered: Record<string, unknown> = {};
    columns.forEach((columnName) => {
      if (json[columnName] !== undefined) {
        filtered[columnName] = json[columnName];
      }
    });
    return filtered;
  }, [columns, json]);
  return (
    <div className="ml-6">
      {Object.keys(filteredProperties).length > 0 ? (
        <PropertiesList properties={filteredProperties} />
      ) : (
        <p className="text-sm">No data available</p>
      )}
    </div>
  );
}
