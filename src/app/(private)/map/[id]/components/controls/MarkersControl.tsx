import { DatabaseIcon, MapPinIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { PlacedMarker } from "@/__generated__/types";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { mapColors } from "@/app/(private)/map/[id]/styles";
import IconDropdownWithTooltip from "@/components/IconDropdownWithTooltip";
import { Checkbox } from "@/shadcn/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import MarkerList from "../lists/MarkerList";
import LayerHeader from "./LayerHeader";

export default function MarkersControl() {
  const { viewConfig, updateViewConfig, mapRef, insertPlacedMarker } =
    useContext(MapContext);
  const [activeDataSources, setActiveDataSources] = useState<string[]>([]);
  const [dataSourcesModalOpen, setDataSourcesModalOpen] =
    useState<boolean>(false);
  const router = useRouter();
  return (
    <div className="flex flex-col gap-1">
      <DataSourcesModal
        open={dataSourcesModalOpen}
        onOpenChange={setDataSourcesModalOpen}
        setActiveDataSources={setActiveDataSources}
        activeDataSources={activeDataSources}
      />
      <LayerHeader
        label="Markers"
        color={mapColors.searched.color}
        showLayer={viewConfig.showLocations}
        setLayer={(show) => updateViewConfig({ showLocations: show })}
      >
        <IconDropdownWithTooltip
          align="start"
          side="right"
          tooltip="Add Marker"
          dropdownLabel="Add Marker"
          dropdownItems={[
            {
              label: "Manual add using search",
              icon: <SearchIcon className="w-4 h-4" />,
              onClick: () => {
                setTimeout(() => {
                  const geocoderInput = document.querySelector(
                    ".mapboxgl-ctrl-geocoder--input",
                  ) as HTMLInputElement;
                  if (geocoderInput) {
                    geocoderInput.focus();
                    geocoderInput.addEventListener(
                      "blur",
                      (e) => {
                        e.preventDefault();
                        geocoderInput.focus();
                      },
                      { once: true },
                    );
                  }
                }, 200);
              },
            },
            {
              label: "Drop a pin on the map",
              icon: <MapPinIcon className="w-4 h-4" />,
              onClick: () => {
                const map = mapRef?.current;
                if (map) {
                  map.getCanvas().style.cursor = "crosshair";

                  const clickHandler = (e: mapboxgl.MapMouseEvent) => {
                    const newMarker: PlacedMarker = {
                      id: `temp-${new Date().getTime()}`,
                      label: `Dropped Pin (${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)})`,
                      notes: "",
                      point: e.lngLat,
                    };

                    insertPlacedMarker(newMarker);

                    // Reset cursor
                    map.getCanvas().style.cursor = "";
                    map.off("click", clickHandler);

                    // Fly to the new marker
                    map.flyTo({
                      center: e.lngLat,
                      zoom: 14,
                    });
                  };

                  map.once("click", clickHandler);
                }
              },
            },
            {
              label: "Import from your datasources",
              icon: <DatabaseIcon className="w-4 h-4" />,
              onClick: () => {
                setDataSourcesModalOpen(true);
              },
            },
            { type: "separator" },
            {
              label: "Add new Data Source",
              icon: <PlusIcon className="w-4 h-4" />,
              onClick: () => {
                router.push("/data-sources");
              },
            },
          ]}
        >
          <PlusIcon className="w-4 h-4" />
        </IconDropdownWithTooltip>
      </LayerHeader>
      <MarkerList activeDataSources={activeDataSources} />
    </div>
  );
}

function DataSourcesModal({
  open,
  onOpenChange,
  setActiveDataSources,
  activeDataSources,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setActiveDataSources: (activeDataSources: string[]) => void;
  activeDataSources: string[];
}) {
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
        <div className="flex flex-col gap-4">
          {dummyDataSourcesList.map((dataSource) => (
            <label
              key={dataSource.id}
              className="flex items-center gap-4 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
            >
              <Checkbox
                id={`ds-${dataSource.id}`}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setActiveDataSources([...activeDataSources, dataSource.id]);
                  } else {
                    setActiveDataSources(
                      activeDataSources.filter((id) => id !== dataSource.id),
                    );
                  }
                }}
                checked={activeDataSources.includes(dataSource.id)}
              />
              <div className="flex flex-col flex-1">
                <span className="font-medium">{dataSource.name}</span>
                <span className="text-sm text-muted-foreground">
                  {dataSource.recordCount || 0} locations
                </span>
              </div>
            </label>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const dummyDataSourcesList = [
  {
    id: "schools",
    name: "London Schools",
    recordCount: 342,
    config: { type: "csv" },
    createdAt: new Date(),
  },
  {
    id: "hospitals",
    name: "NHS Hospitals",
    recordCount: 168,
    config: { type: "csv" },
    createdAt: new Date(),
  },
  {
    id: "parks",
    name: "Public Parks & Gardens",
    recordCount: 523,
    config: { type: "csv" },
    createdAt: new Date(),
  },
];
