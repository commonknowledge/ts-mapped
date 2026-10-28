"use client";

import { cn } from "@/shadcn/utils";
import { useShowControls } from "../../hooks/useMapControls";
import { CONTROL_PANEL_WIDTH } from "../../styles";
import LightBoundariesSection from "./LightBoundariesSection";
import LightDataVisSection from "./LightDataVisSection";
import LightMarkersSection from "./LightMarkersSection";

// The light editor's single Layers panel, toggled from the top bar. Keeps CONTROL_PANEL_WIDTH so the
// camera padding, flyouts and inspector line up as in the classic editor.
export default function LightSidebar() {
  const showControls = useShowControls();

  return (
    <aside
      className={cn(
        "absolute top-0 left-0 z-20 flex h-full flex-col overflow-y-auto border-r border-neutral-200/80 bg-white text-[13px] transition-all duration-300 ease-in-out",
        showControls
          ? "translate-x-0 opacity-100"
          : "-translate-x-full opacity-0",
      )}
      style={{ width: CONTROL_PANEL_WIDTH, minWidth: CONTROL_PANEL_WIDTH }}
      aria-label="Layers"
      aria-hidden={!showControls}
    >
      <LightMarkersSection />
      <LightBoundariesSection />
      <LightDataVisSection />
    </aside>
  );
}
