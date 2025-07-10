import { FeatureCollection, Polygon } from "geojson";
import { useContext } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { mapColors } from "@/app/(private)/map/[id]/styles";

export default function TurfPolygons() {
  const { viewConfig, turfs } = useContext(MapContext);

  const features: FeatureCollection<Polygon> = {
    type: "FeatureCollection",
    features: turfs.map((t) => ({
      type: "Feature" as const,
      id: t.id,
      geometry: t.geometry as Polygon,
      properties: {
        area: t.area,
        createdAt: t.createdAt,
        label: t.label,
        notes: t.notes,
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
            "fill-color": mapColors.areas.color,
            "fill-opacity": 0.3,
          }}
        />
        <Layer
          id="turf-polygons-stroke"
          type="line"
          paint={{
            "line-color": mapColors.areas.color,
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
            "text-color": mapColors.areas.textColor,
            "text-halo-color": "#fff",
            "text-halo-width": 1,
          }}
        />
      </Source>
    )
  );
}
