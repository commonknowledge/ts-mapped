import React from "react";

export default function CollectionIcon({
  color = "currentColor",
}: {
  color?: string;
}) {
  return (
    <svg width="13" height="14" viewBox="0 0 13 14" fill="none">
      <circle cx="2.78571" cy="8.59577" r="2.78571" fill={color} />
      <circle cx="8.78571" cy="3.08064" r="2.78571" fill={color} />
      <circle cx="9.78571" cy="10.919" r="2.78571" fill={color} />
    </svg>
  );
}
