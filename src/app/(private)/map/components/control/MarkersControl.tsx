import { DatabaseIcon, MapPinIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapRef } from "react-map-gl/mapbox";
import { mapColors } from "@/app/(private)/map/styles";
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
import { SearchResult } from "@/types";
import MarkerList from "../dataLists/MarkerList";
import SkeletonGroup from "../SkeletonGroup";
import LayerHeader from "./LayerHeader";
interface LocationsControlProps {
  searchHistory: SearchResult[];
  mapRef: React.RefObject<MapRef | null>;
  onEdit: (index: number, newText: string) => void;
  onDelete: (index: number) => void;
  isLoading?: boolean;
  showLocations: boolean;
  setShowLocations: (showLocations: boolean) => void;
  onAdd: (marker: SearchResult) => void;
  setSearchHistory: React.Dispatch<React.SetStateAction<SearchResult[]>>;
}

export default function MarkersControl({
  searchHistory,
  mapRef,
  onEdit,
  onDelete,
  isLoading = false,
  showLocations,
  setShowLocations,
  setSearchHistory,
}: LocationsControlProps) {
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
        showLayer={showLocations}
        setLayer={setShowLocations}
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
                const map = mapRef.current;
                if (map) {
                  map.getCanvas().style.cursor = "crosshair";

                  const clickHandler = (e: mapboxgl.MapMouseEvent) => {
                    const coordinates: [number, number] = [
                      e.lngLat.lng,
                      e.lngLat.lat,
                    ];

                    const newMarker: SearchResult = {
                      text: `Dropped Pin (${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)})`,
                      coordinates: coordinates,
                      timestamp: new Date(),
                    };

                    // Add to beginning of search history
                    setSearchHistory((prev) => [newMarker, ...prev]);

                    // Reset cursor
                    map.getCanvas().style.cursor = "";
                    map.off("click", clickHandler);

                    // Fly to the new marker
                    map.flyTo({
                      center: coordinates,
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
      {isLoading ? (
        <SkeletonGroup />
      ) : (
        <MarkerList
          history={searchHistory}
          onSelect={(coordinates) => {
            const map = mapRef.current;
            if (map) {
              map.flyTo({
                center: coordinates,
                zoom: 12,
              });
            }
          }}
          onEdit={onEdit}
          onDelete={onDelete}
          showLocations={showLocations}
          activeDataSources={activeDataSources}
        />
      )}
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
