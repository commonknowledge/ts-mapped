import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Layers, Plus, Tag, X } from "lucide-react";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { MapContext, ViewConfig } from "@/app/map/[id]/context/MapContext";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import { Button } from "@/shadcn/ui/button";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { cn } from "@/shadcn/utils";
import {
  compareByPositionAndId,
  getNewPositionAfter,
  getNewPositionBefore,
  sortByPositionAndId,
} from "../utils";
import type { View } from "../types";
import type { DragEndEvent } from "@dnd-kit/core";

export default function MapViews() {
  const { mapId } = useContext(MapContext);

  const { views, insertView, updateView } = useMapViews();

  const [isCreating, setIsCreating] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [renamingViewId, setRenamingViewId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCreating) return;
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  }, [isCreating]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Only start dragging after moving 8px
      },
    }),
    // Disable keyboard sensor while user is naming the view
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Disable keyboard while text input is active
      keyboardCodes:
        renamingViewId || isCreating
          ? { start: [], cancel: [], end: [] }
          : undefined,
    }),
  );

  const handleCreateView = () => {
    if (!newViewName.trim()) {
      return;
    }
    if (!mapId) {
      return;
    }

    const newView = {
      id: uuidv4(),
      name: newViewName.trim(),
      config: new ViewConfig(),
      dataSourceViews: [],
      mapId,
      isTag: false,
      createdAt: new Date(),
    };

    insertView(newView);
    setNewViewName("");
    setIsCreating(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id === over?.id) {
      return;
    }

    const activeView = views.find((v) => v.id === active.id.toString());
    const overView = views.find((v) => v.id === over?.id.toString());

    if (!activeView || !overView) {
      return;
    }

    let newPosition = 0;

    const otherViews = views.filter((v) => v.id !== active.id);
    const wasBefore = compareByPositionAndId(activeView, overView) < 0;
    if (wasBefore) {
      newPosition = getNewPositionAfter(overView.position, otherViews);
    } else {
      newPosition = getNewPositionBefore(overView.position, otherViews);
    }
    updateView({ ...activeView, position: newPosition });
  };

  const handleDragStart = () => {
    if (renamingViewId) {
      setRenamingViewId(null);
    }
  };

  const sortedViews = useMemo(() => {
    return sortByPositionAndId(views);
  }, [views]);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
      >
        <SortableContext
          items={sortedViews.map((view) => view.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-row gap-2 text-sm">
            {sortedViews.map((view) => (
              <SortableViewItem
                key={view.id}
                view={view}
                renamingViewId={renamingViewId}
                setRenamingViewId={setRenamingViewId}
              />
            ))}

            {isCreating ? (
              <div className="flex flex-row gap-2 items-center  rounded border bg-white pr-2">
                <Input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="View name..."
                  className="text-sm border-none outline-none bg-transparent w-auto"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateView();
                    if (e.key === "Escape") setIsCreating(false);
                  }}
                  ref={inputRef}
                />
                <Check
                  onClick={handleCreateView}
                  className="text-green-600 hover:text-green-800 text-xs w-4 h-4"
                />

                <X
                  onClick={() => setIsCreating(false)}
                  className="text-red-600 hover:text-red-800 text-xs w-4 h-4"
                />
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded shadow-none"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create view</TooltipContent>
              </Tooltip>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}

// Sortable view item component
function SortableViewItem({
  renamingViewId,
  setRenamingViewId,
  view,
}: {
  renamingViewId: string | null;
  setRenamingViewId: (id: string | null) => void;
  view: View;
}) {
  const { setViewId: setSelectedViewId, dirtyViewIds } = useContext(MapContext);

  const { views, deleteView, updateView, view: selectedView } = useMapViews();
  const [editName, setEditName] = useState(view.name);
  const isSelected = selectedView?.id === view.id;
  const isRenaming = renamingViewId === view.id;
  const isDirty = dirtyViewIds.includes(view.id);

  // Focus management
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocusing = useRef(false);

  useEffect(() => {
    if (isRenaming) {
      // Prevent the blur handler triggering too fast
      isFocusing.current = true;
      setTimeout(() => {
        isFocusing.current = false;
      }, 500);
    }
  }, [isRenaming]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: view.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const handleViewSelect = () => {
    // Auto-save handles persisting any changes automatically
    setSelectedViewId(view.id);
  };

  const handleDoubleClick = () => {
    // Disable renaming for tag views
    if (view.isTag) {
      return;
    }
    setRenamingViewId(view.id);
  };

  const handleSaveRename = () => {
    updateView({ ...view, name: editName });
    setRenamingViewId(null);
  };

  const handleDeleteView = () => {
    if (views.length <= 1) {
      return;
    }

    deleteView(view.id);
    if (view.id === selectedView?.id) {
      const nextView = views.find((v) => v.id !== view.id);
      if (nextView) {
        setSelectedViewId(nextView.id);
      }
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className={`flex flex-row gap-2 items-center px-2 py-1 rounded border transition-all  ${isRenaming ? "cursor-default" : "cursor-pointer"
            } ${isSelected ? "bg-muted" : "bg-transparent hover:border-action-hover"
            } ${isDragging ? "opacity-50" : "opacity-100"}`}
          onClick={() => !isRenaming && handleViewSelect()}
          onDoubleClick={() => !isRenaming && handleDoubleClick()}
        >
          {view.isTag ? (
            <Tag className="w-4 h-4 text-purple-600" />
          ) : (
            <Layers className="w-4 h-4 text-muted-foreground" />
          )}
          {isRenaming ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="text-sm border-none outline-none bg-transparent min-w-0"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveRename();
                if (e.key === "Escape") setRenamingViewId(null);
              }}
              onBlur={() => !isFocusing.current && handleSaveRename()}
              ref={inputRef}
            />
          ) : (
            <h2>{view.name}</h2>
          )}
          <div
            className={cn(
              "transition-all duration-300 bg-neutral-400 rounded-full",
              isDirty ? "w-2 h-2" : "w-0 h-0",
            )}
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContentWithFocus
        shouldFocusTarget={isRenaming}
        targetRef={inputRef}
      >
        {!view.isTag && (
          <>
            <ContextMenuItem onClick={() => setRenamingViewId(view.id)}>
              Rename
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        {views.length > 1 && (
          <>
            <ContextMenuItem
              onClick={() => handleDeleteView()}
              className="text-red-600 focus:text-red-600"
            >
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContentWithFocus>
    </ContextMenu>
  );
}
