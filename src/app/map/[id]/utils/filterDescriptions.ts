import type { RecordFilterInput } from "@/server/models/MapView";
import type { PlacedMarker } from "@/server/models/PlacedMarker";

/**
 * Generates a descriptive text for a filter based on its type and properties
 */
export function getFilterDescription(
    filter: RecordFilterInput,
    placedMarkers: PlacedMarker[] = [],
): string {
    // Handle placed marker filters with distance
    if (filter.placedMarker && filter.distance) {
        const marker = placedMarkers.find((m) => m.id === filter.placedMarker);
        const markerName = marker?.label || "Unknown Marker";
        const distance = filter.distance;
        return `${distance}km from ${markerName}`;
    }

    // Handle placed marker filters without distance
    if (filter.placedMarker) {
        const marker = placedMarkers.find((m) => m.id === filter.placedMarker);
        const markerName = marker?.label || "Unknown Marker";
        return `Near ${markerName}`;
    }

    // Handle data record filters with distance
    if (filter.dataRecordId && filter.distance) {
        const distance = filter.distance;
        return `${distance}km from data record`;
    }

    // Handle turf filters
    if (filter.turf) {
        return `Within area`;
    }

    // Handle text filters
    if (filter.column && filter.search) {
        return `${filter.column} contains "${filter.search}"`;
    }

    // Use label if available, otherwise fallback to generic description
    if (filter.label) {
        return filter.label;
    }

    // Fallback to generic description
    return `${filter.column || "Field"} ${filter.operator || "is"} ${filter.search || "value"}`;
}
