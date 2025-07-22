import {
  Check,
  Database,
  DatabaseIcon,
  Ellipsis,
  FolderPlusIcon,
  MapPinIcon,
  Pencil,
  Table,
  Trash2,
} from "lucide-react";
import { useContext, useState } from "react";
import { PlacedMarker } from "@/__generated__/types";
import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { TableContext } from "@/app/(private)/map/[id]/context/TableContext";
import { mapColors } from "@/app/(private)/map/[id]/styles";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { Button } from "@/shadcn/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import DataSourceIcon from "../../DataSourceIcon";
import Loading from "../../Loading";
import AddMembersDataModal from "../AddMemberModal";
import ControlItemWrapper from "../ControlItemWrapper";
import LayerHeader from "../LayerHeader";

export default function MarkersControl() {
  const { viewConfig, updateViewConfig, mapRef } = useContext(MapContext);
  const { insertPlacedMarker } = useContext(MarkerAndTurfContext);
  const [dataSourcesModalOpen, setDataSourcesModalOpen] =
    useState<boolean>(false);
  const { getDataSources } = useContext(DataSourcesContext);

  const handleManualSearch = () => {
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
  };

  const handleDropPin = () => {
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
  };

  const getDataSourceDropdownItems = () => {
    const markerDataSources = getDataSources();
    return markerDataSources.map((dataSource) => ({
      type: "item" as const,
      label: dataSource.name,
      onClick: () => console.log("clicked"),
    }));
  };

  const getDropdownItems = () => [
    {
      type: "submenu" as const,
      label: "Add Single Marker",
      icon: <MapPinIcon className="w-4 h-4 text-muted-foreground" />,
      items: [
        {
          type: "item" as const,
          label: "Search for a location",
          onClick: () => handleManualSearch(),
        },
        {
          type: "item" as const,
          label: "Drop a pin on the map",
          onClick: () => handleDropPin(),
        },
      ],
    },
    {
      type: "submenu" as const,
      label: "Add Marker Collection",
      icon: <DatabaseIcon className="w-4 h-4 text-muted-foreground" />,
      items: [
        ...getDataSourceDropdownItems(),
        {
          type: "separator" as const,
        },
        {
          type: "item" as const,
          label: "Add new data source",
          onClick: () => console.log("clicked"),
        },
      ],
    },
    { type: "separator" as const },
    {
      type: "item" as const,
      icon: <FolderPlusIcon className="w-4 h-4 text-muted-foreground" />,
      label: "Add Folder",
      onClick: () => console.log("clicked"),
    },
  ];

  return (
    <ControlItemWrapper className="markers-control">
      <AddMembersDataModal
        open={dataSourcesModalOpen}
        onOpenChange={setDataSourcesModalOpen}
      />
      <LayerHeader
        label="Markers"
        color={mapColors.markers.color}
        showLayer={viewConfig.showLocations}
        setLayer={(show) => updateViewConfig({ showLocations: show })}
      >
        <IconButtonWithTooltip
          align="start"
          side="right"
          tooltip="Marker options"
          dropdownLabel="Marker options"
          dropdownItems={getDropdownItems()}
        >
          <Ellipsis className="w-4 h-4" />
        </IconButtonWithTooltip>
      </LayerHeader>
      <MarkersList />
    </ControlItemWrapper>
  );
}

const MarkersList = () => {
  const { viewConfig, mapRef } = useContext(MapContext);
  const {
    placedMarkers,
    placedMarkersLoading,
    deletePlacedMarker,
    updatePlacedMarker,
  } = useContext(MarkerAndTurfContext);
  const { selectedDataSourceId, handleDataSourceSelect } =
    useContext(TableContext);
  const { getMarkerDataSources } = useContext(DataSourcesContext);
  const [contextMenuIndex, setContextMenuIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const markerDataSources = getMarkerDataSources();

  const handleEditMarker = (
    e: React.FormEvent<HTMLFormElement>,
    index: number
  ) => {
    e.preventDefault();
    const existingMarker = placedMarkers.find((m, i) => i === index);
    if (existingMarker) {
      updatePlacedMarker({ ...existingMarker, label: editText });
    }
  };

  const handleFlyToMarker = (marker: PlacedMarker) => {
    const map = mapRef?.current;
    if (map) {
      map.flyTo({
        center: marker.point,
        zoom: 12,
      });
    }
  };

  return (
    <div className="relative">
      {/* Disable interactions while markers are loading/updating in the background */}
      {placedMarkersLoading && <Loading blockInteraction />}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <ul
            className={`${viewConfig.showLocations ? "opacity-100" : "opacity-50"}`}
          >
            {placedMarkers.map((result, index) => (
              <li
                key={index}
                className="flex items-center gap-2 p-1 hover:bg-neutral-100 rounded"
                onContextMenu={() => setContextMenuIndex(index)}
              >
                {editingIndex === index ? (
                  <form
                    onSubmit={(e) => {
                      handleEditMarker(e, index);
                    }}
                    className="w-full flex items-center p-0"
                  >
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoFocus
                    />
                    <Button className="" type="submit" variant="link">
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                  </form>
                ) : (
                  <>
                    <div
                      className="  flex pl-1 items-center gap-1.5 flex-grow cursor-pointer text-sm "
                      onClick={() => {
                        handleFlyToMarker(result);
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: mapColors.markers.color }}
                      />
                      {result.label}
                    </div>
                  </>
                )}
              </li>
            ))}
            {/* Data sources */}
            {markerDataSources.length > 0 && (
              <div className=" gap-2 p-2 mt-3 bg-muted rounded">
                <div className="flex items-center gap-2">
                  <Database className="h-3 w-3 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    Data sources
                  </p>
                </div>

                <ul>
                  {markerDataSources.map((dataSource) => (
                    <li key={dataSource.id} className="text-sm mt-2">
                      <div
                        className={`text-sm cursor-pointer rounded hover:bg-neutral-100 transition-colors flex items-center justify-between gap-2 ${
                          dataSource.id === selectedDataSourceId
                            ? "bg-neutral-100"
                            : ""
                        }`}
                        onClick={() => handleDataSourceSelect(dataSource.id)}
                      >
                        <div className="flex items-center gap-2">
                          <DataSourceIcon type={dataSource.config.type} />
                          {dataSource.name}
                        </div>
                        {dataSource.id === selectedDataSourceId && (
                          <Table className="w-4 h-4 text-neutral-500" />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ul>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {contextMenuIndex !== null && (
            <>
              <ContextMenuItem
                onClick={() => {
                  setEditText(placedMarkers[contextMenuIndex].label);
                  setEditingIndex(contextMenuIndex);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  const existingMarker = placedMarkers.find(
                    (m, i) => i === contextMenuIndex
                  );
                  if (existingMarker) {
                    deletePlacedMarker(existingMarker.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};
