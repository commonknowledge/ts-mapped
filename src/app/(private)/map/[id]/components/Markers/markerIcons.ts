import type { Map as MapboxMap } from "mapbox-gl";

/**
 * Marker icon shapes, rendered as SDF (signed distance field) images so
 * Mapbox can tint them with `icon-color`. Distances are computed
 * analytically per shape (no rasterise-then-scan step), following the
 * TinySDF alpha encoding: the shape edge sits at alpha ≈ 0.75.
 */

export enum MarkerIconShape {
  Circle = "circle",
  Square = "square",
  Diamond = "diamond",
  Triangle = "triangle",
  Plus = "plus",
  Hexagon = "hexagon",
  X = "x",
  Star = "star",
}

export const markerIconShapes = Object.values(MarkerIconShape);

const IMAGE_PREFIX = "marker-shape-";
const IMAGE_SIZE = 64;
// TinySDF-style encoding parameters
const SDF_RADIUS = 8;
const SDF_CUTOFF = 0.25;
// Half-extent of shapes within the image (leaves room for the SDF falloff)
const SHAPE_RADIUS = IMAGE_SIZE / 2 - SDF_RADIUS - 2;

export const getMarkerIconImageId = (shape: string): string =>
  `${IMAGE_PREFIX}${shape}`;

export const isMarkerIconImageId = (imageId: string): boolean =>
  imageId.startsWith(IMAGE_PREFIX) &&
  markerIconShapes.some((s) => imageId === getMarkerIconImageId(s));

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

/** Signed distance to an axis-aligned box of half-extents (w, h) */
const boxDistance = (x: number, y: number, w: number, h: number): number => {
  const qx = Math.abs(x) - w;
  const qy = Math.abs(y) - h;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inside = Math.min(Math.max(qx, qy), 0);
  return outside + inside;
};

type DistanceFn = (x: number, y: number, r: number) => number;

// Signed distance functions adapted from Inigo Quilez's 2D SDF reference
const SHAPE_DISTANCE_FNS: Record<MarkerIconShape, DistanceFn> = {
  [MarkerIconShape.Circle]: (x, y, r) => Math.hypot(x, y) - r * 0.92,

  [MarkerIconShape.Square]: (x, y, r) => boxDistance(x, y, r * 0.82, r * 0.82),

  [MarkerIconShape.Diamond]: (x, y, r) =>
    (Math.abs(x) + Math.abs(y) - r * 1.15) * Math.SQRT1_2,

  [MarkerIconShape.Triangle]: (x, y, r) => {
    // Equilateral triangle pointing up (flip y: image y grows downwards)
    const k = Math.sqrt(3);
    const size = r * 0.95;
    let px = Math.abs(x);
    let py = -y + size / k;
    if (px + k * py > 0) {
      const nx = (px - k * py) / 2;
      const ny = (-k * px - py) / 2;
      px = nx;
      py = ny;
    }
    px -= clamp(px, -2 * size, 0);
    return -Math.hypot(px, py) * Math.sign(py);
  },

  [MarkerIconShape.Plus]: (x, y, r) => {
    const arm = r * 0.36;
    return Math.min(boxDistance(x, y, r, arm), boxDistance(x, y, arm, r));
  },

  [MarkerIconShape.Hexagon]: (x, y, r) => {
    const kx = -0.866025404;
    const ky = 0.5;
    const kz = 0.577350269;
    const size = r * 0.92;
    let px = Math.abs(x);
    let py = Math.abs(y);
    const dot = kx * px + ky * py;
    if (dot > 0) {
      px -= 2 * dot * kx;
      py -= 2 * dot * ky;
    }
    px -= clamp(px, -kz * size, kz * size);
    py -= size;
    return Math.hypot(px, py) * Math.sign(py);
  },

  [MarkerIconShape.X]: (x, y, r) => {
    // A plus rotated 45 degrees
    const rx = (x + y) * Math.SQRT1_2;
    const ry = (y - x) * Math.SQRT1_2;
    const arm = r * 0.36;
    return Math.min(boxDistance(rx, ry, r, arm), boxDistance(rx, ry, arm, r));
  },

  [MarkerIconShape.Star]: (x, y, r) => {
    // Five-pointed star (iq's sdStar5), point up
    const size = r * 1.05;
    const rf = 0.5;
    const k1x = 0.809016994;
    const k1y = -0.587785252;
    const k2x = -k1x;
    const k2y = k1y;
    let px = x;
    let py = -y; // flip y so the star points up
    px = Math.abs(px);
    const d1 = 2 * Math.max(k1x * px + k1y * py, 0);
    px -= d1 * k1x;
    py -= d1 * k1y;
    const d2 = 2 * Math.max(k2x * px + k2y * py, 0);
    px -= d2 * k2x;
    py -= d2 * k2y;
    px = Math.abs(px);
    py -= size;
    const bax = rf * -k1y - 0;
    const bay = rf * k1x - 1;
    const baLen2 = bax * bax + bay * bay;
    const h = clamp((px * bax + py * bay) / baLen2, 0, size);
    const dx = px - bax * h;
    const dy = py - bay * h;
    const sign = Math.sign(py * bax - px * bay);
    return Math.hypot(dx, dy) * sign;
  },
};

const buildIconImageData = (shape: MarkerIconShape): ImageData => {
  const distanceFn = SHAPE_DISTANCE_FNS[shape];
  const data = new Uint8ClampedArray(IMAGE_SIZE * IMAGE_SIZE * 4);
  const half = IMAGE_SIZE / 2;
  for (let row = 0; row < IMAGE_SIZE; row++) {
    for (let col = 0; col < IMAGE_SIZE; col++) {
      const x = col - half + 0.5;
      const y = row - half + 0.5;
      const distance = distanceFn(x, y, SHAPE_RADIUS);
      // TinySDF encoding: alpha 255 deep inside, edge at ~191, 0 far outside
      const alpha = Math.round(
        clamp(255 - 255 * (distance / SDF_RADIUS + SDF_CUTOFF), 0, 255),
      );
      const i = (row * IMAGE_SIZE + col) * 4;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = alpha;
    }
  }
  return new ImageData(data, IMAGE_SIZE, IMAGE_SIZE);
};

const imageDataCache = new Map<MarkerIconShape, ImageData>();

const getIconImageData = (shape: MarkerIconShape): ImageData => {
  let imageData = imageDataCache.get(shape);
  if (!imageData) {
    imageData = buildIconImageData(shape);
    imageDataCache.set(shape, imageData);
  }
  return imageData;
};

/**
 * Register all marker icon shapes on the map. Idempotent; call again after
 * style changes (styles discard added images).
 */
export const registerMarkerIcons = (map: MapboxMap): void => {
  for (const shape of markerIconShapes) {
    const imageId = getMarkerIconImageId(shape);
    if (!map.hasImage(imageId)) {
      map.addImage(imageId, getIconImageData(shape), { sdf: true });
    }
  }
};
