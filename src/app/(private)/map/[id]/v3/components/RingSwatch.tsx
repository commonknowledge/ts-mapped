import { INK_COLOR } from "../../styles";

// Preview of a ring marker: white edge, colour ring, ink centre
export default function RingSwatch({
  color,
  size = 14,
}: {
  color: string;
  size?: number;
}) {
  const centre = size / 2;
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 drop-shadow-[0_0_0.5px_rgba(0,0,0,0.4)]"
    >
      <circle cx={centre} cy={centre} r={centre} fill="#ffffff" />
      <circle cx={centre} cy={centre} r={centre - 1} fill={color} />
      <circle cx={centre} cy={centre} r={centre - 3.5} fill={INK_COLOR} />
    </svg>
  );
}
