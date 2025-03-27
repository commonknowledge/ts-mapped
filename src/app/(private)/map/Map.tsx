import { ReactNode, RefObject } from "react";
import MapGL, { MapRef } from "react-map-gl/mapbox";
import { BoundingBox } from "@/__generated__/types";
import { MarkerData } from "@/types";
import { MAPBOX_SOURCE_IDS } from "./sources";

const DEFAULT_ZOOM = 5;

export default function Map({
  children,
  onClickMarker,
  onMoveEnd,
  onSourceLoad,
  ref
}: {
  children: ReactNode;
  onClickMarker: (markerData: MarkerData | null) => void;
  onMoveEnd: (boundingBox: BoundingBox | null, zoom: number) => void
  onSourceLoad: (sourceId: string) => void
  ref: RefObject<MapRef | null>
}) {
  return (
    <MapGL
      initialViewState={{
        longitude: -4.5481, // 54.2361° N, 4.5481° W
        latitude: 54.2361,
        zoom: DEFAULT_ZOOM,
      }}
      ref={ref}
      style={{ flexGrow: 1 }}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      mapStyle="mapbox://styles/mapbox/streets-v9"
      onClick={(e) => {
        const map = e.target;
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["markers-pins"],
        });
        if (features.length && features[0].geometry.type === "Point") {
          onClickMarker({
            id: 1,
            properties: features[0].properties || {},
            coordinates: features[0].geometry.coordinates,
          });
        } else {
          onClickMarker(null);
        }
      }}
      onLoad={() => {
        const map = ref.current;
        if (!map) {
          return;
        }
        const imageURL = "/map-pin.png";
        map.loadImage(imageURL, (error, image) => {
          if (error) {
            console.error(`Could not load image ${imageURL}: ${error}`);
          }
          if (image && !map.hasImage("map-pin")) {
            map.addImage("map-pin", image);
          }
        });
      }}
      onMoveEnd={async (e) => {
        const bounds = e.target.getBounds();
        const boundingBox = bounds ? {
          north: bounds.getNorth(),
          east: bounds.getEast(),
          south: bounds.getSouth(),
          west: bounds.getWest(),
        } : null
        onMoveEnd(boundingBox, e.viewState.zoom)
      }}
      onSourceData={(e) => {
        // Trigger a re-render when known Map sources load
        if (e.sourceId && MAPBOX_SOURCE_IDS.includes(e.sourceId)) {
          onSourceLoad(e.sourceId);
        }
      }}
    >
      {children}
    </MapGL>
  );
}
