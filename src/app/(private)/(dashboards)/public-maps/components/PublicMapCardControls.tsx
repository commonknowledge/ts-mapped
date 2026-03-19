"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useTRPC } from "@/services/trpc/react";
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
import type {
  DropdownItem,
  DropdownSeparator,
} from "@/components/MultiDropdownMenu";

export default function PublicMapCardControls({
  publicMapId,
  onMenuToggle,
}: {
  publicMapId: string;
  onMenuToggle?: (isOpen: boolean) => void;
}) {
  const { organisationId } = useOrganisations();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { mutate: unpublishMutation } = useMutation(
    trpc.publicMap.unpublish.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.publicMap.list.queryKey({
            organisationId: organisationId || "",
          }),
        });
        toast.success("Public map unpublished.");
      },
      onError: () => {
        toast.error("Failed to unpublish public map.");
      },
    }),
  );

  const { mutate: deleteMutation } = useMutation(
    trpc.publicMap.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.publicMap.list.queryKey({
            organisationId: organisationId || "",
          }),
        });
        toast.success("Public map deleted.");
      },
      onError: () => {
        toast.error("Failed to delete public map.");
      },
    }),
  );

  const handleUnpublish = () => {
    if (!publicMapId || !organisationId) return;
    unpublishMutation({ publicMapId, organisationId });
  };

  const handleDelete = () => {
    if (!publicMapId) return;
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!publicMapId || !organisationId) return;
    deleteMutation({ publicMapId, organisationId });
    setShowDeleteDialog(false);
  };

  const getDropdownItems = (): (DropdownItem | DropdownSeparator)[] => {
    return [
      {
        type: "item" as const,
        label: "Unpublish",
        onClick: handleUnpublish,
      },
      { type: "separator" as const },
      {
        type: "item" as const,
        label: "Delete public map",
        onClick: handleDelete,
      },
    ];
  };

  return (
    <>
      <IconButtonWithTooltip
        align="start"
        side="right"
        tooltip="Public map options"
        dropdownLabel="Public map options"
        dropdownItems={getDropdownItems()}
        onMenuToggle={onMenuToggle}
      >
        <MoreHorizontal className="w-4 h-4" />
      </IconButtonWithTooltip>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete public map</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this public map? The underlying
              private map will not be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
