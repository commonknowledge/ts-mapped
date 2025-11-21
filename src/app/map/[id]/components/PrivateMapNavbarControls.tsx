import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
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

export default function PrivateMapNavbarControls({
  setIsEditingName,
  mapId: propMapId,
  onMenuToggle,
}: {
  setIsEditingName?: (isEditing: boolean) => void;
  mapId: string;
  onMenuToggle?: (isOpen: boolean) => void;
}) {
  const mapId = propMapId;
  const router = useRouter();
  const pathname = usePathname();
  const { organisationId } = useOrganisations();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const duplicateNameRef = useRef<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { mutate: deleteMapMutation } = useMutation(
    trpc.map.delete.mutationOptions({
      onSuccess: () => {
        // Invalidate the map list query to refresh dashboard
        queryClient.invalidateQueries({
          queryKey: trpc.map.list.queryKey({
            organisationId: organisationId || "",
          }),
        });

        // Only navigate to dashboard if user isn't already on it
        if (!pathname || !pathname.startsWith("/dashboard")) {
          router.push("/dashboard");
        }
      },
      onError: () => {
        toast.error("Failed to delete map.");
      },
    }),
  );

  const { mutate: createMapMutation } = useMutation(
    trpc.map.create.mutationOptions({
      onSuccess: async (newMap) => {
        // Get the original map data
        const originalMap = queryClient.getQueryData(
          trpc.map.byId.queryKey({ mapId }),
        );

        const targetName = duplicateNameRef.current || "Untitled Map (copy)";

        if (originalMap) {
          // Update the new map with the name, config, and image
          await queryClient
            .getMutationCache()
            .build(queryClient, trpc.map.update.mutationOptions())
            .execute({
              mapId: newMap.id,
              name: targetName,
              config: originalMap.config,
              imageUrl: originalMap.imageUrl,
            });

          // Copy views if they exist
          if (originalMap.views && originalMap.views.length > 0) {
            await queryClient
              .getMutationCache()
              .build(queryClient, trpc.map.updateViews.mutationOptions())
              .execute({
                mapId: newMap.id,
                views: originalMap.views.map((view) => ({
                  id: view.id,
                  name: view.name,
                  position: view.position,
                  config: view.config,
                  dataSourceViews: view.dataSourceViews,
                })),
              });
          }
        }

        // Invalidate the map list query to refresh dashboard
        queryClient.invalidateQueries({
          queryKey: trpc.map.list.queryKey({
            organisationId: organisationId || "",
          }),
        });

        // Only navigate if not on dashboard
        if (!pathname || !pathname.startsWith("/dashboard")) {
          router.push(`/map/${newMap.id}`);
        }

        toast.success("Map duplicated successfully");
        duplicateNameRef.current = null; // Reset after use
      },
      onError: () => {
        toast.error("Failed to duplicate map.");
        duplicateNameRef.current = null; // Reset on error
      },
    }),
  );

  const handleDelete = async () => {
    if (!mapId) return;
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!mapId) return;
    deleteMapMutation({ mapId });
    setShowDeleteDialog(false);
  };

  const handleDuplicate = async () => {
    if (!mapId || !organisationId) return;

    // Fetch the original map data (it may not be in cache if we're on dashboard)
    let originalMap = queryClient.getQueryData(
      trpc.map.byId.queryKey({ mapId }),
    );

    // If not in cache, fetch it
    if (!originalMap) {
      try {
        originalMap = await queryClient.fetchQuery(
          trpc.map.byId.queryOptions({ mapId }),
        );
      } catch {
        toast.error("Failed to load map data");
        return;
      }
    }

    if (!originalMap) {
      toast.error("Failed to load map data");
      return;
    }

    // Get all maps to determine the copy number
    const allMaps = queryClient.getQueryData(
      trpc.map.list.queryKey({ organisationId }),
    );

    // Generate the new name with copy suffix
    const baseName = originalMap.name;

    // Check if there are existing copies
    const copyPattern = new RegExp(
      `^${baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\(copy(?: (\\d+))?\\)$`,
    );
    let maxCopyNumber = 0;

    allMaps?.forEach((map) => {
      const match = map.name.match(copyPattern);
      if (match) {
        const copyNum = match[1] ? parseInt(match[1], 10) : 1;
        maxCopyNumber = Math.max(maxCopyNumber, copyNum);
      }
    });

    // Generate new name
    let newName: string;
    if (maxCopyNumber === 0) {
      newName = `${baseName} (copy)`;
    } else {
      newName = `${baseName} (copy ${maxCopyNumber + 1})`;
    }

    // Store the name in ref for use in onSuccess
    duplicateNameRef.current = newName;

    // Create the new map
    createMapMutation({ organisationId });
  };

  const getDropdownItems = (): (DropdownItem | DropdownSeparator)[] => {
    const items: (DropdownItem | DropdownSeparator)[] = [];

    if (setIsEditingName) {
      items.push({
        type: "item" as const,
        label: "Rename map",
        onClick: () => setIsEditingName(true),
      });
    }

    items.push({
      type: "item" as const,
      label: "Duplicate",
      onClick: handleDuplicate,
    });

    items.push({
      type: "item" as const,
      label: "Delete map",
      onClick: handleDelete,
    });

    return items;
  };

  return (
    <>
      <IconButtonWithTooltip
        align="start"
        side="right"
        tooltip="Map options"
        dropdownLabel="Map options"
        dropdownItems={getDropdownItems()}
        onMenuToggle={onMenuToggle}
      >
        <MoreHorizontal className="w-4 h-4" />
      </IconButtonWithTooltip>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete map</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this map? This action cannot be
              undone.
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
