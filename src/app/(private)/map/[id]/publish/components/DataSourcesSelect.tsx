import { Database } from "lucide-react";
import { useDataSources } from "@/app/(private)/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/(private)/map/[id]/hooks/useMapConfig";
import { DataSourceRecordType } from "@/models/DataSource";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { getMarkerDataSourceIds } from "@/utils/map";
import {
  usePublicDataSourceIds,
  usePublicMapValue,
  useSetActiveDataSourceId,
  useUpdatePublicMap,
} from "../hooks/usePublicMap";
import { createDataSourceConfig } from "../hooks/usePublicMapQuery";

export default function DataSourcesSelect() {
  const { data: dataSources } = useDataSources();
  const publicMap = usePublicMapValue();
  const updatePublicMap = useUpdatePublicMap();
  const { mapConfig, updateMapConfig } = useMapConfig();

  const markerDataSources = getMarkerDataSourceIds(mapConfig);
  const publicDataSourceIds = usePublicDataSourceIds();
  const setActiveDataSourceId = useSetActiveDataSourceId();

  const validDataSources =
    dataSources?.filter((ds) => ds.recordType !== DataSourceRecordType.Data) ||
    [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">
          <Database className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Data Sources</DropdownMenuLabel>
        {validDataSources.map((ds) => (
          <DropdownMenuCheckboxItem
            key={ds.id}
            checked={publicDataSourceIds.includes(ds.id)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(checked) => {
              if (checked) {
                updatePublicMap({
                  dataSourceConfigs: [createDataSourceConfig(ds)].concat(
                    publicMap?.dataSourceConfigs || [],
                  ),
                });
                // Add the data source to the private map
                if (markerDataSources.includes(ds.id)) {
                  return;
                }
                if (
                  ds.recordType === DataSourceRecordType.Members &&
                  !mapConfig.membersDataSourceId
                ) {
                  updateMapConfig({
                    membersDataSourceId: ds.id,
                  });
                } else {
                  if (!mapConfig.markerDataSourceIds.includes(ds.id)) {
                    updateMapConfig({
                      markerDataSourceIds: [
                        ...mapConfig.markerDataSourceIds,
                        ds.id,
                      ],
                    });
                  }
                }
              } else {
                // Only remove from dataSourceConfigs — keep mapConfig intact
                // so the data source remains available in the private view.
                const remainingConfigs =
                  publicMap?.dataSourceConfigs.filter(
                    (dsc) => dsc.dataSourceId !== ds.id,
                  ) ?? [];
                updatePublicMap({ dataSourceConfigs: remainingConfigs });
                setActiveDataSourceId(
                  remainingConfigs[0]?.dataSourceId ?? null,
                );
              }
            }}
          >
            {ds.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
