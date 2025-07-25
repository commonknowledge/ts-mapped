import { Check, Database, Pencil, Table, Trash2 } from "lucide-react";
import { useContext, useState } from "react";
import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { TableContext } from "@/app/(private)/map/[id]/context/TableContext";
import { Button } from "@/shadcn/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import DataSourceIcon from "../DataSourceIcon";

export default function MarkerList() {
  const { mapRef, viewConfig } = useContext(MapContext);
  const { getMarkerDataSources } = useContext(DataSourcesContext);

  const { placedMarkers, deletePlacedMarker, updatePlacedMarker } =
    useContext(MarkerAndTurfContext);

  const { selectedDataSourceId, handleDataSourceSelect } =
    useContext(TableContext);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [contextMenuIndex, setContextMenuIndex] = useState<number | null>(null);

  const markerDataSources = getMarkerDataSources();

  return (
    <div className="relative">
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
                      e.preventDefault();
                      const existingMarker = placedMarkers.find(
                        (m, i) => i === index,
                      );
                      if (existingMarker) {
                        updatePlacedMarker({
                          ...existingMarker,
                          label: editText,
                        });
                      }
                      setEditingIndex(null);
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
                    <span
                      className="flex-grow cursor-pointer text-sm"
                      onClick={() => {
                        const map = mapRef?.current;
                        if (map) {
                          map.flyTo({
                            center: result.point,
                            zoom: 12,
                          });
                        }
                      }}
                    >
                      {result.label}
                    </span>
                  </>
                )}
              </li>
            ))}
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
                    (m, i) => i === contextMenuIndex,
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
}
