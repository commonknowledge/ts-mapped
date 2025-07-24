import {
  Check,
  DatabaseIcon,
  Ellipsis,
  FolderPlusIcon,
  MapPinIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import AddMembersDataModal from "@/app/(private)/map/[id]/components/controls/AddMemberModal";
import ControlItemWrapper from "@/app/(private)/map/[id]/components/controls/ControlItemWrapper";
import LayerHeader from "@/app/(private)/map/[id]/components/controls/LayerHeader";
import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { mapColors } from "@/app/(private)/map/[id]/styles";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import MarkersList from "./MarkersList";

export default function MarkersControl() {
  const router = useRouter();
  const { viewConfig, updateViewConfig, mapRef } = useContext(MapContext);
  const { insertPlacedMarker, folders, insertFolder } =
    useContext(MarkerAndTurfContext);
  const [dataSourcesModalOpen, setDataSourcesModalOpen] =
    useState<boolean>(false);
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
      const selected = viewConfig.markerDataSourceIds.includes(dataSource.id);
      return {
        type: "item" as const,
        icon: selected ? <Check /> : null,
        label: dataSource.name,
        onClick: () => {
          updateViewConfig({
            markerDataSourceIds: selected
              ? viewConfig.markerDataSourceIds.filter(
                  (id) => id !== dataSource.id,
                )
              : [...viewConfig.markerDataSourceIds, dataSource.id],
          });
        },
      };
    });
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
