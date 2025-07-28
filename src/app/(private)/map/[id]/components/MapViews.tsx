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

interface MapView {
  id: string;
  name: string;
  isDefault: boolean;
  isSaved: boolean;
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

    


  return (
    <>
      <div className="flex flex-row gap-2 text-sm">
        {views.map((view) => (
          <ContextMenu key={view.id}>
            <ContextMenuTrigger asChild>
              <div 
                className={`flex flex-row gap-2 items-center px-2 py-1 rounded border ${
                  isRenaming ? 'cursor-default' : 'cursor-pointer'
                } ${
                  selectedViewId === view.id ? "bg-muted" : "bg-transparent"
                }`} 
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
    </>
  );
}