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

// Types for drag and drop state
interface DragState {
  markerId: string | null;
  folderId: string | null;
  overMarkerId: string | null;
  overPosition: "before" | "after" | null;
  overFolderId: string | null;
}

// Custom hook for drag and drop state management
function useDragState() {
  const [dragState, setDragState] = useState<DragState>({
    markerId: null,
    folderId: null,
    overMarkerId: null,
    overPosition: null,
    overFolderId: null,
  });

  const setDraggedMarkerId = useCallback((id: string | null) => {
    setDragState((prev) => ({ ...prev, markerId: id }));
  }, []);

  const setDraggedFolderId = useCallback((id: string | null) => {
    setDragState((prev) => ({ ...prev, folderId: id }));
  }, []);

  const setDragOverMarker = useCallback(
    (markerId: string | null, position: "before" | "after" | null) => {
      setDragState((prev) => ({
        ...prev,
        overMarkerId: markerId,
        overPosition: position,
      }));
    },
    []
  );

  const setDragOverFolder = useCallback((folderId: string | null) => {
    setDragState((prev) => ({ ...prev, overFolderId: folderId }));
  }, []);

  const clearDragState = useCallback(() => {
    setDragState({
      markerId: null,
      folderId: null,
      overMarkerId: null,
      overPosition: null,
      overFolderId: null,
    });
  }, []);

  return {
    ...dragState,
    setDraggedMarkerId,
    setDraggedFolderId,
    setDragOverMarker,
    setDragOverFolder,
    clearDragState,
  };
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

// Component for rendering a single marker
function MarkerItem({
  marker,
  isDragged,
  isDragOver,
  dragPosition,
  isEditing,
  editText,
  onEdit,
  onEditSubmit,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onContextMenu,
  onFlyTo,
}: {
  marker: PlacedMarker;
  isDragged: boolean;
  isDragOver: boolean;
  dragPosition: "before" | "after" | null;
  isEditing: boolean;
  editText: string;
  onEdit: (text: string) => void;
  onEditSubmit: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onContextMenu: () => void;
  onFlyTo: () => void;
}) {
  return (
    <div
      className={`relative flex items-center gap-2 p-1 hover:bg-neutral-100 rounded ${
        isDragged ? "opacity-50" : ""
      }`}
      onContextMenu={onContextMenu}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drop indicator lines */}
      {isDragOver && dragPosition === "before" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
      )}
      {isDragOver && dragPosition === "after" && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
      )}

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
  );
}

// Component for rendering a folder
function FolderItem({
  folder,
  isEditing,
  editName,
  isDragged,
  markersInFolder,
  onToggle,
  onEditChange,
  onEditSubmit,
  onEditKeyDown,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onDelete,
  onStartEdit,
  children,
}: {
  folder: MarkerFolder;
  isEditing: boolean;
  editName: string;
  isDragged: boolean;
  markersInFolder: PlacedMarker[];
  onToggle: () => void;
  onEditChange: (name: string) => void;
  onEditSubmit: () => void;
  onEditKeyDown: (e: React.KeyboardEvent) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDelete: () => void;
  onStartEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <li className="list-none">
      <FolderContextMenu
        folder={folder}
        onDelete={onDelete}
        onStartEdit={onStartEdit}
      >
        <div
          className={`flex items-center gap-1 pl-0 p-1 rounded transition-all ${
            isEditing
              ? "bg-neutral-100"
              : isDragged
                ? "opacity-50 bg-blue-50 border border-blue-300"
                : "hover:bg-neutral-100 cursor-pointer"
          }`}
          onClick={onToggle}
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
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

// Main MarkersList component
export default function MarkersList({
  folders,
  onToggleFolder,
  onDropOnFolder,
  onDropOnFolderAtPosition,
  onEditFolder,
  onDeleteFolder,
  onRemoveFromFolder,
  onReorderMarkers,
  onReorderFolders,
}: {
  folders: MarkerFolder[];
  onToggleFolder: (folderId: string) => void;
  onDropOnFolder: (folderId: string) => void;
  onDropOnFolderAtPosition: (
    folderId: string,
    markerId: string,
    targetPosition: number
  ) => void;
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
  const dragState = useDragState();
  const editingState = useEditingState();

  // Local state
  const [contextMenuMarkerId, setContextMenuMarkerId] = useState<string | null>(
    null
  );

  // Derived state
  const markerDataSources = getMarkerDataSources();
  const unassignedMarkers = MarkerUtils.getUnassignedMarkers(
    folders,
    placedMarkers
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

  const handleMarkerDragStart = useCallback(
    (markerId: string) => {
      if (dragState.folderId) return; // Don't start marker drag if dragging folder
      dragState.setDraggedMarkerId(markerId);
    },
    [dragState]
  );

  const handleFolderDragStart = useCallback(
    (folderId: string) => {
      dragState.setDraggedFolderId(folderId);
      dragState.setDraggedMarkerId(null); // Prevent marker drag during folder drag
    },
    [dragState]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, markerId: string) => {
      e.preventDefault();
      if (dragState.markerId && dragState.markerId !== markerId) {
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseY = e.clientY;
        const markerCenterY = rect.top + rect.height / 2;
        const position = mouseY < markerCenterY ? "before" : "after";
        dragState.setDragOverMarker(markerId, position);
      }
    },
    [dragState]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, targetMarkerId: string) => {
      e.preventDefault();
      if (!dragState.markerId || dragState.markerId === targetMarkerId) {
        dragState.clearDragState();
        return;
      }

      const draggedMarker = placedMarkers.find(
        (m) => m.id === dragState.markerId
      );
      const targetMarker = placedMarkers.find((m) => m.id === targetMarkerId);
      if (!draggedMarker || !targetMarker) {
        dragState.clearDragState();
        return;
      }

      const targetFolder = MarkerUtils.findFolderByMarkerId(
        folders,
        targetMarkerId
      );
      const draggedMarkerFolder = MarkerUtils.findFolderByMarkerId(
        folders,
        dragState.markerId
      );

      if (targetFolder) {
        // Target is in a folder
        if (draggedMarkerFolder?.id === targetFolder.id) {
          // Reordering within the same folder
          const contextMarkers = MarkerUtils.getMarkersInFolder(
            targetFolder,
            placedMarkers
          );
          const markersWithoutDragged = contextMarkers.filter(
            (m) => m.id !== dragState.markerId
          );
          const targetIndex = markersWithoutDragged.findIndex(
            (m) => m.id === targetMarkerId
          );
          const adjustedTargetIndex =
            dragState.overPosition === "after" ? targetIndex + 1 : targetIndex;

          const newOrder = [
            ...markersWithoutDragged.slice(0, adjustedTargetIndex),
            draggedMarker,
            ...markersWithoutDragged.slice(adjustedTargetIndex),
          ];

          onReorderMarkers(MarkerUtils.calculateMarkerPositions(newOrder));
        } else {
          // Moving to folder at specific position
          const contextMarkers = MarkerUtils.getMarkersInFolder(
            targetFolder,
            placedMarkers
          );
          const targetIndex = contextMarkers.findIndex(
            (m) => m.id === targetMarkerId
          );
          const adjustedTargetIndex =
            dragState.overPosition === "after" ? targetIndex + 1 : targetIndex;
          onDropOnFolderAtPosition(
            targetFolder.id,
            dragState.markerId,
            adjustedTargetIndex
          );
        }
      } else {
        // Target is unassigned
        if (draggedMarkerFolder) {
          // Moving from folder to unassigned
          const targetIndex = unassignedMarkers.findIndex(
            (m) => m.id === targetMarkerId
          );
          const adjustedTargetIndex =
            dragState.overPosition === "after" ? targetIndex + 1 : targetIndex;

          onRemoveFromFolder(draggedMarkerFolder.id, dragState.markerId);

          const newOrder = [
            ...unassignedMarkers.slice(0, adjustedTargetIndex),
            draggedMarker,
            ...unassignedMarkers.slice(adjustedTargetIndex),
          ];

          onReorderMarkers(MarkerUtils.calculateMarkerPositions(newOrder));
        } else {
          // Reordering unassigned markers
          const markersWithoutDragged = unassignedMarkers.filter(
            (m) => m.id !== dragState.markerId
          );
          const targetIndex = markersWithoutDragged.findIndex(
            (m) => m.id === targetMarkerId
          );
          const adjustedTargetIndex =
            dragState.overPosition === "after" ? targetIndex + 1 : targetIndex;

          const newOrder = [
            ...markersWithoutDragged.slice(0, adjustedTargetIndex),
            draggedMarker,
            ...markersWithoutDragged.slice(adjustedTargetIndex),
          ];

          onReorderMarkers(MarkerUtils.calculateMarkerPositions(newOrder));
        }
      }

      dragState.clearDragState();
    },
    [
      dragState,
      placedMarkers,
      folders,
      unassignedMarkers,
      onReorderMarkers,
      onDropOnFolderAtPosition,
      onRemoveFromFolder,
    ]
  );

  const handleFolderDrop = useCallback(
    (e: React.DragEvent, targetFolderId: string) => {
      e.preventDefault();
      if (dragState.markerId && !dragState.folderId) {
        onDropOnFolder(targetFolderId);
        dragState.setDraggedMarkerId(null);
      }
    },
    [dragState, onDropOnFolder]
  );

  const handleFolderReorder = useCallback(
    (
      draggedFolderId: string,
      targetFolderId: string,
      position: "before" | "after"
    ) => {
      const draggedFolder = folders.find((f) => f.id === draggedFolderId);
      if (!draggedFolder) return;

      const foldersWithoutDragged = folders.filter(
        (f) => f.id !== draggedFolderId
      );
      const targetIndex = foldersWithoutDragged.findIndex(
        (f) => f.id === targetFolderId
      );

      let newOrder: MarkerFolder[];
      if (position === "before") {
        newOrder = [
          ...foldersWithoutDragged.slice(0, targetIndex),
          draggedFolder,
          ...foldersWithoutDragged.slice(targetIndex),
        ];
      } else {
        newOrder = [
          ...foldersWithoutDragged.slice(0, targetIndex + 1),
          draggedFolder,
          ...foldersWithoutDragged.slice(targetIndex + 1),
        ];
      }

      onReorderFolders(MarkerUtils.calculateFolderPositions(newOrder));
    },
    [folders, onReorderFolders]
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

  return (
    <div className="relative">
      {placedMarkersLoading && <Loading blockInteraction />}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <ul
            className={`${viewConfig.showLocations ? "opacity-100" : "opacity-50"} space-y-1`}
          >
            {/* Folders */}
            {folders.map((folder, index) => {
              const markersInFolder = MarkerUtils.getMarkersInFolder(
                folder,
                placedMarkers
              );
              const isEditing = editingState.editingFolderId === folder.id;
              const isDragged = dragState.folderId === folder.id;

              return (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  isEditing={isEditing}
                  editName={editingState.editName}
                  isDragged={isDragged}
                  markersInFolder={markersInFolder}
                  onToggle={() => {
                    if (!isEditing) {
                      onToggleFolder(folder.id);
                    }
                  }}
                  onEditChange={editingState.setEditName}
                  onEditSubmit={() => handleEditFolderSubmit(folder.id)}
                  onEditKeyDown={(e) => handleEditFolderKeyDown(e, folder.id)}
                  onDragStart={() => handleFolderDragStart(folder.id)}
                  onDragEnd={dragState.clearDragState}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragState.markerId && !dragState.folderId) {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "rgb(243 244 246)";
                    }
                  }}
                  onDragLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "";
                  }}
                  onDrop={(e) => handleFolderDrop(e, folder.id)}
                  onDelete={() => onDeleteFolder(folder.id)}
                  onStartEdit={() =>
                    editingState.startEditFolder(folder.id, folder.name)
                  }
                >
                  {/* Drop zone before folder */}
                  {index === 0 && (
                    <div
                      className={`h-1 mb-1 transition-colors ${
                        dragState.overFolderId === `before-${folder.id}`
                          ? "bg-blue-500"
                          : "bg-transparent"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (
                          dragState.folderId &&
                          dragState.folderId !== folder.id
                        ) {
                          dragState.setDragOverFolder(`before-${folder.id}`);
                        }
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        if (dragState.overFolderId === `before-${folder.id}`) {
                          dragState.setDragOverFolder(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (
                          dragState.folderId &&
                          dragState.folderId !== folder.id
                        ) {
                          handleFolderReorder(
                            dragState.folderId,
                            folder.id,
                            "before"
                          );
                        }
                        dragState.clearDragState();
                      }}
                    />
                  )}

                  {/* Folder contents */}
                  {folder.isExpanded &&
                    markersInFolder.map((marker) => (
                      <div key={marker.id} className="ml-4 mt-1">
                        <div
                          className="pl-2"
                          onDragOver={(e) => {
                            e.preventDefault();
                            (
                              e.currentTarget as HTMLElement
                            ).style.backgroundColor = "rgb(243 244 246)";
                          }}
                          onDragLeave={(e) => {
                            (
                              e.currentTarget as HTMLElement
                            ).style.backgroundColor = "";
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            (
                              e.currentTarget as HTMLElement
                            ).style.backgroundColor = "";
                            if (dragState.markerId) {
                              const isAlreadyInFolder =
                                Array.isArray(folder.markerIds) &&
                                folder.markerIds.includes(dragState.markerId);
                              if (!isAlreadyInFolder) {
                                onDropOnFolder(folder.id);
                              }
                            }
                            dragState.setDraggedMarkerId(null);
                          }}
                        >
                          <MarkerItem
                            marker={marker}
                            isDragged={dragState.markerId === marker.id}
                            isDragOver={dragState.overMarkerId === marker.id}
                            dragPosition={dragState.overPosition}
                            isEditing={
                              editingState.editingMarkerId === marker.id
                            }
                            editText={editingState.editText}
                            onEdit={editingState.setEditText}
                            onEditSubmit={() => handleEditMarker(marker.id)}
                            onDragStart={() => handleMarkerDragStart(marker.id)}
                            onDragEnd={dragState.clearDragState}
                            onDragOver={(e) => handleDragOver(e, marker.id)}
                            onDragLeave={() =>
                              dragState.setDragOverMarker(null, null)
                            }
                            onDrop={(e) => handleDrop(e, marker.id)}
                            onContextMenu={() =>
                              setContextMenuMarkerId(marker.id)
                            }
                            onFlyTo={() => handleFlyToMarker(marker)}
                          />
                        </div>
                      </div>
                    ))}

                  {/* Drop zone after folder */}
                  <div
                    className={`h-1 mt-1 transition-colors ${
                      dragState.overFolderId === `after-${folder.id}`
                        ? "bg-blue-500"
                        : "bg-transparent"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (
                        dragState.folderId &&
                        dragState.folderId !== folder.id
                      ) {
                        dragState.setDragOverFolder(`after-${folder.id}`);
                      }
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      if (dragState.overFolderId === `after-${folder.id}`) {
                        dragState.setDragOverFolder(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (
                        dragState.folderId &&
                        dragState.folderId !== folder.id
                      ) {
                        handleFolderReorder(
                          dragState.folderId,
                          folder.id,
                          "after"
                        );
                      }
                      dragState.clearDragState();
                    }}
                  />
                </FolderItem>
              );
            })}

            {/* Unassigned markers */}
            {unassignedMarkers.length > 0 && (
              <>
                {unassignedMarkers.map((marker) => (
                  <li key={marker.id} className="list-none">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "rgb(243 244 246)";
                      }}
                      onDragLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "";
                        if (dragState.markerId) {
                          const folderWithMarker =
                            MarkerUtils.findFolderByMarkerId(
                              folders,
                              dragState.markerId
                            );
                          if (folderWithMarker) {
                            onRemoveFromFolder(
                              folderWithMarker.id,
                              dragState.markerId
                            );
                          }
                          dragState.setDraggedMarkerId(null);
                        }
                      }}
                    >
                      <MarkerItem
                        marker={marker}
                        isDragged={dragState.markerId === marker.id}
                        isDragOver={dragState.overMarkerId === marker.id}
                        dragPosition={dragState.overPosition}
                        isEditing={editingState.editingMarkerId === marker.id}
                        editText={editingState.editText}
                        onEdit={editingState.setEditText}
                        onEditSubmit={() => handleEditMarker(marker.id)}
                        onDragStart={() => handleMarkerDragStart(marker.id)}
                        onDragEnd={dragState.clearDragState}
                        onDragOver={(e) => handleDragOver(e, marker.id)}
                        onDragLeave={() =>
                          dragState.setDragOverMarker(null, null)
                        }
                        onDrop={(e) => handleDrop(e, marker.id)}
                        onContextMenu={() => setContextMenuMarkerId(marker.id)}
                        onFlyTo={() => handleFlyToMarker(marker)}
                      />
                    </div>
                  </li>
                ))}
              </>
            )}

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
        </ContextMenuTrigger>
        <ContextMenuContent>
          {contextMenuMarkerId !== null && (
            <>
              <ContextMenuItem
                onClick={() => {
                  const marker = placedMarkers.find(
                    (m) => m.id === contextMenuMarkerId
                  );
                  if (marker) {
                    editingState.startEditMarker(
                      contextMenuMarkerId,
                      marker.label
                    );
                  }
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  deletePlacedMarker(contextMenuMarkerId);
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
}
