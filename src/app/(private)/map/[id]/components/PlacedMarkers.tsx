import { FeatureCollection, Point } from "geojson";
import { useContext } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { mapColors } from "@/app/(private)/map/[id]/styles";
import { MARKER_ID_KEY, MARKER_NAME_KEY } from "@/constants";

export default function PlacedMarkers() {
  const { viewConfig } = useContext(MapContext);
  const { placedMarkers } = useContext(MarkerAndTurfContext);

  const features: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: placedMarkers.map((marker) => ({
      type: "Feature",
      properties: {
        [MARKER_ID_KEY]: marker.id,
        [MARKER_NAME_KEY]: marker.label,
      },
      geometry: {
        type: "Point",
        coordinates: [marker.point.lng, marker.point.lat],
      },
    })),
  };

  return (
    viewConfig.showLocations && (
      <Source id="search-history" type="geojson" data={features}>
        <Layer
          id="search-history-pins"
          type="circle"
          source="search-history"
          paint={{
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 3, 16, 8],
            "circle-color": mapColors.markers.color,
            "circle-opacity": 0.8,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
          }}
        />

        {/* Labels for pins at higher zooms */}
        <Layer
          id={`search-history-labels`}
          type="symbol"
          source="search-history"
          minzoom={12}
          layout={{
            "text-field": ["get", MARKER_NAME_KEY],
            "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
            "text-transform": "uppercase",
            "text-offset": [0, 0.75],
            "text-anchor": "top",
          }}
          paint={{
            "text-color": mapColors.markers.color,
            "text-halo-color": "#ffffff",
            "text-halo-width": 1,
          }}
        />
      </Source>
    )
  );
}
