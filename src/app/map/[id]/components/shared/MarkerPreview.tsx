import { MapPin } from "lucide-react";
import type { PlacedMarker } from "@/server/models/PlacedMarker";

interface MarkerPreviewProps {
  markerId: string;
  placedMarkers: PlacedMarker[];
  fallbackText?: string;
  showIcon?: boolean;
}

export default function MarkerPreview({
  markerId,
  placedMarkers,
  fallbackText = "Unknown Marker",
  showIcon = true,
}: MarkerPreviewProps) {
  const marker = placedMarkers.find((m) => m.id === markerId);

  if (!marker) {
    return (
      <span className="flex items-center gap-1">
        {showIcon && <MapPin className="w-3 h-3 text-neutral-400" />}
        <span className="text-neutral-500 italic">{fallbackText}</span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1">
      {showIcon && <MapPin className="w-3 h-3 text-red-500" />}
      <span>{marker.label || "Unnamed Marker"}</span>
    </span>
  );
}

export function getMarkerName(
  markerId: string,
  placedMarkers: PlacedMarker[],
  fallbackText = "Unknown Marker",
): string {
  const marker = placedMarkers.find((m) => m.id === markerId);
  return marker?.label || fallbackText;
}
