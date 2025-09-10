import { Plus } from "lucide-react";
import { useContext } from "react";
import { Marker, Popup } from "react-map-gl/mapbox";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import { mapColors } from "@/components/Map/styles";

export default function SearchResultMarker() {
  const { insertPlacedMarker, searchMarker, setSearchMarker } =
    useContext(MarkerAndTurfContext);

  const addMarker = () => {
    if (!searchMarker) {
      return;
    }

    insertPlacedMarker({
      id: uuidv4(),
      label: searchMarker.place_name,
      notes: "",
      point: { lng: searchMarker.center[0], lat: searchMarker.center[1] },
      folderId: null,
    });

    setSearchMarker(null);
    toast.success("Marker added!");
  };

  if (!searchMarker) return <></>;

  return (
    <>
      <Marker
        longitude={searchMarker.center[0]}
        latitude={searchMarker.center[1]}
      >
        <MarkerIcon />
      </Marker>
      <Popup
        longitude={searchMarker.center[0]}
        latitude={searchMarker.center[1]}
        offset={8}
        closeButton={false}
        onClose={() => setSearchMarker(null)}
        style={{
          fontFamily: "IBM Plex Sans",
        }}
      >
        <div className="flex items-center gap-2 pb-2 border-b / font-semibold text-sm">
          {/* <MarkerIcon /> */}
          {searchMarker.text}
        </div>
        <button
          onClick={() => addMarker()}
          className="flex items-center gap-2 mt-2 cursor-pointer"
        >
          <Plus size={12} />
          <span className="inline-flex items-center gap-[0.5em] text-sm">
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
