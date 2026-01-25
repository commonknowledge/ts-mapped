import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/mapbox";

import { useFoldersQuery } from "@/app/map/[id]/hooks/useFolders";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import {
  usePlacedMarkerState,
  usePlacedMarkersQuery,
} from "@/app/map/[id]/hooks/usePlacedMarkers";
import { mapColors } from "../styles";
import type { FeatureCollection, Point } from "geojson";

export default function PlacedMarkers() {
  const { viewConfig } = useMapViews();
  const { mapConfig } = useMapConfig();
  const { data: folders = [] } = useFoldersQuery();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const { selectedPlacedMarkerId, getPlacedMarkerVisibility } =
    usePlacedMarkerState();

  const visiblePlacedMarkers = useMemo(() => {
    return placedMarkers.filter((marker) => {
      if (!getPlacedMarkerVisibility(marker.id)) {
        return false;
      }

      if (!marker.folderId) return true;

      const parentFolder = folders.find(
        (folder) => folder.id === marker.folderId,
      );

      return !parentFolder?.hideMarkers;
    });
  }, [placedMarkers, folders, getPlacedMarkerVisibility]);

  const features: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: visiblePlacedMarkers.map((marker) => ({
      type: "Feature",
      properties: {
        id: marker.id,
        name: marker.label,
        color:
          (marker.folderId && mapConfig.folderColors?.[marker.folderId]) ??
          mapConfig.placedMarkerColors?.[marker.id] ??
          mapColors.markers.color,
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
            "circle-color": ["get", "color"],
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
            "text-field": ["get", "name"],
            "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
            "text-transform": "uppercase",
            "text-offset": [0, 1],
            "text-anchor": "top",
          }}
          paint={{
            "text-color": ["get", "color"],
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
            filter={["==", ["get", "id"], selectedMarker.id]}
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
              "circle-stroke-color": ["get", "color"],
            }}
          />
        )}
      </Source>
    )
  );
}
