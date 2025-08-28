import { useContext } from "react";
import { Checkbox } from "@/shadcn/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { MapContext } from "../../context/MapContext";
import { useDataSources } from "../../hooks";

export default function AddMembersDataModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dataSources = useDataSources();
  const { updateMapConfig, mapConfig } = useContext(MapContext);

  const updateMarkerDataSources = (dataSourceIds: string[]) => {
    updateMapConfig({ markerDataSourceIds: dataSourceIds });
  };

  const handleDataSourceToggle = (dataSourceId: string, checked: boolean) => {
    if (checked) {
      updateMarkerDataSources([...mapConfig.markerDataSourceIds, dataSourceId]);
    } else {
      updateMarkerDataSources(
        mapConfig.markerDataSourceIds.filter((id) => id !== dataSourceId),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add data to map</DialogTitle>
          <DialogDescription>
            Select data sources to display their locations on the map
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 relative">
          {dataSources.map((dataSource) => (
            <label
              key={dataSource.id}
              className="flex items-center gap-4 rounded-lg border hover:bg-neutral-50 cursor-pointer"
            >
              <Checkbox
                id={`ds-${dataSource.id}`}
                onCheckedChange={(checked) =>
                  handleDataSourceToggle(dataSource.id, checked as boolean)
                }
                checked={mapConfig.markerDataSourceIds.some(
                  (id) => id === dataSource.id,
                )}
              />
              <div className="flex flex-col flex-1">
                <span className="font-medium">{dataSource.name}</span>
                <span className="text-sm text-muted-foreground">
                  {dataSource.recordCount?.count || 0} location
                  {dataSource.recordCount?.count !== 1 ? "s" : ""}
                </span>
              </div>
            </label>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
