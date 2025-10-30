import { Plus } from "lucide-react";
import { Marker, Popup } from "react-map-gl/mapbox";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { usePlacedMarkerMutations } from "@/app/map/[id]/hooks/usePlacedMarkers";
import { usePrivateMapStore } from "@/app/map/[id]/stores/usePrivateMapStore";
import { mapColors } from "../styles";
import type { Feature } from "geojson";

export default function SearchResultMarker() {
  const searchMarker = usePrivateMapStore((s) => s.searchMarker);
  const setSearchMarker = usePrivateMapStore((s) => s.setSearchMarker);
  const { insertPlacedMarker } = usePlacedMarkerMutations();

  const center = getFeatureCenter(searchMarker);
  const label =
    (searchMarker?.properties && searchMarker.properties["name"]) ||
    "Unknown location";

  const addMarker = () => {
    if (!searchMarker || !center) return;

    insertPlacedMarker({
      id: uuidv4(),
      label,
      notes: "",
      point: { lng: center[0], lat: center[1] },
      folderId: null,
    });

    setSearchMarker(null);
    toast.success("Marker added!");
  };

  if (!searchMarker || !center) return <></>;

  return (
    <>
      <Marker longitude={center[0]} latitude={center[1]}>
        <MarkerIcon />
      </Marker>
      <Popup
        longitude={center[0]}
        latitude={center[1]}
        offset={8}
        closeButton={false}
        onClose={() => setSearchMarker(null)}
      >
        <div className="flex items-center gap-2 pb-2 border-b / font-sans font-semibold text-sm">
          {label}
        </div>
        <button
          onClick={() => addMarker()}
          className="flex items-center gap-2 mt-2 cursor-pointer"
        >
          <Plus size={12} />
          <span className="font-sans inline-flex items-center gap-[0.5em] text-sm">
            Add to your
            <span className="inline-flex items-center gap-[0.3em] font-semibold">
              <MarkerIcon />
              Markers
            </span>
          </span>
        </button>
      </Popup>
    </>
  );
}

const MarkerIcon = () => {
  return (
    <div
      className="w-2 h-2 rounded-full"
      style={{ background: mapColors.markers.color }}
    ></div>
  );
};

const getFeatureCenter = (feature: Feature | null | undefined) => {
  if (!feature) {
    return null;
  }
  switch (feature.geometry.type) {
    case "Point":
      return feature.geometry.coordinates;
    default:
      return null;
  }
};
