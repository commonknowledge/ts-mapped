"use client";

import { useState } from "react";
import { HoverAreaContext } from "@/app/map/[id]/context/HoverAreaContext";
import type { ReactNode} from "react";

export default function HoverAreaProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hoverAreaCode, setHoverAreaCode] = useState<{ coordinates: [number, number], code: string } | null>(null);

  return (
    <HoverAreaContext
      value={{
        hoverAreaCode,
        setHoverAreaCode,
      }}
    >
      {children}
    </HoverAreaContext>
  );
}
