import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  Database,
  DatabaseIcon,
  Ellipsis,
  Folder,
  FolderOpen,
  FolderPlusIcon,
  MapPinIcon,
  Pencil,
  Table,
  Trash2,
} from "lucide-react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
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
import { Separator } from "@/shadcn/ui/separator";
import { cn } from "@/shadcn/utils";
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
  const [folders, setFolders] = useState<
    {
      id: string;
      name: string;
      markerIds: string[];
      isExpanded: boolean;
    }[]
  >([]);

  const createFolder = () => {
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: `New Folder ${folders.length + 1}`,
      markerIds: [],
      isExpanded: true,
    };
    setFolders([...folders, newFolder]);
  };

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
      <MarkersList folders={folders} setFolders={setFolders} />
    </ControlItemWrapper>
  );
}

// Sortable marker item component
const SortableMarkerItem = ({
  marker,
  onEditSubmit,
  onFlyTo,
  handleDeleteMarker,
  activeId,
}: {
  marker: PlacedMarker;
  onEditSubmit: (markerId: string, newLabel: string) => void;
  onFlyTo: () => void;
  handleDeleteMarker: (markerId: string) => void;
  activeId: string | null;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `marker-${marker.id}` });

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(marker.label);

  // Check if this marker is the one being dragged (even outside its container)
  const isCurrentlyDragging = isDragging || activeId === `marker-${marker.id}`;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCurrentlyDragging ? 0.3 : 1,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <li
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 px-1 hover:bg-neutral-100 rounded cursor-grab active:cursor-grabbing"
          onClick={(e) => {
            // Only trigger fly-to if not dragging and not clicking on the delete button
            if (
              !isCurrentlyDragging &&
              !(e.target as HTMLElement).closest("button")
            ) {
              onFlyTo();
            }
          }}
        >
          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onEditSubmit(marker.id, editText);
                setIsEditing(false);
              }}
              className="w-full flex items-center gap-1"
            >
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
                className="flex-1"
              />
              <Button type="submit" size="sm" variant="ghost">
                <Check className="h-3 w-3" />
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5 flex-grow text-sm p-0.5">
              <div
                className="w-2 h-2 rounded-full aspect-square"
                style={{ backgroundColor: mapColors.markers.color }}
              />
              {marker.label}
            </div>
          )}
        </li>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            setEditText(marker.label);
            setIsEditing(true);
          }}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            handleDeleteMarker(marker.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

// Unassigned folder component (behaves like a regular folder)
const UnassignedFolder = ({
  markers,
  onEditSubmit,
  onFlyTo,
  handleDeleteMarker,
  activeId,
  folders,
}: {
  markers: PlacedMarker[];
  onEditSubmit: (markerId: string, newLabel: string) => void;
  onFlyTo: (marker: PlacedMarker) => void;
  handleDeleteMarker: (markerId: string) => void;
  activeId: string | null;
  folders: {
    id: string;
    name: string;
    markerIds: string[];
    isExpanded: boolean;
  }[];
}) => {
  const { setNodeRef } = useDroppable({
    id: "unassigned",
  });

  return (
    <div className="mb-3">
      {folders.length > 0 && (
        <div ref={setNodeRef} className="px-1 py-3">
          <Separator orientation="horizontal" className="h-4 w-full" />
        </div>
      )}

      <div
        className={cn("mt-1 space-y-0.5", folders.length > 0 ? "ml-3" : "ml-1")}
      >
        <SortableContext
          items={markers.map((marker) => `marker-${marker.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {markers.map((marker, index) => (
            <SortableMarkerItem
              key={`${marker.id}-${index}`}
              marker={marker}
              onEditSubmit={onEditSubmit}
              onFlyTo={() => onFlyTo(marker)}
              handleDeleteMarker={handleDeleteMarker}
              activeId={activeId}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

// Folder component
const FolderItem = ({
  folder,
  markers,
  onToggle,
  onEditSubmit,
  onFlyTo,
  handleDeleteMarker,
  activeId,
  isPulsing,
}: {
  folder: {
    id: string;
    name: string;
    markerIds: string[];
    isExpanded: boolean;
  };
  markers: PlacedMarker[];
  onToggle: () => void;
  onEditSubmit: (markerId: string, newLabel: string) => void;
  onFlyTo: (marker: PlacedMarker) => void;
  handleDeleteMarker: (markerId: string) => void;
  activeId: string | null;
  isPulsing: boolean;
}) => {
  const { setNodeRef: setHeaderNodeRef, isOver: isHeaderOver } = useDroppable({
    id: `folder-${folder.id}`,
  });

  const { setNodeRef: setFooterNodeRef } = useDroppable({
    id: `folder-footer-${folder.id}`,
  });

  return (
    <div>
      <div
        ref={setHeaderNodeRef}
        className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-neutral-100 rounded transition-colors ${
          isHeaderOver ? "bg-blue-50" : ""
        } `}
        onClick={onToggle}
      >
        {folder.isExpanded ? (
          <FolderOpen className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Folder className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium flex-1">{folder.name}</span>
        <span
          className={cn(
            "text-xs text-muted-foreground bg-transparent transition-transform duration-300",
            isPulsing ? "animate-pulse  transform scale-110" : ""
          )}
          style={{
            color: isPulsing ? mapColors.markers.color : "",
          }}
        >
          ({markers.length})
        </span>
      </div>

      {folder.isExpanded && (
        <>
          <div className="ml-3 mt-1 space-y-0.5">
            <SortableContext
              items={markers.map((marker) => `marker-${marker.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {markers.map((marker, index) => (
                <SortableMarkerItem
                  key={`${marker.id}-${index}`}
                  marker={marker}
                  onEditSubmit={onEditSubmit}
                  onFlyTo={() => onFlyTo(marker)}
                  handleDeleteMarker={handleDeleteMarker}
                  activeId={activeId}
                />
              ))}
            </SortableContext>
          </div>

          {/* Invisible footer drop zone */}
          <div ref={setFooterNodeRef} className={`h-2 ml-4 mt-1 rounded`} />
        </>
      )}
    </div>
  );
};

// Drag overlay component
const MarkerDragOverlay = ({ marker }: { marker: PlacedMarker }) => {
  return (
    <div
      className="flex items-start gap-2 p-0.5 bg-white border border-blue-300 rounded shadow-lg pointer-events-none"
      style={{
        transform: "translate(0%, -170%)",
        minHeight: "32px", // Preserve minimum height for multi-line markers
        maxHeight: "none", // Allow unlimited height
        whiteSpace: "pre-wrap", // Preserve line breaks
        wordBreak: "break-word", // Allow text to wrap naturally
        resize: "none", // Prevent any resizing
        overflow: "visible", // Show all content
      }}
    >
      <div
        className="w-2 h-2 rounded-full aspect-square flex-shrink-0 mt-1"
        style={{ backgroundColor: mapColors.markers.color }}
      />
      <span className="text-sm leading-relaxed flex-1">{marker.label}</span>
    </div>
  );
};

const MarkersList = ({
  folders,
  setFolders,
}: {
  folders: {
    id: string;
    name: string;
    markerIds: string[];
    isExpanded: boolean;
  }[];
  setFolders: React.Dispatch<
    React.SetStateAction<
      {
        id: string;
        name: string;
        markerIds: string[];
        isExpanded: boolean;
      }[]
    >
  >;
}) => {
  const { viewConfig, mapRef } = useContext(MapContext);
  const { placedMarkers, placedMarkersLoading } =
    useContext(MarkerAndTurfContext);
  const { selectedDataSourceId, handleDataSourceSelect } =
    useContext(TableContext);
  const { getMarkerDataSources } = useContext(DataSourcesContext);

  // Simple state structure: treat unassigned as a special "unassigned" folder
  const [markerOrganization, setMarkerOrganization] = useState<{
    unassigned: string[];
    folders: Record<string, string[]>;
  }>({ unassigned: [], folders: {} });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pulsingFolderId, setPulsingFolderId] = useState<string | null>(null);

  const markerDataSources = getMarkerDataSources();

  // Get all markers from context
  const allMarkers = useMemo(
    () => placedMarkers.filter((marker) => marker && marker.id),
    [placedMarkers]
  );

  // Get markers by IDs
  const getMarkersByIds = useCallback(
    (ids: string[]) => {
      return ids
        .map((id) => allMarkers.find((marker) => marker.id === id))
        .filter(Boolean) as PlacedMarker[];
    },
    [allMarkers]
  );

  // Get unassigned markers
  const getUnassignedMarkers = useCallback(() => {
    return getMarkersByIds(markerOrganization.unassigned);
  }, [getMarkersByIds, markerOrganization.unassigned]);

  // Get markers in a folder
  const getMarkersInFolder = useCallback(
    (folderId: string) => {
      const folderMarkerIds = markerOrganization.folders[folderId] || [];
      return getMarkersByIds(folderMarkerIds);
    },
    [markerOrganization.folders, getMarkersByIds]
  );

  // Helper functions
  const toggleFolder = (folderId: string) => {
    setFolders(
      folders.map((folder) =>
        folder.id === folderId
          ? { ...folder, isExpanded: !folder.isExpanded }
          : folder
      )
    );
  };

  const handleEditMarker = useCallback((markerId: string, newLabel: string) => {
    // This would update the marker in the context
    console.log("Edit marker:", markerId, newLabel);
  }, []);

  const handleFlyToMarker = useCallback(
    (marker: PlacedMarker) => {
      const map = mapRef?.current;
      if (map) {
        map.flyTo({
          center: marker.point,
          zoom: 12,
        });
      }
    },
    [mapRef]
  );

  const handleDeleteMarker = useCallback((markerId: string) => {
    setMarkerOrganization((prev) => {
      const newUnassigned = prev.unassigned.filter((id) => id !== markerId);
      const newFolders = { ...prev.folders };

      // Remove from all folders
      Object.keys(newFolders).forEach((folderId) => {
        newFolders[folderId] = newFolders[folderId].filter(
          (id) => id !== markerId
        );
      });

      return {
        unassigned: newUnassigned,
        folders: newFolders,
      };
    });
  }, []);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update marker organization when placedMarkers changes
  useEffect(() => {
    const newMarkerIds = allMarkers.map((marker) => marker.id);
    setMarkerOrganization((prev) => {
      // Keep existing organization but add any new markers to unassigned
      const existingIds = new Set([
        ...prev.unassigned,
        ...Object.values(prev.folders).flat(),
      ]);

      const newUnassigned = [
        ...prev.unassigned,
        ...newMarkerIds.filter((id) => !existingIds.has(id)),
      ];

      return {
        unassigned: newUnassigned,
        folders: prev.folders,
      };
    });
  }, [allMarkers]);

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeMarkerId = active.id.toString().replace("marker-", "");

      // Check if dragging over a container (folder header, folder footer, or unassigned)
      if (over.id.toString().startsWith("folder-")) {
        let folderId: string;

        // Handle both header and footer IDs
        if (over.id.toString().startsWith("folder-footer-")) {
          folderId = over.id.toString().replace("folder-footer-", "");
        } else {
          folderId = over.id.toString().replace("folder-", "");
        }

        // Move marker to folder immediately
        setMarkerOrganization((prev) => {
          // Remove from current location
          const newUnassigned = prev.unassigned.filter(
            (id) => id !== activeMarkerId
          );
          const newFolders = { ...prev.folders };
          Object.keys(newFolders).forEach((folderId) => {
            newFolders[folderId] = newFolders[folderId].filter(
              (id) => id !== activeMarkerId
            );
          });

          // Add to target folder
          if (!newFolders[folderId]) {
            newFolders[folderId] = [];
          }
          newFolders[folderId] = [...newFolders[folderId], activeMarkerId];

          return {
            unassigned: newUnassigned,
            folders: newFolders,
          };
        });
      } else if (over.id === "unassigned") {
        // Move marker to unassigned immediately
        setMarkerOrganization((prev) => {
          // Remove from all folders
          const newFolders = { ...prev.folders };
          Object.keys(newFolders).forEach((folderId) => {
            newFolders[folderId] = newFolders[folderId].filter(
              (id) => id !== activeMarkerId
            );
          });

          // Add to unassigned if not already there
          const newUnassigned = prev.unassigned.includes(activeMarkerId)
            ? prev.unassigned
            : [...prev.unassigned, activeMarkerId];

          return {
            unassigned: newUnassigned,
            folders: newFolders,
          };
        });
      }
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      let targetFolderId: string | null = null;

      if (over && active.id !== over.id) {
        console.log(
          "DragEnd - active:",
          active.id,
          "over:",
          over?.id,
          "over type:",
          typeof over?.id
        );
        const activeMarkerId = active.id.toString().replace("marker-", "");

        // Handle dropping on folder header
        if (over.id.toString().startsWith("folder-")) {
          const folderId = over.id.toString().replace("folder-", "");
          targetFolderId = folderId;
        }
        // Handle reordering within the same container
        else if (
          active.id.toString().startsWith("marker-") &&
          over.id.toString().startsWith("marker-")
        ) {
          const overMarkerId = over.id.toString().replace("marker-", "");

          // Find which container the markers are in
          const activeInUnassigned =
            markerOrganization.unassigned.includes(activeMarkerId);
          const overInUnassigned =
            markerOrganization.unassigned.includes(overMarkerId);

          if (activeInUnassigned && overInUnassigned) {
            // Reordering within unassigned
            const oldIndex =
              markerOrganization.unassigned.indexOf(activeMarkerId);
            const newIndex =
              markerOrganization.unassigned.indexOf(overMarkerId);

            if (oldIndex !== -1 && newIndex !== -1) {
              const reorderedUnassigned = arrayMove(
                markerOrganization.unassigned,
                oldIndex,
                newIndex
              );
              setMarkerOrganization((prev) => ({
                ...prev,
                unassigned: reorderedUnassigned,
              }));
            }
          } else {
            // Find which folder they're in
            const activeFolderId = Object.keys(markerOrganization.folders).find(
              (folderId) =>
                markerOrganization.folders[folderId].includes(activeMarkerId)
            );
            const overFolderId = Object.keys(markerOrganization.folders).find(
              (folderId) =>
                markerOrganization.folders[folderId].includes(overMarkerId)
            );

            if (
              activeFolderId &&
              overFolderId &&
              activeFolderId === overFolderId
            ) {
              // Reordering within the same folder
              const oldIndex =
                markerOrganization.folders[activeFolderId].indexOf(
                  activeMarkerId
                );
              const newIndex =
                markerOrganization.folders[activeFolderId].indexOf(
                  overMarkerId
                );

              if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedFolder = arrayMove(
                  markerOrganization.folders[activeFolderId],
                  oldIndex,
                  newIndex
                );
                setMarkerOrganization((prev) => ({
                  ...prev,
                  folders: {
                    ...prev.folders,
                    [activeFolderId]: reorderedFolder,
                  },
                }));

                // Trigger pulse animation for reordering within folder
                targetFolderId = activeFolderId;
              }
            } else {
              // Moving between different containers
              // Set target folder for pulse animation
              if (overInUnassigned) {
                targetFolderId = "unassigned";
              } else if (overFolderId) {
                targetFolderId = overFolderId;
              }

              // Remove from current container
              setMarkerOrganization((prev) => {
                const newUnassigned = prev.unassigned.filter(
                  (id) => id !== activeMarkerId
                );
                const newFolders = { ...prev.folders };
                Object.keys(newFolders).forEach((folderId) => {
                  newFolders[folderId] = newFolders[folderId].filter(
                    (id) => id !== activeMarkerId
                  );
                });

                // Add to target container
                if (overInUnassigned) {
                  // Moving to unassigned
                  const overIndex = newUnassigned.indexOf(overMarkerId);
                  if (overIndex !== -1) {
                    newUnassigned.splice(overIndex, 0, activeMarkerId);
                  } else {
                    newUnassigned.push(activeMarkerId);
                  }
                } else if (overFolderId) {
                  // Moving to a folder
                  if (!newFolders[overFolderId]) {
                    newFolders[overFolderId] = [];
                  }
                  const overIndex =
                    newFolders[overFolderId].indexOf(overMarkerId);
                  if (overIndex !== -1) {
                    newFolders[overFolderId].splice(
                      overIndex,
                      0,
                      activeMarkerId
                    );
                  } else {
                    newFolders[overFolderId].push(activeMarkerId);
                  }
                }

                return {
                  unassigned: newUnassigned,
                  folders: newFolders,
                };
              });
            }
          }
        }
      }

      // Trigger pulse animation if item was moved to a different container
      console.log(
        "targetFolderId:",
        targetFolderId,
        "pulsingFolderId:",
        pulsingFolderId
      );
      if (targetFolderId) {
        setPulsingFolderId(targetFolderId);
        setTimeout(() => setPulsingFolderId(null), 600);
      }

      setActiveId(null);
    },
    [markerOrganization]
  );

  // Get active marker for drag overlay
  const getActiveMarker = () => {
    if (!activeId) return null;
    const markerId = activeId.replace("marker-", "");
    return allMarkers.find((marker) => marker.id === markerId) || null;
  };

  return (
    <div className="relative">
      {placedMarkersLoading && <Loading blockInteraction />}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          className={`${viewConfig.showLocations ? "opacity-100" : "opacity-50"} `}
        >
          {/* Folders */}
          {folders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              markers={getMarkersInFolder(folder.id)}
              onToggle={() => toggleFolder(folder.id)}
              onEditSubmit={handleEditMarker}
              onFlyTo={handleFlyToMarker}
              handleDeleteMarker={handleDeleteMarker}
              activeId={activeId}
              isPulsing={
                pulsingFolderId !== null && pulsingFolderId !== "unassigned"
              }
            />
          ))}

          {/* Unassigned markers */}
          <div>
            <UnassignedFolder
              markers={getUnassignedMarkers()}
              onEditSubmit={handleEditMarker}
              onFlyTo={handleFlyToMarker}
              handleDeleteMarker={handleDeleteMarker}
              activeId={activeId}
              folders={folders}
            />
          </div>

          {/* Data sources */}
          {markerDataSources.length > 0 && (
            <div className="gap-2 p-2 mt-3 bg-muted rounded">
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
        </div>

        <DragOverlay dropAnimation={null} adjustScale={false}>
          {activeId && getActiveMarker() && (
            <MarkerDragOverlay marker={getActiveMarker() as PlacedMarker} />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
