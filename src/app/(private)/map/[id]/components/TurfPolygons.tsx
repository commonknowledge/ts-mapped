import { FeatureCollection, Polygon } from "geojson";
import { useContext } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { mapColors } from "@/app/(private)/map/[id]/styles";

export default function TurfPolygons() {
  const { viewConfig, turfHistory } = useContext(MapContext);

  const features: FeatureCollection<Polygon> = {
    type: "FeatureCollection",
    features: turfHistory.map((polygon) => ({
      type: "Feature" as const,
      id: polygon.id,
      geometry: polygon.geometry as Polygon,
      properties: {
        area: polygon.area,
        timestamp: polygon.timestamp,
        name: polygon.name || `${polygon.area.toFixed(2)}m²`,
      },
    })),
  };

  return (
    viewConfig.showTurf && (
      <Source id="turf-polygons" type="geojson" data={features}>
        <Layer
          id="turf-polygons-fill"
          type="fill"
          paint={{
            "fill-color": mapColors.turf.color,
            "fill-opacity": 0.3,
          }}
        />
        <Layer
          id="turf-polygons-stroke"
          type="line"
          paint={{
            "line-color": mapColors.turf.color,
            "line-width": 2,
          }}
        />
        <Layer
          id="turf-polygons-labels"
          type="symbol"
          minzoom={10}
          layout={{
            "text-field": ["get", "name"],
            "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 16,
            "text-anchor": "center",
            "text-justify": "center",
            "symbol-placement": "point",
            "text-allow-overlap": true,
          }}
          paint={{
            "text-color": mapColors.turf.textColor,
            "text-halo-color": "#fff",
            "text-halo-width": 1,
          }}
        />
      </Source>
    )
  );
}
