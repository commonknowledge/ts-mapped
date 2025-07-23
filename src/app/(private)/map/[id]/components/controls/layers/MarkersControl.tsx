import {
  DatabaseIcon,
  Ellipsis,
  FolderPlusIcon,
  MapPinIcon,
} from "lucide-react";
import { useContext, useState } from "react";
import { PlacedMarker } from "@/__generated__/types";
import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import {
  useDeleteMarkerFolderMutation,
  useUpsertMarkerFolderMutation,
} from "@/app/(private)/map/[id]/data";
import { mapColors } from "@/app/(private)/map/[id]/styles";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import AddMembersDataModal from "../AddMemberModal";
import ControlItemWrapper from "../ControlItemWrapper";
import LayerHeader from "../LayerHeader";
import MarkersList from "./MarkersList";

export default function MarkersControl() {
  const { viewConfig, updateViewConfig, mapRef, mapId } =
    useContext(MapContext);
  const {
    insertPlacedMarker,
    markerFolders,
    insertMarkerFolder,
    updateMarkerFolder,
    deleteMarkerFolder: deleteFromContext,
  } = useContext(MarkerAndTurfContext);
  const [dataSourcesModalOpen, setDataSourcesModalOpen] =
    useState<boolean>(false);
  const [draggedMarkerId, setDraggedMarkerId] = useState<string | null>(null);
  const { getDataSources } = useContext(DataSourcesContext);
  const [upsertMarkerFolder] = useUpsertMarkerFolderMutation();
  const [deleteMarkerFolder] = useDeleteMarkerFolderMutation();

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

  const handleAddFolder = async () => {
    if (!mapId) return;

    try {
      const result = await upsertMarkerFolder({
        variables: {
          name: `New Folder ${markerFolders.length + 1}`,
          markerIds: [],
          isExpanded: true,
          mapId,
        },
      });

      if (result.data?.upsertMarkerFolder?.result) {
        // Add the new folder to local state
        insertMarkerFolder(result.data.upsertMarkerFolder.result);
      }
    } catch (error) {
      console.error("Failed to create marker folder:", error);
    }
  };

  const handleEditFolder = async (folderId: string, newName: string) => {
    if (!mapId) return;

    const folder = markerFolders.find((f) => f.id === folderId);
    if (!folder) return;

    // Update frontend state immediately
    const updatedFolder = {
      ...folder,
      name: newName,
    };
    updateMarkerFolder(updatedFolder);

    // Sync to database in the background
    try {
      await upsertMarkerFolder({
        variables: {
          id: folderId,
          name: newName,
          markerIds: Array.isArray(folder.markerIds) ? folder.markerIds : [],
          isExpanded: folder.isExpanded,
          mapId,
        },
      });
    } catch (error) {
      console.error("Failed to update marker folder:", error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!mapId) return;

    try {
      const result = await deleteMarkerFolder({
        variables: {
          id: folderId,
          mapId,
        },
      });

      if (result.data?.deleteMarkerFolder?.code === 200) {
        // Remove from local state
        deleteFromContext(folderId);
      }
    } catch (error) {
      console.error("Failed to delete marker folder:", error);
    }
  };

  const handleToggleFolder = async (folderId: string) => {
    if (!mapId) return;

    const folder = markerFolders.find((f) => f.id === folderId);
    if (folder) {
      // Update frontend state immediately
      const updatedFolder = {
        ...folder,
        isExpanded: !folder.isExpanded,
      };
      updateMarkerFolder(updatedFolder);

      // Sync to database in the background
      try {
        await upsertMarkerFolder({
          variables: {
            id: folder.id,
            name: folder.name,
            markerIds: Array.isArray(folder.markerIds) ? folder.markerIds : [],
            isExpanded: !folder.isExpanded,
            mapId,
          },
        });
      } catch (error) {
        console.error("Failed to update marker folder:", error);
      }
    }
  };

  const handleDropOnFolder = async (folderId: string) => {
    if (!mapId || !draggedMarkerId) return;

    const folder = markerFolders.find((f) => f.id === folderId);
    if (folder) {
      // Update frontend state immediately
      const updatedFolder = {
        ...folder,
        markerIds: [
          ...(Array.isArray(folder.markerIds) ? folder.markerIds : []),
          draggedMarkerId,
        ],
      };
      updateMarkerFolder(updatedFolder);

      // Sync to database if the marker has a real ID (not a temp ID)
      if (!draggedMarkerId.startsWith("temp-")) {
        try {
          await upsertMarkerFolder({
            variables: {
              id: folder.id,
              name: folder.name,
              markerIds: updatedFolder.markerIds,
              isExpanded: folder.isExpanded,
              mapId,
            },
          });
        } catch (error) {
          console.error("Failed to update marker folder:", error);
        }
      }
    }
    setDraggedMarkerId(null);
  };

  const handleRemoveFromFolder = async (folderId: string, markerId: string) => {
    if (!mapId) return;

    const folder = markerFolders.find((f) => f.id === folderId);
    if (folder) {
      // Update frontend state immediately
      const updatedFolder = {
        ...folder,
        markerIds: Array.isArray(folder.markerIds)
          ? folder.markerIds.filter((id) => id !== markerId)
          : [],
      };
      updateMarkerFolder(updatedFolder);

      // Sync to database if the marker has a real ID (not a temp ID)
      if (!markerId.startsWith("temp-")) {
        try {
          await upsertMarkerFolder({
            variables: {
              id: folder.id,
              name: folder.name,
              markerIds: updatedFolder.markerIds,
              isExpanded: folder.isExpanded,
              mapId,
            },
          });
        } catch (error) {
          console.error("Failed to update marker folder:", error);
        }
      }
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
      onClick: handleAddFolder,
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
      <MarkersList
        folders={markerFolders}
        onToggleFolder={handleToggleFolder}
        onDropOnFolder={handleDropOnFolder}
        onEditFolder={handleEditFolder}
        onDeleteFolder={handleDeleteFolder}
        onRemoveFromFolder={handleRemoveFromFolder}
        draggedMarkerId={draggedMarkerId}
        setDraggedMarkerId={setDraggedMarkerId}
      />
    </ControlItemWrapper>
  );
}
