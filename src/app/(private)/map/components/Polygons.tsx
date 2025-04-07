import { Geometry } from "geojson";
import { Layer, Source } from "react-map-gl/mapbox";
import { DrawnPolygon } from "@/types";

interface PolygonsProps {
  polygons: DrawnPolygon[];
}

export default function Polygons({ polygons }: PolygonsProps) {
  const features = {
    type: "FeatureCollection" as const,
    features: polygons.map((polygon) => ({
      type: "Feature" as const,
      id: polygon.id,
      geometry: polygon.geometry as Geometry,
      properties: {
        area: polygon.area,
        timestamp: polygon.timestamp,
      },
    })),
  };

  return (
    <Source id="polygons" type="geojson" data={features}>
      <Layer
        id="polygons-fill"
        type="fill"
        source="polygons"
        paint={{
          "fill-color": "#ff0000",
          "fill-opacity": 0.3,
        }}
      />
      <Layer
        id="polygons-stroke"
        type="line"
        source="polygons"
        paint={{
          "line-color": "#ff0000",
          "line-width": 2,
        }}
      />
    </Source>
  );
}
