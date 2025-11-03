import { Database } from "lucide-react";
import { useContext } from "react";
import { getDataSourceIds } from "@/app/map/[id]/context/MapContext";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { PublicMapContext } from "../context/PublicMapContext";
import type { ColumnDef } from "@/server/models/DataSource";
import type { PublicMapDataSourceConfig } from "@/server/models/PublicMap";

interface DataSource {
  id: string;
  name: string;
  columnDefs: ColumnDef[];
  columnRoles: { nameColumns?: string[] | null };
}

export default function DataSourcesSelect() {
  const { mapConfig } = useMapConfig();
  const { getDataSourceById } = useDataSources();
  const { publicMap, updatePublicMap } = useContext(PublicMapContext);

  const dataSources = getDataSourceIds(mapConfig)
    .map((id) => getDataSourceById(id))
    .filter((ds) => ds !== undefined && ds !== null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">
          <Database className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Visible Data Sources</DropdownMenuLabel>
        {dataSources.map((ds) => (
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
              } else {
                updatePublicMap({
                  dataSourceConfigs: publicMap?.dataSourceConfigs.filter(
                    (dsc) => dsc.dataSourceId !== ds.id,
                  ),
                });
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
