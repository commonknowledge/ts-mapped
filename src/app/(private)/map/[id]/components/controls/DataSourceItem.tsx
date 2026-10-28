"use client";

import {
  EyeIcon,
  EyeOffIcon,
  FilterIcon,
  PencilIcon,
  SlidersHorizontalIcon,
  TrashIcon,
} from "lucide-react";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import DataSourceIcon from "@/components/DataSourceIcon";
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
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { useDataSourceItem } from "../../hooks/useDataSourceItem";
import ControlWrapper from "./ControlWrapper";
import type { DataSourceItemSource } from "../../hooks/useDataSourceItem";
import type { LayerType } from "@/types";

export interface DataSourceRowProps {
  dataSource: DataSourceItemSource;
  isSelected: boolean;
  handleDataSourceSelect: (id: string) => void;
  layerType: LayerType;
}

export default function DataSourceItem({
  dataSource,
  isSelected,
  handleDataSourceSelect,
  layerType,
}: DataSourceRowProps) {
  const {
    isVisible,
    toggleVisibility,
    currentColor,
    toggleSettings,
    openSettings,
    matchedRecordCount,
    matchedCountLoading,
    isRenaming,
    setIsRenaming,
    editName,
    setEditName,
    inputRef,
    handleSaveRename,
    handleCancelRename,
    handleRenameBlur,
    showRemoveDialog,
    setShowRemoveDialog,
    handleRemoveFromMap,
  } = useDataSourceItem({ dataSource, layerType });

  return (
    <>
      <ControlWrapper
        name={dataSource.name}
        layerType={layerType}
        isVisible={isVisible}
        onVisibilityToggle={toggleVisibility}
        color={currentColor}
        onOpenSettings={toggleSettings}
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
                        if (e.key === "Escape") handleCancelRename();
                      }}
                      onBlur={handleRenameBlur}
                      ref={inputRef}
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {dataSource.name}
                    </span>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {Boolean(dataSource?.recordCount) ? (
                      matchedCountLoading ? (
                        <p>
                          <span className="animate-pulse">…</span> /{" "}
                          {dataSource.recordCount} records
                        </p>
                      ) : matchedRecordCount !== dataSource.recordCount ? (
                        <p className="inline-flex items-center gap-1">
                          <FilterIcon size={10} className="shrink-0" />
                          {matchedRecordCount} / {dataSource.recordCount}{" "}
                          records
                        </p>
                      ) : (
                        <p>{dataSource.recordCount} records</p>
                      )
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
            <ContextMenuItem onClick={toggleVisibility}>
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
            <ContextMenuItem onClick={openSettings}>
              <SlidersHorizontalIcon size={12} />
              Marker settings
            </ContextMenuItem>
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
