import { Database } from "lucide-react";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import {
  type ColumnDef,
  DataSourceRecordType,
} from "@/server/models/DataSource";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { usePublicMapValue, useUpdatePublicMap } from "../hooks/usePublicMap";
import type { PublicMapDataSourceConfig } from "@/server/models/PublicMap";

interface DataSource {
  id: string;
  name: string;
  columnDefs: ColumnDef[];
  columnRoles: { nameColumns?: string[] | null };
}

export default function DataSourcesSelect() {
  const { data: dataSources } = useDataSources();
  const publicMap = usePublicMapValue();
  const updatePublicMap = useUpdatePublicMap();
  const { mapConfig, updateMapConfig } = useMapConfig();

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
        <DropdownMenuLabel>Visible Data Sources</DropdownMenuLabel>
        {validDataSources.map((ds) => (
          <DropdownMenuCheckboxItem
            key={ds.id}
            checked={publicMap?.dataSourceConfigs.some(
              (dsc) => dsc.dataSourceId === ds.id,
            )}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(checked) => {
              if (checked) {
                updatePublicMap({
                  dataSourceConfigs: [createDataSourceConfig(ds)].concat(
                    publicMap?.dataSourceConfigs || [],
                  ),
                });
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
                updatePublicMap({
                  dataSourceConfigs: publicMap?.dataSourceConfigs.filter(
                    (dsc) => dsc.dataSourceId !== ds.id,
                  ),
                });
                if (
                  ds.recordType === DataSourceRecordType.Members &&
                  mapConfig.membersDataSourceId === ds.id
                ) {
                  updateMapConfig({
                    membersDataSourceId: null,
                  });
                } else {
                  updateMapConfig({
                    markerDataSourceIds: mapConfig.markerDataSourceIds.filter(
                      (id) => id !== ds.id,
                    ),
                  });
                }
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

export const createDataSourceConfig = (
  dataSource: DataSource,
): PublicMapDataSourceConfig => {
  return {
    allowUserEdit: false,
    allowUserSubmit: false,
    dataSourceId: dataSource.id,
    dataSourceLabel: dataSource.name,
    formUrl: "",
    editFormUrl: "",
    nameLabel: "Name",
    nameColumns: dataSource.columnRoles.nameColumns || [],
    descriptionLabel: "",
    descriptionColumn: "",
    additionalColumns: [],
  };
};
