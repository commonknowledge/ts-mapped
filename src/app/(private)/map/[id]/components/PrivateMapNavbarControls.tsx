import { gql, useMutation } from "@apollo/client";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import { MapContext } from "@/components/Map/context/MapContext";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import type {
  DeleteMapMutation,
  DeleteMapMutationVariables,
} from "@/__generated__/types";

export default function PrivateMapNavbarControls({
  setIsEditingName,
}: {
  setIsEditingName: (isEditing: boolean) => void;
}) {
  const { mapId } = useContext(MapContext);
  const router = useRouter();
  const [deleteMapMutation] = useMutation<
    DeleteMapMutation,
    DeleteMapMutationVariables
  >(gql`
    mutation DeleteMap($id: String!) {
      deleteMap(id: $id) {
        code
      }
    }
  `);

  const handleDelete = async () => {
    if (!mapId) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this map? This action cannot be undone.",
      )
    )
      return;
    try {
      const res = await deleteMapMutation({ variables: { id: mapId } });
      if (res.data?.deleteMap?.code === 200) {
        router.push("/dashboard");
      } else {
        alert("Failed to delete map.");
      }
    } catch {
      alert("Error deleting map.");
    }
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
