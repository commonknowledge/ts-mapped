import { FeatureCollection, Point } from "geojson";
import { useContext } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { mapColors } from "@/app/(private)/map/[id]/styles";

export default function PlacedMarkers() {
  const { viewConfig } = useContext(MapContext);
  const { placedMarkers } = useContext(MarkerAndTurfContext);

  const features: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: placedMarkers.map((marker) => ({
      type: "Feature",
      properties: {
        text: marker.label,
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
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 4, 10, 6],
            "circle-color": mapColors.markers.color,
            "circle-opacity": 0.8,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
          }}
        />
        <Layer
          id="search-history-labels"
          type="symbol"
          minzoom={10}
          source="search-history"
          layout={{
            "text-field": [
              "concat",
              ["slice", ["get", "text"], 0, 20],
              ["case", [">", ["length", ["get", "text"]], 20], "...", ""],
            ],
            "text-size": 12,
            "text-anchor": "top",
            "text-offset": [0, 0.75],
          }}
          paint={{
            "text-color": mapColors.markers.color,
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          }}
        />
      </Source>
    )
  );
}
