"use client";

import * as turfLib from "@turf/turf";
import { EyeIcon, EyeOffIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
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
import { LayerType } from "@/types";
import { useShowControls } from "../../../hooks/useMapControls";
import { useMapRef } from "../../../hooks/useMapCore";
import { useTurfMutations } from "../../../hooks/useTurfMutations";
import { useTurfState } from "../../../hooks/useTurfState";
import { CONTROL_PANEL_WIDTH, mapColors } from "../../../styles";
import ControlEditForm from "../ControlEditForm";
import ControlWrapper from "../ControlWrapper";
import LayerIcon from "../LayerIcon";
import type { Turf } from "@/server/models/Turf";

export default function TurfItem({ turf }: { turf: Turf }) {
  const mapRef = useMapRef();
  const showControls = useShowControls();
  const { getTurfVisibility, setTurfVisibility } = useTurfState();
  const { updateTurf, deleteTurf } = useTurfMutations();

  const [isEditing, setEditing] = useState(false);
  const [editText, setEditText] = useState(turf.label);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [layerColor, setLayerColor] = useState(mapColors.areas.color);

  const handleFlyTo = (turf: Turf) => {
    const map = mapRef?.current;
    if (!map) return;

    // the bounding box of the polygon
    const bbox = turfLib.bbox(turf.polygon);
    const padding = 20;

    map.fitBounds(
      [
        [bbox[0], bbox[1]], // southwest corner
        [bbox[2], bbox[3]], // northeast corner
      ],
      {
        padding: {
          left: showControls ? CONTROL_PANEL_WIDTH + padding : padding,
          top: padding,
          right: padding,
          bottom: padding,
        },
        duration: 1000,
      },
    );
  };

  const isVisible = getTurfVisibility(turf.id);

  // Update editText when turf.label changes
  useEffect(() => {
    setEditText(turf.label);
  }, [turf.label]);

  const onEdit = () => {
    setEditText(turf.label);
    setEditing(true);
  };

  const onSubmit = () => {
    if (editText.trim() && editText !== turf.label) {
      updateTurf({ ...turf, label: editText.trim() });
      toast.success("Area renamed successfully");
    }
    setEditing(false);
  };

  const handleDelete = () => {
    deleteTurf(turf.id);
    setShowDeleteDialog(false);
    toast.success("Area deleted successfully");
  };

  return (
    <>
      <ControlWrapper
        name={turf.label}
        layerType={LayerType.Turf}
        isVisible={isVisible}
        onVisibilityToggle={() => setTurfVisibility(turf.id, !isVisible)}
      >
        {isEditing ? (
          <ControlEditForm
            initialValue={editText}
            onChange={setEditText}
            onSubmit={onSubmit}
          />
        ) : (
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="flex items-center justify-between min-w-0 gap-1">
                <LayerIcon
                  layerType={LayerType.Turf}
                  isDataSource={false}
                  layerColor={layerColor}
                  onColorChange={setLayerColor}
                />
                <button
                  className="flex flex-col items-start w-full min-w-0 min-h-full p-1 rounded transition-colors hover:bg-neutral-100 text-left cursor-pointer"
                  onClick={() => handleFlyTo(turf)}
                >
                  <div className="text-sm font-medium truncate w-full">
                    {turf.label || `Area: ${turf.area?.toFixed(2)}m²`}
                  </div>
                  <div className="text-xs text-muted-foreground truncate w-full">Area</div>
                </button>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={onEdit}>
                <PencilIcon size={12} />
                Rename
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => setTurfVisibility(turf.id, !isVisible)}
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
              <ContextMenuItem
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <TrashIcon size={12} />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )}
      </ControlWrapper>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              area "{turf.label || `Area: ${turf.area?.toFixed(2)}m²`}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
