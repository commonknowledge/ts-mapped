import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
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
  FolderPlusIcon,
  MapPinIcon,
  Pencil,
  Table,
  Trash2,
} from "lucide-react";
import { useCallback, useContext, useEffect, useState } from "react";
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

// Sortable marker item component
const SortableMarkerItem = ({
  marker,
  index,
  isEditing,
  editText,
  onEdit,
  onEditSubmit,
  onContextMenu,
  onFlyTo,
  onDelete,
}: {
  marker: PlacedMarker;
  index: number;
  isEditing: boolean;
  editText: string;
  onEdit: (text: string) => void;
  onEditSubmit: () => void;
  onContextMenu: () => void;
  onFlyTo: () => void;
  onDelete: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `marker-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 px-1 hover:bg-neutral-100 rounded cursor-grab active:cursor-grabbing"
      onContextMenu={onContextMenu}
    >
      {isEditing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onEditSubmit();
          }}
          className="w-full flex items-center gap-1"
        >
          <Input
            value={editText}
            onChange={(e) => onEdit(e.target.value)}
            autoFocus
            className="flex-1"
          />
          <Button type="submit" size="sm" variant="ghost">
            <Check className="h-3 w-3" />
          </Button>
        </form>
      ) : (
        <>
          <div
            className="flex items-center gap-1.5 flex-grow cursor-pointer text-sm"
            onClick={onFlyTo}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: mapColors.markers.color }}
            />
            {marker.label}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </>
      )}
    </li>
  );
};

// Drag overlay component
const MarkerDragOverlay = ({ marker }: { marker: PlacedMarker }) => {
  return (
    <div
      className="flex items-center gap-2 p-1 bg-white border border-blue-300 rounded shadow-lg pointer-events-none"
      style={{
        transform: "translate(0%, -170%)",
      }}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: mapColors.markers.color }}
      />
      <span className="text-sm">{marker.label}</span>
    </div>
  );
};

const MarkersList = () => {
  const { viewConfig, mapRef } = useContext(MapContext);
  const { placedMarkers, placedMarkersLoading } =
    useContext(MarkerAndTurfContext);
  const { selectedDataSourceId, handleDataSourceSelect } =
    useContext(TableContext);
  const { getMarkerDataSources } = useContext(DataSourcesContext);

  // Local state for markers (no database interaction)
  const [localMarkers, setLocalMarkers] =
    useState<PlacedMarker[]>(placedMarkers);
  const [contextMenuIndex, setContextMenuIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const markerDataSources = getMarkerDataSources();

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

  // Update local markers when placedMarkers changes
  useEffect(() => {
    setLocalMarkers(placedMarkers);
  }, [placedMarkers]);

  const handleEditMarker = useCallback(
    (index: number) => {
      const existingMarker = localMarkers[index];
      if (existingMarker) {
        const updatedMarkers = [...localMarkers];
        updatedMarkers[index] = { ...existingMarker, label: editText };
        setLocalMarkers(updatedMarkers);
        setEditingIndex(null);
        setEditText("");
      }
    },
    [localMarkers, editText]
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

  const handleDeleteMarker = useCallback(
    (index: number) => {
      const updatedMarkers = localMarkers.filter((_, i) => i !== index);
      setLocalMarkers(updatedMarkers);
    },
    [localMarkers]
  );

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString().replace("marker-", ""));
      const newIndex = parseInt(over.id.toString().replace("marker-", ""));

      setLocalMarkers((items) => arrayMove(items, oldIndex, newIndex));
    }

    setActiveId(null);
  }, []);

  // Get active marker for drag overlay
  const getActiveMarker = () => {
    if (!activeId) return null;
    const index = parseInt(activeId.replace("marker-", ""));
    return localMarkers[index];
  };

  return (
    <div className="relative">
      {placedMarkersLoading && <Loading blockInteraction />}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <ul
              className={`${viewConfig.showLocations ? "opacity-100" : "opacity-50"} space-y-1`}
            >
              <SortableContext
                items={localMarkers.map((_, index) => `marker-${index}`)}
                strategy={verticalListSortingStrategy}
              >
                {localMarkers.map((marker, index) => (
                  <SortableMarkerItem
                    key={`${marker.id}-${index}`}
                    marker={marker}
                    index={index}
                    isEditing={editingIndex === index}
                    editText={editText}
                    onEdit={setEditText}
                    onEditSubmit={() => handleEditMarker(index)}
                    onContextMenu={() => setContextMenuIndex(index)}
                    onFlyTo={() => handleFlyToMarker(marker)}
                    onDelete={() => handleDeleteMarker(index)}
                  />
                ))}
              </SortableContext>

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

            <DragOverlay dropAnimation={null} adjustScale={true}>
              {activeId && getActiveMarker() && (
                <MarkerDragOverlay marker={getActiveMarker() as PlacedMarker} />
              )}
            </DragOverlay>
          </DndContext>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {contextMenuIndex !== null && (
            <>
              <ContextMenuItem
                onClick={() => {
                  setEditText(localMarkers[contextMenuIndex].label);
                  setEditingIndex(contextMenuIndex);
                  setContextMenuIndex(null);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  handleDeleteMarker(contextMenuIndex);
                  setContextMenuIndex(null);
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
