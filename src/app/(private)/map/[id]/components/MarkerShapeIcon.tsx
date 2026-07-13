import { MarkerIconShape } from "./Markers/markerIcons";

const SHAPE_ELEMENTS: Record<MarkerIconShape, React.ReactNode> = {
  [MarkerIconShape.Circle]: <circle cx="10" cy="10" r="7" />,
  [MarkerIconShape.Square]: (
    <rect x="3.5" y="3.5" width="13" height="13" rx="1" />
  ),
  [MarkerIconShape.Diamond]: <polygon points="10,1.5 18.5,10 10,18.5 1.5,10" />,
  [MarkerIconShape.Triangle]: <polygon points="10,2.5 18,17 2,17" />,
  [MarkerIconShape.Plus]: (
    <polygon points="7.5,2 12.5,2 12.5,7.5 18,7.5 18,12.5 12.5,12.5 12.5,18 7.5,18 7.5,12.5 2,12.5 2,7.5 7.5,7.5" />
  ),
  [MarkerIconShape.Hexagon]: (
    <polygon points="10,1.8 17.1,5.9 17.1,14.1 10,18.2 2.9,14.1 2.9,5.9" />
  ),
  [MarkerIconShape.X]: (
    <polygon
      points="7.5,2 12.5,2 12.5,7.5 18,7.5 18,12.5 12.5,12.5 12.5,18 7.5,18 7.5,12.5 2,12.5 2,7.5 7.5,7.5"
      transform="rotate(45 10 10)"
    />
  ),
  [MarkerIconShape.Star]: (
    <polygon points="10,1.6 12.4,7.0 18.3,7.4 13.7,11.2 15.2,17.0 10,13.8 4.8,17.0 6.3,11.2 1.7,7.4 7.6,7.0" />
  ),
};

export default function MarkerShapeIcon({
  shape,
  color = "currentColor",
  size = 14,
}: {
  shape: string;
  color?: string;
  size?: number;
}) {
  const element = SHAPE_ELEMENTS[shape as MarkerIconShape];
  if (!element) {
    return null;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={color}
      aria-hidden
    >
      {element}
    </svg>
  );
}
