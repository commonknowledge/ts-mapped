import { Layer, Source } from "react-map-gl/mapbox";
import { DrawnPolygon } from "@/types";
import { mapColors } from "@/lib/mapStyles";
import { FeatureCollection, Feature, Polygon } from "geojson";

interface TurfPolygonsProps {
  polygons: DrawnPolygon[];
}

export default function TurfPolygons({ polygons }: TurfPolygonsProps) {
  const features: FeatureCollection<Polygon> = {
    type: "FeatureCollection",
    features: polygons.map((polygon) => ({
      type: "Feature" as const,
      id: polygon.id,
      geometry: polygon.geometry,
      properties: {
        area: polygon.area,
        timestamp: polygon.timestamp,
      },
    })),
  };

  return (
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
    </Source>
  );
}
