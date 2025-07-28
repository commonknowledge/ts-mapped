import { Button } from '@/shadcn/ui/button';
import {  Layers, Plus, X, Save, Edit, Check } from 'lucide-react';
import React, { useState } from 'react'
import { Input } from '@/shadcn/ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { cn } from '@/shadcn/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MapView {
  id: string;
  name: string;
  isDefault: boolean;
  isSaved: boolean;
}

// Sortable view item component
function SortableViewItem({ view, isSelected, isRenaming, renameName, setRenameName, handleViewSelect, handleDoubleClick, handleSaveRename, setIsRenaming, handleRenameView, handleDeleteView }: {
  view: MapView;
  isSelected: boolean;
  isRenaming: string | null;
  renameName: string;
  setRenameName: (name: string) => void;
  handleViewSelect: (id: string) => void;
  handleDoubleClick: (id: string) => void;
  handleSaveRename: () => void;
  setIsRenaming: (id: string | null) => void;
  handleRenameView: (id: string) => void;
  handleDeleteView: (id: string) => void;
}) {
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

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div 
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className={`flex flex-row gap-2 items-center px-2 py-1 rounded border ${
            isRenaming ? 'cursor-default' : 'cursor-pointer'
          } ${
            isSelected ? "bg-muted" : "bg-transparent"
          } ${isDragging ? 'opacity-50' : 'opacity-100'}`} 
          onClick={() => !isRenaming && handleViewSelect(view.id)}
          onDoubleClick={() => !isRenaming && handleDoubleClick(view.id)}
        >
          <Layers className="w-4 h-4 text-muted-foreground" />          
          {isRenaming === view.id ? (
            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              className="text-sm border-none outline-none bg-transparent min-w-0"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename();
                if (e.key === 'Escape') setIsRenaming(null);
              }}
              onBlur={handleSaveRename}
            />
          ) : (
            <h2>{view.name}</h2>
          )}
          
         
          <div className={cn(" transition-all duration-300 bg-neutral-400 rounded-full", view.isSaved ?  "w-0 h-0" : " w-2 h-2 ")} />

          
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => handleRenameView(view.id)}>
          Rename
        </ContextMenuItem>
        {!view.isDefault && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => handleDeleteView(view.id)}
              className="text-red-600 focus:text-red-600"
            >
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default function MapViews() {
  const [views, setViews] = useState<MapView[]>([
    {
      id: "default",
      name: "Default",
      isDefault: true,
      isSaved: true,
    }
  ]);

  const [selectedViewId, setSelectedViewId] = useState<string>("default");
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newViewName, setNewViewName] = useState("");
  const [renameName, setRenameName] = useState("");

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Only start dragging after moving 8px
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCreateView = () => {
    if (!newViewName.trim()) return;
    
    const newView: MapView = {
      id: `view-${Date.now()}`,
      name: newViewName.trim(),
      isDefault: false,
      isSaved: true,
    };
    
    setViews(prev => [...prev, newView]);
    setSelectedViewId(newView.id);
    setNewViewName("");
    setIsCreating(false);
  };

  const handleDeleteView = (viewId: string) => {
    if (views.find(v => v.id === viewId)?.isDefault) return;
    
    setViews(prev => prev.filter(v => v.id !== viewId));
    if (selectedViewId === viewId) {
      setSelectedViewId("default");
    }
  };

  const handleRenameView = (viewId: string) => {
    const view = views.find(v => v.id === viewId);
    if (!view) return;
    
    setRenameName(view.name);
    setIsRenaming(viewId);
  };

  const handleSaveRename = () => {
    if (!renameName.trim() || !isRenaming) return;
    
    setViews(prev => prev.map(v => 
      v.id === isRenaming ? { ...v, name: renameName.trim() } : v
    ));
    setIsRenaming(null);
    setRenameName("");
  };

  const handleViewSelect = (viewId: string) => {
    setSelectedViewId(viewId);
  };

  const handleDoubleClick = (viewId: string) => {
    handleRenameView(viewId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setViews((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDragStart = () => {
    // Ensure any ongoing rename is cancelled when dragging starts
    if (isRenaming) {
      setIsRenaming(null);
      setRenameName("");
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={views.map(view => view.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-row gap-2 text-sm">
            {views.map((view) => (
                             <SortableViewItem
                 key={view.id}
                 view={view}
                 isSelected={selectedViewId === view.id}
                 isRenaming={isRenaming}
                 renameName={renameName}
                 setRenameName={setRenameName}
                 handleViewSelect={handleViewSelect}
                 handleDoubleClick={handleDoubleClick}
                 handleSaveRename={handleSaveRename}
                 setIsRenaming={setIsRenaming}
                 handleRenameView={handleRenameView}
                 handleDeleteView={handleDeleteView}
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
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateView();
                    if (e.key === 'Escape') setIsCreating(false);
                  }}
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