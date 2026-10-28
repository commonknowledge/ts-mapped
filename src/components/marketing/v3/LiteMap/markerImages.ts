import {
  COLLECTIONS,
  COLLECTION_IDS,
  INK_COLOR,
  MARKER_STYLE,
} from "./constants";
import type { CollectionId, MarkerShape } from "./types";
import type { Map as MapboxMap } from "mapbox-gl";

const PIXEL_RATIO = 2;

export const getMarkerImageId = (id: CollectionId) => `lite-marker-${id}`;

// Same layers as MarkerSwatch: white edge, collection-colour ring, ink fill.
// The white edge and ink fill keep it legible on any area colour.
const drawMarker = ({
  shape,
  color,
}: {
  shape: MarkerShape;
  color: string;
}) => {
  const { size, edge, ring } = MARKER_STYLE;
  const px = size * PIXEL_RATIO;
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  const layer = (inset: number, fill: string) => {
    const offset = inset * PIXEL_RATIO;
    const length = px - offset * 2;
    ctx.fillStyle = fill;
    ctx.beginPath();
    if (shape === "circle") {
      ctx.arc(px / 2, px / 2, length / 2, 0, Math.PI * 2);
    } else {
      ctx.roundRect(offset, offset, length, length, length * 0.2);
    }
    ctx.fill();
  };
  layer(0, "#ffffff");
  layer(edge, color);
  layer(edge + ring, INK_COLOR);
  return ctx.getImageData(0, 0, px, px);
};

export const addMarkerImages = (map: MapboxMap) => {
  for (const id of COLLECTION_IDS) {
    const imageId = getMarkerImageId(id);
    const image = drawMarker(COLLECTIONS[id]);
    if (image && !map.hasImage(imageId)) {
      map.addImage(imageId, image, { pixelRatio: PIXEL_RATIO });
    }
  }
};
