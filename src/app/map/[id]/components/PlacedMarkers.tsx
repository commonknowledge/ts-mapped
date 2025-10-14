import { useContext, useMemo } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { MARKER_ID_KEY, MARKER_NAME_KEY } from "@/constants";
import { mapColors } from "../styles";
import type { FeatureCollection, Point } from "geojson";

export default function PlacedMarkers() {
  const { viewConfig } = useMapViews();
  const {
    folders,
    placedMarkers,
    selectedPlacedMarkerId,
    getMarkerVisibility,
  } = useContext(MarkerAndTurfContext);

  const visiblePlacedMarkers = useMemo(() => {
    return placedMarkers.filter((marker) => {
      // Check individual visibility first
      if (!getMarkerVisibility(marker.id)) {
        return false;
      }

      // Then check folder visibility
      if (!marker.folderId) return true;

      const parentFolder = folders.find(
        (folder) => folder.id === marker.folderId,
      );

      return !parentFolder?.hideMarkers;
    });
  }, [placedMarkers, folders, getMarkerVisibility]);

  const features: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: visiblePlacedMarkers.map((marker) => ({
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

  const selectedMarker = placedMarkers.find(
    (m) => m.id === selectedPlacedMarkerId,
  );

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
            "text-offset": [0, 1],
            "text-anchor": "top",
          }}
          paint={{
            "text-color": mapColors.markers.color,
            "text-halo-color": "#ffffff",
            "text-halo-width": 1,
          }}
        />

        {/* selected marker ring*/}
        {selectedMarker && (
          <Layer
            id="search-history-selected-marker-ring"
            type="circle"
            source="search-history"
            filter={["==", ["get", MARKER_ID_KEY], selectedMarker.id]}
            paint={{
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                8,
                5,
                16,
                10,
              ],
              "circle-color": "#ffffff",
              "circle-opacity": 0,
              "circle-stroke-width": 2,
              "circle-stroke-color": mapColors.markers.color,
            }}
          />
        )}
      </Source>
    )
  );
}
