import { Plus } from "lucide-react";
import { useContext } from "react";
import { Marker, Popup } from "react-map-gl/mapbox";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { mapColors } from "../styles";
import type { Feature } from "geojson";

export default function SearchResultMarker() {
  const { insertPlacedMarker, searchMarker, setSearchMarker } =
    useContext(MarkerAndTurfContext);

  const center = getFeatureCenter(searchMarker);
  const label =
    (searchMarker?.properties && searchMarker.properties["name"]) ||
    "Unknown location";

  // Extract address information from Mapbox search result
  const getAddressFromSearchResult = (
    feature: Feature | null | undefined,
  ): string | null => {
    if (!feature?.properties) return null;

    const props = feature.properties;

    // Try different address fields that Mapbox might provide
    const fullAddress = props["full_address"] as string;
    const placeName = props["place_name"] as string;
    const address = props["address"] as string;
    const context = props["context"] as unknown;

    // Priority order: full_address > place_name > constructed from address + context
    if (fullAddress) {
      return fullAddress;
    }

    if (placeName) {
      return placeName;
    }

    // Otherwise, try to construct from address and context
    if (address && context && Array.isArray(context)) {
      const contextParts = context
        .map((item: unknown) => (item as { text?: string })?.text)
        .filter(Boolean)
        .join(", ");
      return `${address}, ${contextParts}`;
    }

    return null;
  };

  const address = getAddressFromSearchResult(searchMarker);

  const addMarker = () => {
    if (!searchMarker || !center) return;

    const markerData = {
      id: uuidv4(),
      label,
      notes: "",
      address: address || null,
      point: { lng: center[0], lat: center[1] },
      folderId: null,
    };

    insertPlacedMarker(markerData);

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
