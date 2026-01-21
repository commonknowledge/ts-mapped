"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EyeIcon, EyeOffIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ColorPalette from "@/components/ColorPalette";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import DataSourceIcon from "@/components/DataSourceIcon";
import { MarkerDisplayMode } from "@/server/models/Map";
import { useTRPC } from "@/services/trpc/react";
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
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { LayerType } from "@/types";
import { useLayers } from "../../hooks/useLayers";
import { useMapConfig } from "../../hooks/useMapConfig";
import { mapColors } from "../../styles";
import ControlWrapper from "./ControlWrapper";
import type { DataSourceType } from "@/server/models/DataSource";

export default function DataSourceItem({
  dataSource,
  isSelected,
  handleDataSourceSelect,
  layerType,
}: {
  dataSource: {
    id: string;
    name: string;
    config: { type: DataSourceType };
    recordCount?: number;
    createdAt?: Date;
  };
  isSelected: boolean;
  handleDataSourceSelect: (id: string) => void;
  layerType: LayerType;
}) {
  const { setDataSourceVisibility, getDataSourceVisibility } = useLayers();
  const { mapConfig, updateMapConfig } = useMapConfig();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(dataSource.name);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocusing = useRef(false);

  const layerColor =
    layerType === LayerType.Member
      ? mapColors.member.color
      : mapColors.markers.color;

  const isVisible = getDataSourceVisibility(dataSource?.id);

  // Get current display mode (defaults to Clusters)
  const currentDisplayMode =
    mapConfig.markerDisplayModes?.[dataSource.id] ?? MarkerDisplayMode.Clusters;

  // Get current color (defaults to layer color)
  const currentColor = mapConfig.markerColors?.[dataSource.id] ?? layerColor;

  const handleDisplayModeChange = (mode: MarkerDisplayMode) => {
    updateMapConfig({
      markerDisplayModes: {
        ...mapConfig.markerDisplayModes,
        [dataSource.id]: mode,
      },
    });
  };

  const handleColorChange = (color: string) => {
    updateMapConfig({
      markerColors: {
        ...mapConfig.markerColors,
        [dataSource.id]: color,
      },
    });
  };

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
    }),
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
          (id) => id !== dataSource.id,
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
        color={currentColor}
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <button
              className="flex w-full items-center justify-between gap-2 min-h-full cursor-pointer hover:bg-neutral-100 border-2 rounded"
              style={{ borderColor: isSelected ? currentColor : "transparent" }}
              onClick={() =>
                !isRenaming && handleDataSourceSelect(dataSource.id)
              }
            >
              <div className="flex gap-[6px] text-left">
                <div className="shrink-0 mt-[0.333em]">
                  <DataSourceIcon type={dataSource.config.type} />
                </div>

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
                    <span className="text-sm font-medium">
                      {dataSource.name} test
                    </span>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {Boolean(dataSource?.recordCount) ? (
                      <p>{dataSource.recordCount} records</p>
                    ) : (
                      <p>No records</p>
                    )}
                    {dataSource.createdAt && (
                      <p>
                        Created{" "}
                        {new Date(dataSource?.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </button>
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
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded border border-neutral-300"
                    style={{ backgroundColor: currentColor }}
                  />
                  <span>Color</span>
                </div>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-auto p-2">
                <ColorPalette
                  selectedColor={currentColor}
                  onColorSelect={handleColorChange}
                />
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuLabel>Display as</ContextMenuLabel>
            <ContextMenuCheckboxItem
              checked={currentDisplayMode === MarkerDisplayMode.Clusters}
              onCheckedChange={(checked) => {
                if (checked) {
                  handleDisplayModeChange(MarkerDisplayMode.Clusters);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: currentColor }}
                >
                  <span className="text-[8px] font-semibold text-white leading-none">
                    5
                  </span>
                </div>
                <span>Cluster</span>
              </div>
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem
              checked={currentDisplayMode === MarkerDisplayMode.Heatmap}
              onCheckedChange={(checked) => {
                if (checked) {
                  handleDisplayModeChange(MarkerDisplayMode.Heatmap);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border border-neutral-300 flex-shrink-0 relative overflow-hidden"
                  style={{
                    background: `radial-gradient(circle, ${currentColor} 0%, ${currentColor}80 30%, ${currentColor}40 60%, ${currentColor}20 100%)`,
                  }}
                />
                <span>Heatmap</span>
              </div>
            </ContextMenuCheckboxItem>
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
              This will remove &quot;{dataSource.name}&quot; from this map. The
              data source will not be deleted and can be added back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromMap}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Remove from map
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
