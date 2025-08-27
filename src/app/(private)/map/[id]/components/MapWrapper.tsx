import { useEffect, useState } from "react";
import { mapColors } from "../styles";

export default function MapWrapper({
  currentMode,
  children,
}: {
  currentMode: string | null;
  children: React.ReactNode;
}) {
  const [message, setMessage] = useState<string>("");
  const [indicatorColor, setIndicatorColor] = useState<string>("");

  useEffect(() => {
    if (currentMode === "draw_polygon") {
      setIndicatorColor(mapColors.areas.color);
      setMessage(
        "You are in draw mode. Click to add points. Double click to finish drawing.",
      );
    } else if (currentMode === "pin_drop") {
      setIndicatorColor(mapColors.markers.color);
      setMessage("Click on the map to drop a pin.");
    } else {
      setIndicatorColor("");
      setMessage("");
    }
  }, [currentMode]);

  return (
    <div className={"absolute top-0 left-0 w-full h-full"}>
      {children}

      {indicatorColor && (
        <div
          className="absolute top-0 left-0 w-full h-1"
          style={{ background: indicatorColor }}
        ></div>
      )}

      {message && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-2 rounded shadow-md bg-white text-xs">
          {message}
        </div>
      )}
    </div>
  );
}
