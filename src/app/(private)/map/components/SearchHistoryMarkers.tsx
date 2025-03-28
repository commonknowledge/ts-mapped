import { Layer, Source } from "react-map-gl/mapbox";
import { SearchResult } from "@/types";
import { FeatureCollection, Point } from "geojson";
import { mapColors } from "@/app/(private)/map/styles";

interface SearchHistoryMarkersProps {
  searchHistory: SearchResult[];
}

export default function SearchHistoryMarkers({
  searchHistory,
}: SearchHistoryMarkersProps) {
  const features: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: searchHistory.map((result) => ({
      type: "Feature",
      properties: {
        text: result.text,
      },
      geometry: {
        type: "Point",
        coordinates: result.coordinates,
      },
    })),
  };

  return (
    <Source id="search-history" type="geojson" data={features}>
      <Layer
        id="search-history-pins"
        type="circle"
        source="search-history"
        paint={{
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 4, 10, 6],
          "circle-color": mapColors.searched.color,
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
          "text-color": mapColors.searched.color,
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        }}
      />
    </Source>
  );
}
