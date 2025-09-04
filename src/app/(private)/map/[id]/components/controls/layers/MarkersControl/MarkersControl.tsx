import { Check, Ellipsis, FolderPlusIcon, LoaderPinwheel } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import { v4 as uuidv4 } from "uuid";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { DataSourcesContext } from "@/components/Map/context/DataSourcesContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import { mapColors } from "@/components/Map/styles";
import { CollectionIcon } from "../../../Icons";
import ControlItemWrapper from "../../ControlItemWrapper";
import LayerHeader from "../../LayerHeader";
import MarkersList from "./MarkersList";

export default function MarkersControl() {
  const router = useRouter();
  const {
    mapConfig,
    updateMapConfig,
    viewConfig,
    updateViewConfig,
    mapRef,
    setPinDropMode,
  } = useContext(MapContext);
  const {
    insertPlacedMarker,
    placedMarkersLoading,
    folders,
    foldersLoading,
    insertFolder,
  } = useContext(MarkerAndTurfContext);
  const { getDataSources } = useContext(DataSourcesContext);

  const createFolder = () => {
    const newFolder = {
      id: uuidv4(),
      name: `New Folder ${folders.length + 1}`,
      notes: "",
    };
    insertFolder(newFolder);
  };

  const handleManualSearch = () => {
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
  };

  const handleDropPin = () => {
    const map = mapRef?.current;
    if (map) {
      map.getCanvas().style.cursor = "crosshair";
      setPinDropMode(true);

      const clickHandler = (e: mapboxgl.MapMouseEvent) => {
        insertPlacedMarker({
          id: uuidv4(),
          label: `Dropped Pin (${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)})`,
          notes: "",
          point: e.lngLat,
          folderId: null,
        });

        // Reset cursor
        map.getCanvas().style.cursor = "";
        map.off("click", clickHandler);
        setPinDropMode(false);

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
    return markerDataSources.map((dataSource) => {
      const selected = mapConfig.markerDataSourceIds.includes(dataSource.id);
      return {
        type: "item" as const,
        icon: selected ? <Check /> : null,
        label: dataSource.name,
        onClick: () => {
          updateMapConfig({
            markerDataSourceIds: selected
              ? mapConfig.markerDataSourceIds.filter(
                  (id) => id !== dataSource.id,
                )
              : [...mapConfig.markerDataSourceIds, dataSource.id],
          });
        },
      };
    });
  };

  const getDropdownItems = () => [
    {
      type: "submenu" as const,
      label: "Add Single Marker",
      icon: (
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: mapColors.markers.color }}
        />
      ),
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
      icon: <CollectionIcon color={mapColors.markers.color} />,
      items: [
        ...getDataSourceDropdownItems(),
        {
          type: "separator" as const,
        },
        {
          type: "item" as const,
          label: "Add new data source",
          onClick: () => router.push("/data-sources/new"),
        },
      ],
    },
    { type: "separator" as const },
    {
      type: "item" as const,
      icon: <FolderPlusIcon className="w-4 h-4 text-muted-foreground" />,
      label: "Add Folder",
      onClick: () => createFolder(),
    },
  ];

  const loading = foldersLoading || placedMarkersLoading;

  return (
    <ControlItemWrapper className="markers-control">
      <LayerHeader
        label="Markers"
        color={mapColors.markers.color}
        showLayer={viewConfig.showLocations}
        setLayer={(show) => updateViewConfig({ showLocations: show })}
      >
        {loading && <LoaderPinwheel className="animate-spin" size={16} />}
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
