"use client";

import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { cn } from "@/shadcn/utils";
import { useMapId } from "../../hooks/useMapCore";
import { useMapViews, useSetViewId } from "../../hooks/useMapViews";
import { createNewViewConfig } from "../../utils/mapView";
import { sortByPositionAndId } from "../../utils/position";
import type { View } from "../../types";

export default function LightViewTabs() {
  const mapId = useMapId();
  const { views = [], view: activeView, insertView } = useMapViews();
  const sortedViews = useMemo(() => sortByPositionAndId(views), [views]);

  const createView = () => {
    if (!mapId) return;
    insertView({
      id: uuidv4(),
      name: `View ${views.length + 1}`,
      config: createNewViewConfig(),
      dataSourceViews: [],
      mapId,
      createdAt: new Date(),
    });
  };

  return (
    <div
      role="tablist"
      aria-label="Views"
      className="flex min-w-0 items-center gap-0.5 overflow-x-auto"
    >
      {sortedViews.map((view) => (
        <ViewTab
          key={view.id}
          view={view}
          isActive={view.id === activeView?.id}
          canDelete={views.length > 1}
        />
      ))}
      <button
        type="button"
        onClick={createView}
        aria-label="New view"
        title="New view"
        className="ml-0.5 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}

function ViewTab({
  view,
  isActive,
  canDelete,
}: {
  view: View;
  isActive: boolean;
  canDelete: boolean;
}) {
  const { views = [], updateView, deleteView } = useMapViews();
  const setViewId = useSetViewId();
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(view.name);

  const saveName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== view.name) {
      updateView({ ...view, name: trimmed });
    } else {
      setName(view.name);
    }
    setIsRenaming(false);
  };

  const remove = () => {
    if (!canDelete) return;
    deleteView(view.id);
    if (isActive) {
      const next = views.find((v) => v.id !== view.id);
      if (next) {
        setViewId(next.id);
      }
    }
  };

  if (isRenaming) {
    return (
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveName}
        onKeyDown={(e) => {
          if (e.key === "Enter") saveName();
          if (e.key === "Escape") {
            setName(view.name);
            setIsRenaming(false);
          }
        }}
        aria-label="View name"
        className="h-7 w-32 shrink-0 rounded-md border border-neutral-300 px-2 text-sm outline-none focus:border-neutral-500"
      />
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => setViewId(view.id)}
          onDoubleClick={() => setIsRenaming(true)}
          className={cn(
            "h-7 shrink-0 cursor-pointer rounded-md px-2.5 text-sm whitespace-nowrap transition-colors",
            isActive
              ? "bg-neutral-100 font-medium text-neutral-900 shadow-[inset_0_0_0_1px_#e5e5e5]"
              : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900",
          )}
        >
          {view.name}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => setIsRenaming(true)}>
          <PencilIcon size={12} />
          Rename
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          disabled={!canDelete}
          onClick={remove}
        >
          <TrashIcon size={12} />
          Delete view
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
