import { COLLECTIONS, INK_COLOR, MARKER_STYLE } from "./constants";
import type { CollectionId } from "./types";

// Preview of a collection's map marker, drawn the same way as markerImages
export default function MarkerSwatch({ id }: { id: CollectionId }) {
  const { shape, color } = COLLECTIONS[id];
  const { size, edge, ring } = MARKER_STYLE;

  const layer = (inset: number, fill: string) => {
    const length = size - inset * 2;
    return shape === "circle" ? (
      <circle cx={size / 2} cy={size / 2} r={length / 2} fill={fill} />
    ) : (
      <rect
        x={inset}
        y={inset}
        width={length}
        height={length}
        rx={length * 0.2}
        fill={fill}
      />
    );
  };

  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 drop-shadow-[0_0_0.5px_rgba(0,0,0,0.4)]"
    >
      {layer(0, "#ffffff")}
      {layer(edge, color)}
      {layer(edge + ring, INK_COLOR)}
    </svg>
  );
}
