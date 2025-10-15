import { getMarkerName } from "@/app/map/[id]/components/shared/MarkerPreview";
import type { RecordFilterInput } from "@/server/models/MapView";
import type { PlacedMarker } from "@/server/models/PlacedMarker";

interface DataRecord {
  id: string;
  name?: string;
  json?: {
    name?: string;
    Name?: string;
    title?: string;
    Title?: string;
    [key: string]: unknown;
  };
}

/**
 * Generates a descriptive text for a filter based on its type and properties
 */
export function getFilterDescription(
  filter: RecordFilterInput,
  placedMarkers: PlacedMarker[] = [],
  dataRecords: DataRecord[] = [],
): string {
  // Handle placed marker filters with distance
  if (filter.placedMarker && filter.distance) {
    const markerName = getMarkerName(
      filter.placedMarker,
      placedMarkers,
      "Unknown Marker",
    );
    const distance = filter.distance;
    return `${distance}km from ${markerName}`;
  }

  // Handle placed marker filters without distance
  if (filter.placedMarker) {
    const markerName = getMarkerName(
      filter.placedMarker,
      placedMarkers,
      "Unknown Marker",
    );
    return `Near ${markerName}`;
  }

  // Handle data record filters with distance
  if (filter.dataRecordId && filter.distance) {
    const dataRecord = dataRecords.find(
      (record) => record.id === filter.dataRecordId,
    );

    // Debug logging
    console.log("getFilterDescription - Data record filter:", {
      dataRecordId: filter.dataRecordId,
      dataRecordsCount: dataRecords.length,
      dataRecordIds: dataRecords.map((r) => r.id),
      foundRecord: dataRecord,
      recordName: dataRecord?.name,
      recordJson: dataRecord?.json,
    });

    // Try to get the name from various possible fields
    const recordName =
      dataRecord?.name ||
      dataRecord?.json?.name ||
      dataRecord?.json?.Name ||
      dataRecord?.json?.title ||
      dataRecord?.json?.Title ||
      "Unknown Record";
    const distance = filter.distance;
    return `${distance}km from ${recordName}`;
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
