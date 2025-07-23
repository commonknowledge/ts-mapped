import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Database,
  Folder,
  FolderOpen,
  Pencil,
  Table,
  Trash2,
} from "lucide-react";
import { useCallback, useContext, useState } from "react";
import { MarkerFolder, PlacedMarker } from "@/__generated__/types";
import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { TableContext } from "@/app/(private)/map/[id]/context/TableContext";
import { mapColors } from "@/app/(private)/map/[id]/styles";
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
import { FolderContextMenu } from "./FolderContextMenu";
import { createPortal } from "react-dom";

// Types for drag and drop state
interface DragState {
  activeId: string | null;
  overId: string | null;
  activeType: "folder" | "marker" | null;
}

// Custom hook for editing state
function useEditingState() {
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editText, setEditText] = useState("");

  const startEditFolder = useCallback(
    (folderId: string, currentName: string) => {
      setEditingFolderId(folderId);
      setEditName(currentName);
    },
    []
  );

  const startEditMarker = useCallback(
    (markerId: string, currentText: string) => {
      setEditingMarkerId(markerId);
      setEditText(currentText);
    },
    []
  );

  const clearEditing = useCallback(() => {
    setEditingFolderId(null);
    setEditingMarkerId(null);
    setEditName("");
    setEditText("");
  }, []);

  return {
    editingFolderId,
    editingMarkerId,
    editName,
    editText,
    setEditName,
    setEditText,
    startEditFolder,
    startEditMarker,
    clearEditing,
  };
}

// Utility functions for marker operations
const MarkerUtils = {
  getMarkersInFolder: (folder: MarkerFolder, placedMarkers: PlacedMarker[]) => {
    const markerIds = Array.isArray(folder.markerIds) ? folder.markerIds : [];
    return placedMarkers.filter((marker) => markerIds.includes(marker.id));
  },

  getUnassignedMarkers: (
    folders: MarkerFolder[],
    placedMarkers: PlacedMarker[]
  ) => {
    const assignedMarkerIds = folders.flatMap((folder) =>
      Array.isArray(folder.markerIds) ? folder.markerIds : []
    );
    return placedMarkers.filter(
      (marker) => !assignedMarkerIds.includes(marker.id)
    );
  },

  findFolderByMarkerId: (folders: MarkerFolder[], markerId: string) => {
    return folders.find(
      (folder) =>
        Array.isArray(folder.markerIds) && folder.markerIds.includes(markerId)
    );
  },

  calculateMarkerPositions: (markers: PlacedMarker[]) => {
    return markers.map((marker, index) => ({
      id: marker.id,
      position: (index + 1) * 1000,
    }));
  },

  calculateFolderPositions: (folders: MarkerFolder[]) => {
    return folders.map((folder, index) => ({
      id: folder.id,
      position: (index + 1) * 1000,
    }));
  },
};

// Droppable zone for folders
function DroppableFolders({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: "droppable-folders",
  });

  return <div ref={setNodeRef}>{children}</div>;
}

// Droppable zone for unassigned markers
function DroppableUnassignedMarkers({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: "droppable-unassigned",
  });

  return <div ref={setNodeRef}>{children}</div>;
}

// Sortable marker component
function SortableMarkerItem({
  marker,
  isEditing,
  editText,
  onEdit,
  onEditSubmit,
  onFlyTo,
  startEditMarker,
  deletePlacedMarker,
}: {
  marker: PlacedMarker;
  isEditing: boolean;
  editText: string;
  onEdit: (text: string) => void;
  onEditSubmit: () => void;
  onFlyTo: () => void;
  startEditMarker: (markerId: string, markerLabel: string) => void;
  deletePlacedMarker: (markerId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `marker-${marker.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className="relative flex items-center gap-2 p-1 hover:bg-neutral-100 rounded cursor-grab active:cursor-grabbing"
        >
          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onEditSubmit();
              }}
              className="w-full flex items-center p-0"
            >
              <Input
                value={editText}
                onChange={(e) => onEdit(e.target.value)}
                autoFocus
              />
              <Button className="" type="submit" variant="link">
                <Check className="h-4 w-4 text-green-500" />
              </Button>
            </form>
          ) : (
            <div
              className="flex pl-1 items-center gap-1.5 flex-grow cursor-pointer text-sm"
              onClick={onFlyTo}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: mapColors.markers.color }}
              />
              {marker.label}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            startEditMarker(marker.id, marker.label);
          }}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            deletePlacedMarker(marker.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// Sortable folder component
function SortableFolderItem({
  folder,
  isEditing,
  editName,
  markersInFolder,
  onToggle,
  onEditChange,
  onEditSubmit,
  onEditKeyDown,
  onDelete,
  onStartEdit,
  children,
}: {
  folder: MarkerFolder;
  isEditing: boolean;
  editName: string;
  markersInFolder: PlacedMarker[];
  onToggle: () => void;
  onEditChange: (name: string) => void;
  onEditSubmit: () => void;
  onEditKeyDown: (e: React.KeyboardEvent) => void;
  onDelete: () => void;
  onStartEdit: () => void;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `folder-${folder.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li className="list-none">
      <FolderContextMenu
        folder={folder}
        onDelete={onDelete}
        onStartEdit={onStartEdit}
      >
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className={`flex items-center gap-1 pl-0 p-1 rounded transition-all cursor-grab active:cursor-grabbing ${
            isEditing
              ? "bg-neutral-100"
              : isDragging
                ? "bg-blue-50 border border-blue-300"
                : "hover:bg-neutral-100"
          }`}
          onClick={onToggle}
          title="Drag to reorder folders, or drop markers here"
        >
          {folder.isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          {folder.isExpanded ? (
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Folder className="w-4 h-4 text-muted-foreground" />
          )}
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={onEditKeyDown}
              onBlur={onEditSubmit}
              className="text-sm font-medium flex-1 min-w-0"
              autoFocus
            />
          ) : (
            <span className="text-sm font-medium">{folder.name}</span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            ({markersInFolder.length})
          </span>
        </div>
      </FolderContextMenu>
      {children}
    </li>
  );
}

// Drag overlay components
function MarkerDragOverlay({ marker }: { marker: PlacedMarker }) {
  return (
    <div className="flex items-center gap-2 p-1 bg-white border border-blue-300 rounded shadow-lg">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: mapColors.markers.color }}
      />
      <span className="text-sm">{marker.label}</span>
    </div>
  );
}

function FolderDragOverlay({ folder }: { folder: MarkerFolder }) {
  return (
    <div className="flex items-center gap-1 pl-0 p-1 bg-white border border-blue-300 rounded shadow-lg">
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
      <Folder className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm font-medium">{folder.name}</span>
    </div>
  );
}

// Main MarkersList component
export default function MarkersList({
  folders,
  onToggleFolder,
  onDropOnFolder,
  onEditFolder,
  onDeleteFolder,
  onReorderMarkers,
  onReorderFolders,
  onRemoveFromFolder,
}: {
  folders: MarkerFolder[];
  onToggleFolder: (folderId: string) => void;
  onDropOnFolder: (folderId: string, markerId: string) => void;
  onEditFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRemoveFromFolder: (folderId: string, markerId: string) => void;
  onReorderMarkers: (
    markerPositions: { id: string; position: number }[]
  ) => void;
  onReorderFolders: (
    folderPositions: { id: string; position: number }[]
  ) => void;
}) {
  // Context hooks
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

  // Custom hooks
  const editingState = useEditingState();

  // Local state
  const [dragState, setDragState] = useState<DragState>({
    activeId: null,
    overId: null,
    activeType: null,
  });

  // Derived state
  const markerDataSources = getMarkerDataSources();
  const unassignedMarkers = MarkerUtils.getUnassignedMarkers(
    folders,
    placedMarkers
  );

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0,
      },
    })
  );

  // Event handlers
  const handleEditMarker = useCallback(
    (markerId: string) => {
      const existingMarker = placedMarkers.find((m) => m.id === markerId);
      if (existingMarker) {
        updatePlacedMarker({ ...existingMarker, label: editingState.editText });
        editingState.clearEditing();
      }
    },
    [placedMarkers, updatePlacedMarker, editingState]
  );

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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;

    console.log("🚀 handleDragStart called:", {
      activeId,
      activeType: active.data.current?.type,
    });

    if (activeId.startsWith("folder-")) {
      setDragState({
        activeId,
        overId: null,
        activeType: "folder",
      });
      console.log("📁 Started dragging folder");
    } else if (activeId.startsWith("marker-")) {
      setDragState({
        activeId,
        overId: null,
        activeType: "marker",
      });
      console.log(
        "📍 Started dragging marker:",
        activeId.replace("marker-", "")
      );
    }
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over, active } = event;

      console.log("🔍 handleDragOver called:", {
        active: active.id,
        over: over?.id,
        activeType: active.data.current?.type,
        overType: over?.data.current?.type,
      });

      if (over) {
        setDragState((prev) => {
          return {
            ...prev,
            overId: over.id as string,
          };
        });

        // Handle moving items between containers during drag
        if (active.id.toString().startsWith("marker-")) {
          const activeMarkerId = active.id.toString().replace("marker-", "");
          const overId = over.id.toString();

          console.log("🎯 Processing marker drag:", {
            activeMarkerId,
            overId,
            activeId: active.id.toString(),
          });

          // Find source container (where the marker currently is)
          const sourceFolder = MarkerUtils.findFolderByMarkerId(
            folders,
            activeMarkerId
          );

          console.log(
            "📂 Source folder:",
            sourceFolder?.name || "None (unassigned)"
          );

          // Find destination container (where the marker is being dropped)
          let destinationFolder = null;
          if (overId.startsWith("folder-")) {
            // Dropping directly on a folder
            destinationFolder = folders.find(
              (f) => `folder-${f.id}` === overId
            );
            console.log("🎯 Dropping on folder:", destinationFolder?.name);
          } else if (overId.startsWith("marker-")) {
            // Dropping on another marker - find that marker's folder
            const overMarkerId = overId.replace("marker-", "");
            destinationFolder = MarkerUtils.findFolderByMarkerId(
              folders,
              overMarkerId
            );
            console.log(
              "🎯 Dropping on marker in folder:",
              destinationFolder?.name || "None (unassigned)"
            );
          } else if (overId === "droppable-unassigned") {
            // Dropping on the unassigned markers droppable zone - this means moving to the top level
            destinationFolder = null;
            console.log(
              "🎯 Dropping on unassigned droppable zone (staying at top level)"
            );
          }

          console.log(
            "🎯 Destination folder:",
            destinationFolder?.name || "None (unassigned)"
          );

          // If moving between different containers, update immediately
          if (sourceFolder && !destinationFolder) {
            // Moving from folder to top level (unassigned)
            console.log(
              "🔄 Moving from folder to top level:",
              sourceFolder.name
            );
            onRemoveFromFolder(sourceFolder.id, activeMarkerId);
          } else if (!sourceFolder && destinationFolder) {
            // Moving from top level to folder
            console.log(
              "🔄 Moving from top level to folder:",
              destinationFolder.name
            );
            onDropOnFolder(destinationFolder.id, activeMarkerId);
          } else if (
            sourceFolder &&
            destinationFolder &&
            sourceFolder.id !== destinationFolder.id
          ) {
            // Moving between different folders
            console.log(
              "🔄 Moving between folders:",
              sourceFolder.name,
              "->",
              destinationFolder.name
            );
            onRemoveFromFolder(sourceFolder.id, activeMarkerId);
            onDropOnFolder(destinationFolder.id, activeMarkerId);
          } else {
            console.log(
              "⏭️ No container movement needed (same container or no change)"
            );
          }
        }
      }
    },
    [folders, onRemoveFromFolder, onDropOnFolder]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) {
        setDragState({ activeId: null, overId: null, activeType: null });
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;

      // Early return if dropping on itself
      if (activeId === overId) {
        setDragState({ activeId: null, overId: null, activeType: null });
        return;
      }

      // Reordering folders
      if (activeId.startsWith("folder-") && overId.startsWith("folder-")) {
        const activeFolderId = activeId.replace("folder-", "");
        const overFolderId = overId.replace("folder-", "");

        if (activeFolderId !== overFolderId) {
          const activeIndex = folders.findIndex((f) => f.id === activeFolderId);
          const overIndex = folders.findIndex((f) => f.id === overFolderId);

          if (activeIndex !== -1 && overIndex !== -1) {
            const newFolders = arrayMove(folders, activeIndex, overIndex);
            onReorderFolders(MarkerUtils.calculateFolderPositions(newFolders));
          }
        }
        setDragState({ activeId: null, overId: null, activeType: null });
        return;
      }

      // Handle marker reordering within the same container
      if (activeId.startsWith("marker-") && overId.startsWith("marker-")) {
        const activeMarkerId = activeId.replace("marker-", "");
        const overMarkerId = overId.replace("marker-", "");

        if (activeMarkerId !== overMarkerId) {
          const activeMarker = placedMarkers.find(
            (m) => m.id === activeMarkerId
          );
          const overMarker = placedMarkers.find((m) => m.id === overMarkerId);

          if (activeMarker && overMarker) {
            const activeFolder = MarkerUtils.findFolderByMarkerId(
              folders,
              activeMarkerId
            );
            const overFolder = MarkerUtils.findFolderByMarkerId(
              folders,
              overMarkerId
            );

            if (
              activeFolder &&
              overFolder &&
              activeFolder.id === overFolder.id
            ) {
              // Reordering within the same folder
              const folderMarkers = MarkerUtils.getMarkersInFolder(
                activeFolder,
                placedMarkers
              );
              const activeIndex = folderMarkers.findIndex(
                (m) => m.id === activeMarkerId
              );
              const overIndex = folderMarkers.findIndex(
                (m) => m.id === overMarkerId
              );

              if (activeIndex !== -1 && overIndex !== -1) {
                const newMarkers = arrayMove(
                  folderMarkers,
                  activeIndex,
                  overIndex
                );
                onReorderMarkers(
                  MarkerUtils.calculateMarkerPositions(newMarkers)
                );
              }
            } else if (!activeFolder && !overFolder) {
              // Reordering unassigned markers
              const activeIndex = unassignedMarkers.findIndex(
                (m) => m.id === activeMarkerId
              );
              const overIndex = unassignedMarkers.findIndex(
                (m) => m.id === overMarkerId
              );

              if (activeIndex !== -1 && overIndex !== -1) {
                const newMarkers = arrayMove(
                  unassignedMarkers,
                  activeIndex,
                  overIndex
                );
                onReorderMarkers(
                  MarkerUtils.calculateMarkerPositions(newMarkers)
                );
              }
            }
          }
        }
      }

      setDragState({ activeId: null, overId: null, activeType: null });
    },
    [
      folders,
      placedMarkers,
      unassignedMarkers,
      onReorderFolders,
      onReorderMarkers,
    ]
  );

  const handleEditFolderSubmit = useCallback(
    (folderId: string) => {
      if (editingState.editName.trim()) {
        onEditFolder(folderId, editingState.editName.trim());
      }
      editingState.clearEditing();
    },
    [editingState, onEditFolder]
  );

  const handleEditFolderKeyDown = useCallback(
    (e: React.KeyboardEvent, folderId: string) => {
      if (e.key === "Enter") {
        handleEditFolderSubmit(folderId);
      } else if (e.key === "Escape") {
        editingState.clearEditing();
      }
    },
    [handleEditFolderSubmit, editingState]
  );

  // Get active item for drag overlay
  const getActiveItem = () => {
    if (!dragState.activeId) return null;

    if (dragState.activeType === "folder") {
      const folderId = dragState.activeId.replace("folder-", "");
      return folders.find((f) => f.id === folderId);
    } else if (dragState.activeType === "marker") {
      const markerId = dragState.activeId.replace("marker-", "");
      return placedMarkers.find((m) => m.id === markerId);
    }

    return null;
  };

  // Create sortable items arrays
  const folderItems = folders.map((folder) => `folder-${folder.id}`);

  return (
    <>
      <div className="relative">
        {placedMarkersLoading && <Loading blockInteraction />}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <ul
            className={`${viewConfig.showLocations ? "opacity-100" : "opacity-50"} space-y-1`}
          >
            {/* <DroppableFolders> */}
              <SortableContext
                items={folderItems}
                strategy={verticalListSortingStrategy}
              >
                {/* Folders */}
                {folders.map((folder) => {
                  const markersInFolder = MarkerUtils.getMarkersInFolder(
                    folder,
                    placedMarkers
                  );
                  const isEditing = editingState.editingFolderId === folder.id;

                  return (
                    <SortableFolderItem
                      key={folder.id}
                      folder={folder}
                      isEditing={isEditing}
                      editName={editingState.editName}
                      markersInFolder={markersInFolder}
                      onToggle={() => {
                        if (!isEditing) {
                          onToggleFolder(folder.id);
                        }
                      }}
                      onEditChange={editingState.setEditName}
                      onEditSubmit={() => handleEditFolderSubmit(folder.id)}
                      onEditKeyDown={(e) =>
                        handleEditFolderKeyDown(e, folder.id)
                      }
                      onDelete={() => onDeleteFolder(folder.id)}
                      onStartEdit={() =>
                        editingState.startEditFolder(folder.id, folder.name)
                      }
                    >
                      {/* Folder contents */}
                      {folder.isExpanded && markersInFolder.length > 0 && (
                        <div className="ml-4 mt-1">
                          <SortableContext
                            items={markersInFolder.map(
                              (marker) => `marker-${marker.id}`
                            )}
                            strategy={verticalListSortingStrategy}
                          >
                            {markersInFolder.map((marker) => (
                              <div key={marker.id} className="pl-2">
                                <SortableMarkerItem
                                  marker={marker}
                                  isEditing={
                                    editingState.editingMarkerId === marker.id
                                  }
                                  editText={editingState.editText}
                                  onEdit={editingState.setEditText}
                                  onEditSubmit={() =>
                                    handleEditMarker(marker.id)
                                  }
                                  startEditMarker={editingState.startEditMarker}
                                  deletePlacedMarker={deletePlacedMarker}
                                  onFlyTo={() => handleFlyToMarker(marker)}
                                />
                              </div>
                            ))}
                          </SortableContext>
                        </div>
                      )}
                    </SortableFolderItem>
                  );
                })}
              </SortableContext>
            {/* </DroppableFolders> */}

            <DroppableUnassignedMarkers>
              {/* Unassigned markers */}
              {unassignedMarkers.length > 0 && (
                <SortableContext
                  items={unassignedMarkers.map(
                    (marker) => `marker-${marker.id}`
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  {unassignedMarkers.map((marker) => (
                    <li key={marker.id} className="list-none">
                      <SortableMarkerItem
                        marker={marker}
                        isEditing={editingState.editingMarkerId === marker.id}
                        editText={editingState.editText}
                        onEdit={editingState.setEditText}
                        onEditSubmit={() => handleEditMarker(marker.id)}
                        onFlyTo={() => handleFlyToMarker(marker)}
                        deletePlacedMarker={deletePlacedMarker}
                        startEditMarker={editingState.startEditMarker}
                      />
                    </li>
                  ))}
                </SortableContext>
              )}
            </DroppableUnassignedMarkers>

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
          </ul>
          {createPortal(
            <DragOverlay dropAnimation={null}>
              {getActiveItem() ? (
                dragState.activeType === "folder" ? (
                  <FolderDragOverlay folder={getActiveItem() as MarkerFolder} />
                ) : (
                  <MarkerDragOverlay marker={getActiveItem() as PlacedMarker} />
                )
              ) : null}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      </div>
    </>
  );
}
