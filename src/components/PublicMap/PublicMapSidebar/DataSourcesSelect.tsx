import { useContext } from "react";
import { ColumnDef, PublicMapDataSourceConfig } from "@/__generated__/types";
import { DataSourcesContext } from "@/components/Map/context/DataSourcesContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";

interface DataSource {
  id: string;
  name: string;
  columnDefs: ColumnDef[];
  columnRoles: { nameColumns?: string[] | null };
}

export default function DataSourcesSelect() {
  const { mapConfig } = useContext(MapContext);
  const { getDataSourceById } = useContext(DataSourcesContext);
  const { publicMap, updatePublicMap } = useContext(PublicMapContext);

  const dataSources = mapConfig
    .getDataSourceIds()
    .map((id) => getDataSourceById(id))
    .filter((ds) => ds !== undefined && ds !== null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Select data sources</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {dataSources.map((ds) => (
          <DropdownMenuCheckboxItem
            key={ds.id}
            checked={publicMap?.dataSourceConfigs.some(
              (dsc) => dsc.dataSourceId === ds.id
            )}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(checked) => {
              if (checked) {
                updatePublicMap({
                  dataSourceConfigs: [createDataSourceConfig(ds)].concat(
                    publicMap?.dataSourceConfigs || []
                  ),
                });
              } else {
                updatePublicMap({
                  dataSourceConfigs: publicMap?.dataSourceConfigs.filter(
                    (dsc) => dsc.dataSourceId !== ds.id
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

const createDataSourceConfig = (
  dataSource: DataSource
): PublicMapDataSourceConfig => {
  return {
    dataSourceId: dataSource.id,
    nameLabel: "Name",
    nameColumns: dataSource.columnRoles.nameColumns || [],
    descriptionLabel: "Description",
    descriptionColumn: "",
    additionalColumns: [],
  };
};
