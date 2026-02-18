"use client";

import * as turfLib from "@turf/turf";
import { EyeIcon, EyeOffIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { LayerType } from "@/types";
import { useMapConfig } from "../../../hooks/useMapConfig";
import { useShowControls } from "../../../hooks/useMapControls";
import { useMapRef } from "../../../hooks/useMapCore";
import { useTurfMutations } from "../../../hooks/useTurfMutations";
import { useTurfState } from "../../../hooks/useTurfState";
import { CONTROL_PANEL_WIDTH } from "../../../styles";
import ControlEditForm from "../ControlEditForm";
import ControlWrapper from "../ControlWrapper";
import type { Turf } from "@/server/models/Turf";

export default function TurfItem({ turf }: { turf: Turf }) {
  const mapRef = useMapRef();
  const showControls = useShowControls();
  const { getTurfVisibility, setTurfVisibility } = useTurfState();
  const { updateTurf, deleteTurf } = useTurfMutations();

  const [isEditing, setEditing] = useState(false);
  const [editText, setEditText] = useState(turf.label);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { mapConfig } = useMapConfig();

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
        color={mapConfig.turfColor}
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
              <button
                className="flex items-center gap-2 w-full min-h-full p-1 rounded transition-colors hover:bg-neutral-100 text-left cursor-pointer"
                onClick={() => handleFlyTo(turf)}
              >
                {turf.label || `Area: ${turf.area?.toFixed(2)}m²`}
              </button>
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

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        description={`This action cannot be undone. This will permanently delete the area "${turf.label || `Area: ${turf.area?.toFixed(2)}m²`}".`}
        onConfirm={handleDelete}
      />
    </>
  );
}
