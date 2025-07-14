"use client";

import { gql, useMutation } from "@apollo/client";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { useContext, useState } from "react";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { Link } from "./Link";

export default function MapNavbar() {
  const { mapName, setMapName, mapId } = useContext(MapContext);

  const [isEditingName, setIsEditingName] = useState(false);

  const [updateMapName] = useMutation(gql`
    mutation UpdateMapName($id: String!, $mapInput: MapInput!) {
      updateMap(id: $id, map: $mapInput) {
        code
        result {
          id
          name
        }
      }
    }
  `);

  const onSubmitSaveName = async () => {
    const queryResponse = await updateMapName({
      variables: {
        id: mapId,
        mapInput: {
          name: mapName,
        },
      },
    });
    const { data } = queryResponse;
    setIsEditingName(false);
    setMapName(data.updateMap.result.name);
    if (data.updateMap.code === 200) {
      console.log("Map name updated");
    } else {
      console.log("Failed to update map name");
    }
  };

  return (
    <nav className="flex justify-between items-center p-4 z-10 h-14 border-b border-neutral-200 bg-white">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Mapped" width={24} height={24} />
        </Link>
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Link
            href="/dashboard"
            className="text-neutral-500 hover:text-neutral-800"
          >
            Maps
          </Link>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
          <div className="flex items-center gap-1">
            {isEditingName ? (
              <>
                <input
                  type="text"
                  value={mapName || ""}
                  className="px-3 py-1 border border-neutral-300 rounded text-sm"
                  onChange={(e) => setMapName(e.target.value)}
                />
                <Button variant="outline" size="sm" onClick={onSubmitSaveName}>
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingName(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <p>{mapName || "Loading..."}</p>
            )}
            <MapEditDropdown setIsEditingName={setIsEditingName} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4"></div>
    </nav>
  );
}

function MapEditDropdown({
  setIsEditingName,
}: {
  setIsEditingName: (isEditing: boolean) => void;
}) {
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
