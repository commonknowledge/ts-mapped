import { ChevronRight } from "lucide-react";

import { useMapId } from "@/app/map/[id]/hooks/useMapCore";
import { useMapQuery } from "@/app/map/[id]/hooks/useMapQuery";
import Navbar from "@/components/layout/Navbar";
import { Link } from "@/components/Link";
import MapVisibilityToggle from "@/components/MapVisibilityToggle";
import { usePublicMapValue } from "../../hooks/usePublicMap";

export default function EditorNavbar() {
  const mapId = useMapId();
  const { data: map } = useMapQuery(mapId);
  const publicMap = usePublicMapValue();

  return (
    <Navbar>
      <div className="flex justify-between items-center gap-4 w-full">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Link
            href="/dashboard"
            className="text-neutral-500 hover:text-neutral-800"
          >
            Maps
          </Link>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
          <p className="truncate max-w-[300px]">
            {publicMap?.name || (map ? map.name : "")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {mapId && publicMap?.viewId && <MapVisibilityToggle mode="public" />}
        </div>
      </div>
    </Navbar>
  );
}
