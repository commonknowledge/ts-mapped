import { useMutation } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import { toast } from "sonner";
import { MapContext } from "@/components/Map/context/MapContext";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";

export default function PrivateMapNavbarControls({
  setIsEditingName,
}: {
  setIsEditingName: (isEditing: boolean) => void;
}) {
  const { mapId } = useContext(MapContext);
  const router = useRouter();
  const trpc = useTRPC();
  const { mutate } = useMutation(
    trpc.map.delete.mutationOptions({
      onSuccess: () => {
        router.push("/dashboard");
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="!p-1">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => setIsEditingName(true)}>
          Rename map
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600 focus:text-red-600"
        >
          Delete map
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
