import { useContext, useEffect, useRef, useState } from "react";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { mapColors } from "../styles";
import MapStyleSelector from "./MapStyleSelector";

export default function MapWrapper({
  currentMode,
  children,
}: {
  currentMode: string | null;
  children: React.ReactNode;
}) {
  const { mapRef, showControls } = useContext(MapContext);

  const [message, setMessage] = useState<string>("");
  const [indicatorColor, setIndicatorColor] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  const map = mapRef?.current;
  const controlsOpen = showControls;

  useEffect(() => {
    if (currentMode === "draw_polygon") {
      setIndicatorColor(mapColors.areas.color);
      setMessage(
        "You are in draw mode. Click to add points. Double click to finish drawing."
      );
    } else if (currentMode === "pin_drop") {
      setIndicatorColor(mapColors.markers.color);
      setMessage("Click on the map to drop a pin.");
    } else {
      setIndicatorColor("");
      setMessage("");
    }
  }, [currentMode]);

  useEffect(() => {
    map?.easeTo({
      padding: { left: controlsOpen ? 280 : 0 },
      zoom: map.getZoom() + (controlsOpen ? 0.3 : -0.3),
      duration: 300,
      easing: (t) => t * (2 - t),
    });

    setTimeout(() => {
      map?.resize();
    }, 310);
  }, [controlsOpen, map]);

  return (
    <div ref={containerRef} className="absolute top-0 right-0 h-full w-full">
      {children}

      <div
        className="absolute bottom-8 left-1/2 z-10 transition-transform duration-300"
        style={{
          transform: controlsOpen
            ? "translate(calc(-50% + 140px))"
            : "translate(-50%)",
        }}
      >
        <MapStyleSelector />
      </div>

      {indicatorColor && (
        <div
          className="absolute top-0 left-0 w-full h-1"
          style={{ background: indicatorColor }}
        />
      )}

      {message && (
        <div
          className="absolute top-4 left-1/2 z-10 px-3 py-2 rounded shadow-md bg-white text-xs transition-transform duration-300"
          style={{
            transform: controlsOpen
              ? "translate(calc(-50% + 140px))"
              : "translate(-50%)",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
