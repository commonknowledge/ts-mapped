import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Layers, Plus, X } from "lucide-react";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  MapContext,
  ViewConfig,
} from "@/app/(private)/map/[id]/context/MapContext";
import {
  compareByPositionAndId,
  getNewPositionAfter,
  getNewPositionBefore,
  sortByPositionAndId,
} from "@/app/(private)/map/[id]/utils";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import { Button } from "@/shadcn/ui/button";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import { cn } from "@/shadcn/utils";
import { View } from "../types";

export default function MapViews() {
  const {
    views,
    insertView,
    updateView,
    setViewId: setSelectedViewId,
  } = useContext(MapContext);

  const [isCreating, setIsCreating] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [renamingViewId, setRenamingViewId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
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

    const newView = {
      id: uuidv4(),
      name: newViewName.trim(),
      config: new ViewConfig(),
      dataSourceViews: [],
    };

    insertView(newView);
    setSelectedViewId(newView.id);
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
              <Button
                variant="outline"
                size="sm"
                className="rounded shadow-none"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
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
  const {
    dirtyViewIds,
    view: selectedView,
    setViewId: setSelectedViewId,
    views,
    deleteView,
    updateView,
  } = useContext(MapContext);
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
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleViewSelect = () => {
    setSelectedViewId(view.id);
  };

  const handleDoubleClick = () => {
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
          className={`flex flex-row gap-2 items-center px-2 py-1 rounded border ${
            isRenaming ? "cursor-default" : "cursor-pointer"
          } ${
            isSelected ? "bg-muted" : "bg-transparent"
          } ${isDragging ? "opacity-50" : "opacity-100"}`}
          onClick={() => !isRenaming && handleViewSelect()}
          onDoubleClick={() => !isRenaming && handleDoubleClick()}
        >
          <Layers className="w-4 h-4 text-muted-foreground" />
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
        <ContextMenuItem onClick={() => setRenamingViewId(view.id)}>
          Rename
        </ContextMenuItem>
        {views.length > 1 && (
          <>
            <ContextMenuSeparator />
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
