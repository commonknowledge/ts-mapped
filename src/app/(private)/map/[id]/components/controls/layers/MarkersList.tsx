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
import { useContext, useState } from "react";
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

export default function MarkersList({
  folders,
  onToggleFolder,
  onDropOnFolder,
  onEditFolder,
  onDeleteFolder,
  onRemoveFromFolder,
  draggedMarkerId,
  setDraggedMarkerId,
}: {
  folders: MarkerFolder[];
  onToggleFolder: (folderId: string) => void;
  onDropOnFolder: (folderId: string) => void;
  onEditFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRemoveFromFolder: (folderId: string, markerId: string) => void;
  draggedMarkerId: string | null;
  setDraggedMarkerId: (id: string | null) => void;
}) {
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleStartEdit = (folderId: string, currentName: string) => {
    setEditingFolderId(folderId);
    setEditName(currentName);
  };

  const handleSaveEdit = (folderId: string) => {
    if (editName.trim()) {
      onEditFolder(folderId, editName.trim());
    }
    setEditingFolderId(null);
  };

  const handleCancelEdit = () => {
    setEditingFolderId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, folderId: string) => {
    if (e.key === "Enter") {
      handleSaveEdit(folderId);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };
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
  const [contextMenuMarkerId, setContextMenuMarkerId] = useState<string | null>(
    null
  );
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const markerDataSources = getMarkerDataSources();

  const handleEditMarker = (
    e: React.FormEvent<HTMLFormElement>,
    markerId: string
  ) => {
    e.preventDefault();
    const existingMarker = placedMarkers.find((m) => m.id === markerId);
    if (existingMarker) {
      updatePlacedMarker({ ...existingMarker, label: editText });
      setEditingMarkerId(null);
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

  const handleDragStart = (markerId: string) => {
    setDraggedMarkerId(markerId);
  };

  const handleDragEnd = () => {
    setDraggedMarkerId(null);
  };

  const handleDragOutOfFolder = (markerId: string, folderId: string) => {
    onRemoveFromFolder(folderId, markerId);
    setDraggedMarkerId(null);
  };

  const getMarkersInFolder = (folder: MarkerFolder) => {
    const markerIds = Array.isArray(folder.markerIds) ? folder.markerIds : [];
    return placedMarkers.filter((marker) => markerIds.includes(marker.id));
  };

  const getUnassignedMarkers = () => {
    const assignedMarkerIds = folders.flatMap((folder) =>
      Array.isArray(folder.markerIds) ? folder.markerIds : []
    );
    return placedMarkers.filter(
      (marker) => !assignedMarkerIds.includes(marker.id)
    );
  };

  const renderMarker = (marker: PlacedMarker) => (
    <li
      key={marker.id}
      className={`flex items-center gap-2 p-1 hover:bg-neutral-100 rounded ${
        draggedMarkerId === marker.id ? "opacity-50" : ""
      }`}
      onContextMenu={() => setContextMenuMarkerId(marker.id)}
      draggable
      onDragStart={() => handleDragStart(marker.id)}
      onDragEnd={handleDragEnd}
    >
      {editingMarkerId === marker.id ? (
        <form
          onSubmit={(e) => {
            handleEditMarker(e, marker.id);
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
            className="flex pl-1 items-center gap-1.5 flex-grow cursor-pointer text-sm"
            onClick={() => {
              handleFlyToMarker(marker);
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: mapColors.markers.color }}
            />
            {marker.label}
          </div>
        </>
      )}
    </li>
  );

  return (
    <div className="relative">
      {/* Disable interactions while markers are loading/updating in the background */}
      {placedMarkersLoading && <Loading blockInteraction />}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <ul
            className={`${viewConfig.showLocations ? "opacity-100" : "opacity-50"}`}
          >
            {/* Folders */}
            {folders.map((folder) => (
              <div key={folder.id} className="mb-1">
                <FolderContextMenu
                  folder={folder}
                  onDelete={onDeleteFolder}
                  onStartEdit={() => handleStartEdit(folder.id, folder.name)}
                >
                  <div
                    className={`flex items-center gap-1 pl-0 p-1 rounded ${
                      editingFolderId === folder.id
                        ? "bg-neutral-100"
                        : "hover:bg-neutral-100 cursor-pointer"
                    }`}
                    onClick={() => {
                      if (editingFolderId !== folder.id) {
                        onToggleFolder(folder.id);
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.backgroundColor =
                        "rgb(243 244 246)";
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.backgroundColor = "";
                      onDropOnFolder(folder.id);
                    }}
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
                    {editingFolderId === folder.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, folder.id)}
                        onBlur={() => handleSaveEdit(folder.id)}
                        className="text-sm font-medium flex-1 min-w-0"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium">{folder.name}</span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      ({getMarkersInFolder(folder).length})
                    </span>
                  </div>
                </FolderContextMenu>
                {folder.isExpanded && (
                  <div
                    className="ml-4"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.backgroundColor =
                        "rgb(243 244 246)";
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.backgroundColor = "";
                      // This is the unassigned area - remove marker from folder
                      if (draggedMarkerId) {
                        handleDragOutOfFolder(draggedMarkerId, folder.id);
                      }
                      setDraggedMarkerId(null);
                    }}
                  >
                    {getMarkersInFolder(folder).map((marker) =>
                      renderMarker(marker)
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Unassigned markers */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.backgroundColor = "rgb(243 244 246)";
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.backgroundColor = "";
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.backgroundColor = "";
                // This is the unassigned area - remove marker from any folder
                if (draggedMarkerId) {
                  const folderWithMarker = folders.find(
                    (f) =>
                      Array.isArray(f.markerIds) &&
                      f.markerIds.includes(draggedMarkerId)
                  );
                  if (folderWithMarker) {
                    handleDragOutOfFolder(draggedMarkerId, folderWithMarker.id);
                  }
                  setDraggedMarkerId(null);
                }
              }}
            >
              {getUnassignedMarkers().map((marker) => renderMarker(marker))}
            </div>

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
          {contextMenuMarkerId !== null && (
            <>
              <ContextMenuItem
                onClick={() => {
                  const marker = placedMarkers.find(
                    (m) => m.id === contextMenuMarkerId
                  );
                  if (marker) {
                    setEditText(marker.label);
                    setEditingMarkerId(contextMenuMarkerId);
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
