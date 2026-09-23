import { Layer } from "react-map-gl/mapbox";
import { getContrastingRingColor } from "@/utils/colors";
import type { ExpressionSpecification } from "mapbox-gl";

export const UNCLUSTERED_FILTER: ExpressionSpecification = [
  "any",
  ["!", ["has", "point_count"]],
  ["==", ["get", "point_count"], 1],
];

const CLUSTER_FILTER: ExpressionSpecification = ["has", "point_count"];

const CLUSTER_RADIUS: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["get", "point_count"],
  1,
  15,
  10,
  25,
  100,
  35,
  1000,
  50,
  10000,
  70,
];

/** Clusters with no matched records are faded */
const clusterOpacity = (opacity: number): ExpressionSpecification => [
  "case",
  ["==", ["get", "matched_count"], 0],
  0.5,
  opacity,
];

/** Thin edge in the marker colour so a white disc reads on pale fills */
const EDGE_WIDTH = 1;

/**
 * Cluster circles and their point counts. Individual (unclustered) pins are
 * rendered separately by PinsLayer with the UNCLUSTERED_FILTER.
 *
 * Over a choropleth (`onChoropleth`) markers switch to a high-contrast
 * style: a white disc with a thin edge and the count in the marker
 * colour. The white disc stands out on saturated fills and the edge on
 * pale ones. Otherwise the disc is a plain semi-transparent circle in
 * the marker colour.
 */
export function ClustersLayer({
  sourceId,
  color,
  onChoropleth,
}: {
  sourceId: string;
  color: string;
  onChoropleth: boolean;
}) {
  const edgeColor = getContrastingRingColor(color);
  const opacity = clusterOpacity(onChoropleth ? 0.875 : 0.8);
  return (
    <>
      <Layer
        id={`${sourceId}-circles`}
        key={`${sourceId}-circles`}
        type="circle"
        source={sourceId}
        filter={CLUSTER_FILTER}
        paint={{
          "circle-radius": CLUSTER_RADIUS,
          "circle-color": onChoropleth ? "#ffffff" : color,
          "circle-opacity": opacity,
          "circle-stroke-width": onChoropleth ? EDGE_WIDTH : 0,
          "circle-stroke-color": edgeColor,
          "circle-stroke-opacity": opacity,
        }}
      />
      <Layer
        id={`${sourceId}-counts`}
        key={`${sourceId}-counts`}
        type="symbol"
        source={sourceId}
        filter={CLUSTER_FILTER}
        layout={{
          "text-field": ["get", "point_count"],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        }}
        paint={{
          "text-color": onChoropleth ? edgeColor : "#000000",
        }}
      />
    </>
  );
}
