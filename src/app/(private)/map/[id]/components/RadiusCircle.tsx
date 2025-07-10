import * as turf from "@turf/turf";
import { useContext, useEffect, useState } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { MapContext } from "../context/MapContext";
import { mapColors } from "../styles";

interface RadiusCircleProps {
  selectedMarkerId: string | null;
  radiusMiles: number;
}

export default function RadiusCircle({
  selectedMarkerId,
  radiusMiles,
}: RadiusCircleProps) {
  const { markersQuery, placedMarkers } = useContext(MapContext);
  const [circleData, setCircleData] = useState<{
    type: "FeatureCollection";
    features: {
      type: "Feature";
      geometry: {
        type: "Polygon";
        coordinates: number[][][];
      };
      properties: Record<string, unknown>;
    }[];
  } | null>(null);

  useEffect(() => {
    if (!selectedMarkerId || !radiusMiles) {
      setCircleData(null);
      return;
    }

    // Find the selected marker
    let selectedMarker: { coordinates: [number, number] } | null = null;

    // Check placed markers first
    const placedMarker = placedMarkers.find(
      (marker) => `placed-${marker.id}` === selectedMarkerId
    );
    if (placedMarker) {
      selectedMarker = {
        coordinates: [placedMarker.point.lng, placedMarker.point.lat],
      };
    }

    // Check data source markers
    if (!selectedMarker && markersQuery?.data?.dataSource?.markers?.features) {
      const dataMarker = markersQuery.data.dataSource.markers.features.find(
        (feature) =>
          (feature.properties.__externalId || feature.properties.id) ===
          selectedMarkerId
      );
      if (dataMarker) {
        selectedMarker = {
          coordinates: dataMarker.geometry.coordinates,
        };
      }
    }

    if (!selectedMarker) {
      setCircleData(null);
      return;
    }

    // Convert miles to meters (1 mile = 1609.34 meters)
    const radiusMeters = radiusMiles * 1609.34;

    // Create a circle using turf.js
    const center = turf.point(selectedMarker.coordinates);
    const circle = turf.circle(center, radiusMeters / 1000, {
      units: "kilometers",
    });

    setCircleData({
      type: "FeatureCollection",
      features: [
        circle as unknown as {
          type: "Feature";
          geometry: {
            type: "Polygon";
            coordinates: number[][][];
          };
          properties: Record<string, unknown>;
        },
      ],
    });
  }, [
    selectedMarkerId,
    radiusMiles,
    placedMarkers,
    markersQuery?.data?.dataSource?.markers?.features,
  ]);

  if (!circleData) {
    return null;
  }

  return (
    <Source id="radius-circle" type="geojson" data={circleData}>
      <Layer
        id="radius-circle-fill"
        type="fill"
        paint={{
          "fill-color": mapColors.markers.color,
          "fill-opacity": 0.1,
        }}
      />
      <Layer
        id="radius-circle-stroke"
        type="line"
        paint={{
          "line-color": mapColors.markers.color,
          "line-width": 2,
          "line-dasharray": [2, 2],
        }}
      />
    </Source>
  );
}
