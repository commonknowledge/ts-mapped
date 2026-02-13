import { Plus } from "lucide-react";
import { Layer, Marker, Popup, Source } from "react-map-gl/mapbox";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  usePlacedMarkerMutations,
  usePlacedMarkerState,
} from "@/app/map/[id]/hooks/usePlacedMarkers";
import { useTurfMutations } from "@/app/map/[id]/hooks/useTurfMutations";
import { mapColors } from "../styles";
import type { PolygonOrMultiPolygon } from "@/server/models/Turf";
import type { Feature } from "geojson";

export default function SearchResultMarker() {
  const { mapSearchResult, setMapSearchResult } = usePlacedMarkerState();
  const { insertPlacedMarker } = usePlacedMarkerMutations();
  const { insertTurf } = useTurfMutations();

  const center = getFeatureCenter(mapSearchResult);
  const label =
    (mapSearchResult?.properties && mapSearchResult.properties["name"]) ||
    "Unknown location";

  const addMarker = () => {
    if (!mapSearchResult || !center) return;

    insertPlacedMarker({
      id: uuidv4(),
      label,
      notes: "",
      point: { lng: center[0], lat: center[1] },
      folderId: null,
    });

    setMapSearchResult(null);
    toast.success("Marker added!");
  };

  if (!mapSearchResult || !center) return <></>;

  const isPolygon =
    mapSearchResult.geometry.type === "Polygon" ||
    mapSearchResult.geometry.type === "MultiPolygon";

  return (
    <>
      {isPolygon && (
        <Source id="map-search-result" type="geojson" data={mapSearchResult}>
          <Layer
            id="map-search-result-fill"
            type="fill"
            paint={{
              "fill-color": mapColors.areas.color,
              "fill-opacity": 0.2,
            }}
          />
          <Layer
            id="map-search-result-line"
            type="line"
            paint={{
              "line-color": mapColors.areas.textColor,
              "line-width": 2,
            }}
          />
        </Source>
      )}
      {!isPolygon && (
        <Marker longitude={center[0]} latitude={center[1]}>
          <MarkerIcon color={mapColors.markers.color} />
        </Marker>
      )}
      <Popup
        longitude={center[0]}
        latitude={center[1]}
        offset={8}
        closeButton={false}
        onClose={() => setMapSearchResult(null)}
      >
        <div className="flex items-center gap-2 pb-2 border-b / font-sans font-semibold text-sm">
          {label}
        </div>
        <button
          onClick={() => {
            if (isPolygon) {
              // Add as turf/area
              if (!mapSearchResult) return;

              const areaName =
                mapSearchResult.properties?.name || "Unknown Area";
              const areaSetName = mapSearchResult.properties?.areaSetName;
              const fullLabel = areaSetName
                ? `${areaName} (${areaSetName})`
                : areaName;

              // Calculate area in square meters
              const area = 0; // Will be calculated by backend

              insertTurf({
                id: uuidv4(),
                label: fullLabel,
                notes: "",
                area,
                polygon: mapSearchResult.geometry as PolygonOrMultiPolygon,
              });

              setMapSearchResult(null);
              toast.success("Area added!");
            } else {
              // Add as marker
              addMarker();
            }
          }}
          className="flex items-center gap-2 mt-2 cursor-pointer"
        >
          <Plus size={12} />
          <span className="font-sans inline-flex items-center gap-[0.5em] text-sm">
            Add to your
            <span className="inline-flex items-center gap-[0.3em] font-semibold">
              <MarkerIcon
                color={
                  isPolygon ? mapColors.areas.color : mapColors.markers.color
                }
              />
              {isPolygon ? "Areas" : "Markers"}
            </span>
          </span>
        </button>
      </Popup>
    </>
  );
}

const MarkerIcon = ({ color }: { color: string }) => {
  return (
    <div className="w-2 h-2 rounded-full" style={{ background: color }}></div>
  );
};

const getFeatureCenter = (
  feature: Feature | null | undefined,
): [number, number] | null => {
  if (!feature) {
    return null;
  }
  switch (feature.geometry.type) {
    case "Point":
      return feature.geometry.coordinates as [number, number];
    case "Polygon": {
      const coords = feature.geometry.coordinates as number[][][];
      const ring = coords[0] as [number, number][];
      const center = ring.reduce(
        (acc, coord) =>
          [acc[0] + coord[0], acc[1] + coord[1]] as [number, number],
        [0, 0] as [number, number],
      );
      return [center[0] / ring.length, center[1] / ring.length];
    }
    case "MultiPolygon": {
      const coords = feature.geometry.coordinates as number[][][][];
      const firstPolygon = coords[0][0] as [number, number][];
      const center = firstPolygon.reduce(
        (acc, coord) =>
          [acc[0] + coord[0], acc[1] + coord[1]] as [number, number],
        [0, 0] as [number, number],
      );
      return [center[0] / firstPolygon.length, center[1] / firstPolygon.length];
    }
    default:
      return null;
  }
};
