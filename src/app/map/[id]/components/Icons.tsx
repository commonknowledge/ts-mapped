import React from "react";

export function MarkerCollectionIcon({
  color = "currentColor",
}: {
  color?: string;
}) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{ transform: "scale(1.3)" }}
    >
      <circle cx="2.78571" cy="8.59577" r="2.78571" fill={color} />
      <circle cx="8.78571" cy="3.08064" r="2.78571" fill={color} />
      <circle cx="9.78571" cy="10.919" r="2.78571" fill={color} />
    </svg>
  );
}

export function MarkerIndividualIcon({
  color = "currentColor",
}: {
  color?: string;
}) {
  return (
    <div
      className="w-3 h-3 bg-neutral-200 rounded-sm"
      style={{ backgroundColor: color }}
    ></div>
  );
}
