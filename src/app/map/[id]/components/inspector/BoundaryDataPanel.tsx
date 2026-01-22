import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import TogglePanel from "@/app/map/[id]/components/TogglePanel";
import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import DataSourceIcon from "@/components/DataSourceIcon";
import { getDataSourceType } from "@/components/DataSourceItem";
import { AreaSetCode } from "@/server/models/AreaSet";
import { useTRPC } from "@/services/trpc/react";
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

  const filteredProperties = useMemo(() => {
    if (!data?.json) return {};
    const filtered: Record<string, unknown> = {};
    columns.forEach((columnName) => {
      if (data.json[columnName] !== undefined) {
        filtered[columnName] = data.json[columnName];
      }
    });
    return filtered;
  }, [data, columns]);

  return (
    <TogglePanel
      label={config.name}
      icon={
        dataSourceType ? <DataSourceIcon type={dataSourceType} /> : undefined
      }
      defaultExpanded={defaultExpanded}
    >
      <div className="flex flex-col gap-4 pt-4">
        {isLoading ? (
          <div className="py-4 text-center text-muted-foreground">
            <p className="text-sm">Loading...</p>
          </div>
        ) : Object.keys(filteredProperties).length > 0 ? (
          <PropertiesList properties={filteredProperties} />
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            <p className="text-sm">No data available</p>
          </div>
        )}
      </div>
    </TogglePanel>
  );
}
