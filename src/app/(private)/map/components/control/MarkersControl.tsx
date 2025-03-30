import SearchHistory from "../dataLists/SearchHistory";
import { Label } from "@/shadcn/ui/label";
import { mapColors } from "@/app/(private)/map/styles";
import { MapRef } from "react-map-gl/mapbox";
import { SearchResult } from "@/types";
import SkeletonGroup from "../SkeletonGroup";
import LayerHeader from "./LayerHeader";
import {
  PlusIcon,
  SearchIcon,
  MapPinIcon,
  DatabaseIcon,
  LibraryIcon,
  UploadIcon,
} from "lucide-react";
import IconDropdownWithTooltip from "@/components/IconDropdownWithTooltip";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { UserDataSourceCard } from "@/app/(private)/data-sources/components/DataSourceCard";
import { Checkbox } from "@/shadcn/ui/checkbox";
interface LocationsControlProps {
  searchHistory: SearchResult[];
  mapRef: React.RefObject<MapRef | null>;
  onEdit: (index: number, newText: string) => void;
  onDelete: (index: number) => void;
  isLoading?: boolean;
  showLocations: boolean;
  setShowLocations: (showLocations: boolean) => void;
}

export default function MarkersControl({
  searchHistory,
  mapRef,
  onEdit,
  onDelete,
  isLoading = false,
  showLocations,
  setShowLocations,
}: LocationsControlProps) {
  const [activeDataSources, setActiveDataSources] = useState<Array<string>>([]);
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
                    ".mapboxgl-ctrl-geocoder--input"
                  ) as HTMLInputElement;
                  if (geocoderInput) {
                    geocoderInput.focus();
                    geocoderInput.addEventListener(
                      "blur",
                      (e) => {
                        e.preventDefault();
                        geocoderInput.focus();
                      },
                      { once: true }
                    );
                  }
                }, 200);
              },
            },
            // {
            //   label: "Import from Mapped Data Library",
            //   icon: <LibraryIcon className="w-4 h-4" />,
            //   onClick: () => {
            //     null;
            //   },
            // },
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
        <SearchHistory
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
  setActiveDataSources: (activeDataSources: Array<string>) => void;
  activeDataSources: Array<string>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your data sources</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {dummyDataSourcesList.map((dataSource) => (
            <div key={dataSource.id} className="flex items-center gap-2">
              <Checkbox
                className="flex items-center gap-2"
                onCheckedChange={(checked) => {
                  if (checked) {
                    setActiveDataSources([
                      ...activeDataSources,
                      dataSource.id,
                    ] as Array<string>);
                  }
                }}
                checked={activeDataSources.includes(dataSource.id)}
              />
              <p>{dataSource.name}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

let dummyDataSourcesList = [
  {
    id: "1",
    name: "Data Source 1",
    config: {
      type: "csv",
      createdAt: new Date(),
    },
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "Data Source 2",
    config: {
      type: "csv",
      createdAt: new Date(),
    },
    createdAt: new Date(),
  },
  {
    id: "3",
    name: "Data Source 3",
    config: {
      type: "csv",
      createdAt: new Date(),
    },
    createdAt: new Date(),
  },
  {
    id: "4",
    name: "Data Source 4",
    config: {
      type: "csv",
      createdAt: new Date(),
    },
    createdAt: new Date(),
  },
];
