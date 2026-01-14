"use client";

import { Check, Palette, Save, TrashIcon } from "lucide-react";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import { cn } from "@/shadcn/utils";
import type { MapConfig } from "@/server/models/Map";

interface SavedVisualizationItemProps {
  visualization: MapConfig["savedVisualizations"][0];
  isActive: boolean;
  onVisualise: (visualization: MapConfig["savedVisualizations"][0]) => void;
  onDelete: (visualizationId: string) => void;
}

export default function SavedVisualizationItem({
  visualization,
  isActive,
  onVisualise,
  onDelete,
}: SavedVisualizationItemProps) {
  const isBivariate = Boolean(visualization.areaDataSecondaryColumn);
  const displayName = visualization.name || 
    (isBivariate 
      ? `${visualization.areaDataColumn} × ${visualization.areaDataSecondaryColumn}`
      : visualization.areaDataColumn);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group transition-colors",
            isActive
              ? "bg-blue-50 border border-blue-200 hover:bg-blue-100"
              : "hover:bg-neutral-50"
          )}
        >
          <Save
            size={12}
            className={cn(
              "flex-shrink-0",
              isActive ? "text-blue-600" : "text-neutral-400"
            )}
          />
          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "text-xs font-medium truncate flex items-center gap-1",
                isActive && "text-blue-700"
              )}
            >
              {displayName}
              {isActive && (
                <Check size={12} className="text-blue-600 flex-shrink-0" />
              )}
              {isBivariate && (
                <span className="text-[10px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded">
                  Bivariate
                </span>
              )}
            </div>
            <div
              className={cn(
                "text-xs truncate",
                isActive ? "text-blue-600" : "text-muted-foreground"
              )}
            >
              {visualization.areaDataColumn}
              {isBivariate && ` × ${visualization.areaDataSecondaryColumn}`}
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContentWithFocus>
        <ContextMenuItem onClick={() => onVisualise(visualization)}>
          <Palette size={12} />
          Visualise on map
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onClick={() => onDelete(visualization.id)}
        >
          <TrashIcon size={12} />
          Delete saved visualization
        </ContextMenuItem>
      </ContextMenuContentWithFocus>
    </ContextMenu>
  );
}
