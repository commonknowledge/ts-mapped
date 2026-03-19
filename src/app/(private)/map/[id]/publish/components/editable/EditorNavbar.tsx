import { ChevronRight } from "lucide-react";

import { useMapId } from "@/app/(private)/map/[id]/hooks/useMapCore";
import { useMapQuery } from "@/app/(private)/map/[id]/hooks/useMapQuery";
import Navbar from "@/components/layout/Navbar";
import { Link } from "@/components/Link";
import MapModeToggle from "@/components/MapModeToggle";
import { usePublicMapValue } from "../../hooks/usePublicMap";

export default function PublicMapEditorNavbar() {
  const mapId = useMapId();
  const { data: map } = useMapQuery(mapId);
  const publicMap = usePublicMapValue();

  return (
    <Navbar>
      <div className="flex justify-between items-center gap-4 w-full">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Link
            href="/maps"
            className="text-neutral-500 hover:text-neutral-800"
          >
            Maps
          </Link>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
          <p className="truncate max-w-[300px]">
            {publicMap ? publicMap.name || (map ? map.name : "") : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {mapId && publicMap?.viewId && <MapModeToggle mode="public" />}
        </div>
      </div>
    </Navbar>
  );
}
