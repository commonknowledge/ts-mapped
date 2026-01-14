"use client";

import { ChevronDown, Folder, MoreVertical, PencilIcon, TrashIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import { cn } from "@/shadcn/utils";
import DataSourceColumnItem from "./DataSourceColumnItem";
import type { ColumnDef } from "@/server/models/DataSource";

interface ColumnGroupProps {
  groupId: string;
  groupName: string;
  columns: ColumnDef[];
  dataSourceId: string;
  dataSourceName: string;
  isVisualized: (columnName: string) => boolean;
  onVisualise: (dataSourceId: string, columnName: string) => void;
  onRename: (groupId: string, newName: string) => void;
  onDelete: (groupId: string) => void;
  onRemoveColumn: (groupId: string, columnName: string) => void;
}

export default function ColumnGroup({
  groupId,
  groupName,
  columns,
  dataSourceId,
  dataSourceName,
  isVisualized,
  onVisualise,
  onRename,
  onDelete,
  onRemoveColumn,
}: ColumnGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(groupName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleSaveRename = () => {
    if (editName.trim() && editName !== groupName) {
      onRename(groupId, editName.trim());
    } else {
      setEditName(groupName);
    }
    setIsRenaming(false);
  };

  if (columns.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-100 transition-colors text-left group"
          >
            <ChevronDown
              size={12}
              className={cn(
                "text-neutral-400 transition-transform flex-shrink-0",
                isExpanded && "rotate-180"
              )}
            />
            <Folder size={12} className="text-neutral-400 flex-shrink-0" />
            {isRenaming ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveRename();
                  if (e.key === "Escape") {
                    setEditName(groupName);
                    setIsRenaming(false);
                  }
                }}
                onBlur={handleSaveRename}
                ref={inputRef}
                className="text-xs font-medium border-none outline-none bg-transparent flex-1 min-w-0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-xs font-medium text-neutral-700 truncate">
                {groupName}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto">
              {columns.length}
            </span>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContentWithFocus>
          <ContextMenuItem onClick={() => setIsRenaming(true)}>
            <PencilIcon size={12} />
            Rename group
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onClick={() => onDelete(groupId)}
          >
            <TrashIcon size={12} />
            Delete group
          </ContextMenuItem>
        </ContextMenuContentWithFocus>
      </ContextMenu>
      {isExpanded && (
        <div className="ml-4 mt-0.5 space-y-0.5">
          {columns.map((column) => {
            const columnIsVisualized = isVisualized(column.name);
            return (
              <div key={column.name} className="relative group/item">
                <DataSourceColumnItem
                  column={column}
                  dataSourceId={dataSourceId}
                  dataSourceName={dataSourceName}
                  onVisualise={onVisualise}
                  isVisualized={columnIsVisualized}
                />
                <button
                  onClick={() => onRemoveColumn(groupId, column.name)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 hover:bg-neutral-200 rounded"
                  title="Remove from group"
                >
                  <MoreVertical size={10} className="text-neutral-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
