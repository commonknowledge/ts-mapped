import { Layer, Source } from "react-map-gl/mapbox";
import { DrawnPolygon } from "@/types";
import { mapColors } from "@/app/(private)/map/styles";
import { FeatureCollection, Feature, Polygon } from "geojson";
import { MapConfig } from "./Controls";
interface TurfPolygonsProps {
  polygons: DrawnPolygon[];
  mapConfig: MapConfig;
}

export default function TurfPolygons({
  polygons,
  mapConfig,
}: TurfPolygonsProps) {
  const features: FeatureCollection<Polygon> = {
    type: "FeatureCollection",
    features: polygons.map((polygon) => ({
      type: "Feature" as const,
      id: polygon.id,
      geometry: polygon.geometry,
      properties: {
        area: polygon.area,
        timestamp: polygon.timestamp,
        name: polygon.name || `${polygon.area.toFixed(2)}m²`,
      },
    })),
  };

  return (
    mapConfig.showTurf && (
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
