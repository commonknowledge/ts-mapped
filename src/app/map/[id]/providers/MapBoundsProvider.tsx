"use client";

import { type ReactNode, useState } from "react";
import { MapBoundsContext } from "@/app/map/[id]/context/MapBoundsContext";
import type { BoundingBox } from "@/server/models/Area";

export default function MapBoundsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [boundingBox, setBoundingBox] = useState<BoundingBox | null>(null);
  return (
    <MapBoundsContext value={{ boundingBox, setBoundingBox }}>
      {children}
    </MapBoundsContext>
  );
}
