"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  EyeIcon,
  EyeOffIcon,
  Palette,
  PencilIcon,
  TableIcon,
  TrashIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DataSourceIcon from "@/components/DataSourceIcon";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import { useTRPC } from "@/services/trpc/react";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shadcn/ui/alert-dialog";
import { DataSourceTypeLabels } from "@/labels";
import { LayerType } from "@/types";
import { CircleIcon, SquareIcon, UsersIcon } from "lucide-react";
import DataSourceRecordTypeIcon, {
  dataSourceRecordTypeLabels,
} from "@/components/DataSourceRecordTypeIcon";
import { cn } from "@/shadcn/utils";
import { useLayers } from "../../hooks/useLayers";
import { useMapConfig } from "../../hooks/useMapConfig";
import { mapColors } from "../../styles";
import ControlWrapper from "./ControlWrapper";
import type {
  DataSourceRecordType,
  DataSourceType,
} from "@/server/models/DataSource";
import LayerIcon from "./LayerIcon";
import { useMapViews } from "../../hooks/useMapViews";
import { useChoropleth } from "../../hooks/useChoropleth";
import { CalculationType } from "@/server/models/MapView";

function getLayerTypeLabel(type: LayerType) {
  switch (type) {
    case LayerType.Member:
      return "Members";
    case LayerType.Marker:
      return "Markers";
    case LayerType.Turf:
      return "Areas";
    case LayerType.Boundary:
      return "Boundaries";
    case LayerType.DataLayer:
      return "Data Sources";
    default:
      return "Layer";
  }
}

function LayerTypeSubheadingIcon({ type }: { type: LayerType }) {
  const common = "w-3 h-3";
  switch (type) {
    case LayerType.Member:
      return <UsersIcon className={common} />;
    case LayerType.Marker:
      return <CircleIcon className={common} />;
    case LayerType.Turf:
      return <SquareIcon className={common} />;
    case LayerType.Boundary:
      return <SquareIcon className={common} />;
    default:
      return null;
  }
}

export default function DataSourceItem({
  dataSource,
  isSelected,
  handleDataSourceSelect,
  layerType,
  showChevron,
  isExpanded,
  onToggleExpand,
}: {
  dataSource: {
    id: string;
    name: string;
    config: { type: DataSourceType };
    recordCount?: number;
    createdAt?: Date;
    recordType?: DataSourceRecordType;
  };
  isSelected: boolean;
  handleDataSourceSelect: (id: string) => void;
  layerType: LayerType;
  showChevron?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const { setDataSourceVisibility, getDataSourceVisibility } = useLayers();
  const { mapConfig, updateMapConfig } = useMapConfig();
  const { updateViewConfig } = useMapViews();
  const { setBoundariesPanelOpen } = useChoropleth();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(dataSource.name);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [layerColor, setLayerColor] = useState(
    layerType === LayerType.Member
      ? mapColors.member.color
      : layerType === LayerType.DataLayer
        ? "#6b7280"
        : mapColors.markers.color
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocusing = useRef(false);

  const isVisible = getDataSourceVisibility(dataSource?.id);

  // Focus management for rename input
  useEffect(() => {
    if (isRenaming) {
      isFocusing.current = true;
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 10);
      setTimeout(() => {
        isFocusing.current = false;
      }, 500);
    }
  }, [isRenaming]);

  // Update editName when dataSource.name changes
  useEffect(() => {
    setEditName(dataSource.name);
  }, [dataSource.name]);

  // Update name mutation
  const { mutate: updateName } = useMutation(
    trpc.dataSource.updateConfig.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.dataSource.listReadable.queryKey(),
        });
        toast.success("Data source renamed successfully");
        setIsRenaming(false);
      },
      onError: () => {
        toast.error("Failed to rename data source");
        setEditName(dataSource.name); // Reset on error
      },
    })
  );

  const handleSaveRename = () => {
    if (editName.trim() && editName !== dataSource.name) {
      updateName({
        dataSourceId: dataSource.id,
        name: editName.trim(),
      });
    } else {
      setEditName(dataSource.name);
      setIsRenaming(false);
    }
  };

  const handleRemoveFromMap = () => {
    if (layerType === LayerType.Member) {
      // Remove members data source
      updateMapConfig({ membersDataSourceId: null });
      toast.success("Data source removed from map");
    } else if (layerType === LayerType.Marker) {
      // Remove from marker data sources array
      updateMapConfig({
        markerDataSourceIds: mapConfig.markerDataSourceIds.filter(
          (id) => id !== dataSource.id
        ),
      });
      toast.success("Data source removed from map");
    } else if (layerType === LayerType.DataLayer) {
      // Remove from non-point data sources array
      updateMapConfig({
        nonPointDataSourceIds: (mapConfig.nonPointDataSourceIds || []).filter(
          (id) => id !== dataSource.id
        ),
      });
      toast.success("Data source removed from map");
    }
    setShowRemoveDialog(false);
  };

  return (
    <>
      <ControlWrapper
        name={dataSource.name}
        layerType={layerType}
        isVisible={isVisible}
        onVisibilityToggle={() =>
          setDataSourceVisibility(dataSource?.id, !isVisible)
        }
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="flex items-center justify-between">
              <LayerIcon
                layerType={layerType}
                isDataSource={true}
                layerColor={layerColor}
                onColorChange={setLayerColor}
              />
              <button
                className="flex w-full items-center justify-between gap-2 min-h-full cursor-pointer hover:bg-neutral-100 border-2 rounded"
                style={{ borderColor: isSelected ? layerColor : "transparent" }}
                onClick={() => {
                  // For DataLayer, clicking toggles accordion instead of selecting datasource
                  if (layerType === LayerType.DataLayer) {
                    if (!isRenaming && onToggleExpand) {
                      onToggleExpand();
                    }
                    return;
                  }
                  if (!isRenaming) {
                    handleDataSourceSelect(dataSource.id);
                  }
                }}
              >
                <div className="flex gap-[6px] text-left w-full">
                  <div className="flex-1 min-w-0">
                    {isRenaming ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-sm font-medium border-none outline-none bg-transparent w-full"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename();
                          if (e.key === "Escape") {
                            setEditName(dataSource.name);
                            setIsRenaming(false);
                          }
                        }}
                        onBlur={() => !isFocusing.current && handleSaveRename()}
                        ref={inputRef}
                      />
                    ) : (
                      <>
                        <div className="text-sm font-medium truncate flex items-center gap-1">
                          {dataSource.name}
                          {showChevron && (
                            <ChevronDown
                              size={14}
                              className={cn(
                                "text-neutral-400 flex-shrink-0 transition-transform",
                                isExpanded && "rotate-180"
                              )}
                            />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          {DataSourceTypeLabels[dataSource.config.type]}
                          {Boolean(dataSource?.recordCount) && (
                            <>
                              <span>·</span>
                              <span>{dataSource.recordCount}</span>
                            </>
                          )}
                          {dataSource.recordType &&
                          dataSourceRecordTypeLabels[dataSource.recordType] ? (
                            <span className="inline-flex items-center gap-1">
                              {
                                dataSourceRecordTypeLabels[
                                  dataSource.recordType
                                ]
                              }
                            </span>
                          ) : (
                            Boolean(dataSource?.recordCount) && (
                              <span>records</span>
                            )
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContentWithFocus
            shouldFocusTarget={isRenaming}
            targetRef={inputRef}
          >
            <ContextMenuItem onClick={() => setIsRenaming(true)}>
              <PencilIcon size={12} />
              Rename
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => setDataSourceVisibility(dataSource.id, !isVisible)}
            >
              {isVisible ? (
                <>
                  <EyeOffIcon size={12} />
                  Hide
                </>
              ) : (
                <>
                  <EyeIcon size={12} />
                  Show
                </>
              )}
            </ContextMenuItem>
            {(layerType === LayerType.Marker ||
              layerType === LayerType.Member) && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => {
                    // For marker and member layers, visualize with count
                    updateViewConfig({
                      areaDataSourceId: dataSource.id,
                      areaDataColumn: "",
                      calculationType: CalculationType.Count,
                    });
                    setBoundariesPanelOpen(true);
                  }}
                >
                  <Palette size={12} />
                  Visualise on map
                </ContextMenuItem>
              </>
            )}
            {layerType === LayerType.DataLayer && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => {
                    handleDataSourceSelect(dataSource.id);
                  }}
                >
                  <TableIcon size={12} />
                  View table
                </ContextMenuItem>
              </>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onClick={() => setShowRemoveDialog(true)}
            >
              <TrashIcon size={12} />
              Remove from map
            </ContextMenuItem>
          </ContextMenuContentWithFocus>
        </ContextMenu>
      </ControlWrapper>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove data source from map?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{dataSource.name}" from this map. The data
              source will not be deleted and can be added back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromMap}
              className="bg-destructive  hover:bg-destructive/90"
            >
              Remove from map
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
