"use client";

import {
  FilterIcon,
  PencilIcon,
  Settings2Icon,
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
import { cn } from "@/shadcn/utils";
import { useDataSourceItem } from "../../hooks/useDataSourceItem";
import RingSwatch from "./RingSwatch";
import type { DataSourceRowProps } from "../../components/controls/DataSourceItem";

// A marker collection in the light Layers panel. The ring icon is the
// visibility toggle; the name opens the data table.
export default function LightDataSourceRow({
  dataSource,
  isSelected,
  handleDataSourceSelect,
  layerType,
}: DataSourceRowProps) {
  const {
    isVisible,
    toggleVisibility,
    currentColor,
    isSettingsOpen,
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

  const total = dataSource.recordCount ?? 0;
  const isFiltered = !matchedCountLoading && matchedRecordCount !== total;

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "group/row flex items-start gap-2 rounded-md px-1.5 py-1.5 transition-colors",
              isSelected ? "bg-neutral-100" : "hover:bg-neutral-50",
            )}
          >
            <button
              type="button"
              onClick={toggleVisibility}
              aria-pressed={isVisible}
              aria-label={`${isVisible ? "Hide" : "Show"} ${dataSource.name}`}
              title={isVisible ? "Hide on map" : "Show on map"}
              className={cn(
                "mt-0.5 cursor-pointer rounded-full transition-[opacity,filter,transform] hover:scale-110",
                !isVisible && "opacity-30 grayscale",
              )}
            >
              <RingSwatch color={currentColor} />
            </button>

            <button
              type="button"
              onClick={() =>
                !isRenaming && handleDataSourceSelect(dataSource.id)
              }
              title="Open in table"
              className={cn(
                "min-w-0 flex-1 cursor-pointer text-left transition-opacity",
                !isVisible && "opacity-50",
              )}
            >
              {isRenaming ? (
                <input
                  ref={inputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveRename();
                    if (e.key === "Escape") handleCancelRename();
                  }}
                  onBlur={handleRenameBlur}
                  aria-label="Data source name"
                  className="w-full border-none bg-transparent font-medium outline-none"
                />
              ) : (
                <span className="block truncate font-medium">
                  {dataSource.name}
                </span>
              )}
              <span className="flex min-w-0 items-center gap-1 text-xs text-neutral-500">
                <span className="flex size-3 shrink-0 items-center justify-center [&_svg]:size-3">
                  <DataSourceIcon type={dataSource.config.type} />
                </span>
                {isFiltered && <FilterIcon className="size-2.5 shrink-0" />}
                <span className="truncate">
                  {matchedCountLoading
                    ? `… / ${total}`
                    : isFiltered
                      ? `${matchedRecordCount} of ${total}`
                      : total}{" "}
                  records
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={toggleSettings}
              aria-label={`${dataSource.name} marker settings`}
              title="Marker settings"
              className={cn(
                "mt-0.5 cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900",
                isSettingsOpen
                  ? "bg-neutral-200 text-neutral-900"
                  : "opacity-0 group-hover/row:opacity-100",
              )}
            >
              <Settings2Icon className="size-3.5" />
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
