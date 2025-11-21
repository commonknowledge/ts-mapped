import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useTRPC } from "@/services/trpc/react";
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
  const { mutate } = useMutation(
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

  const handleDelete = async () => {
    if (!mapId) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this map? This action cannot be undone.",
      )
    )
      return;
    mutate({ mapId });
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
      label: "Delete map",
      onClick: handleDelete,
    });

    items.push({
      type: "item" as const,
      label: "Duplicate",
      onClick: () => null,
    });

    return items;
  };

  return (
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
  );
}
