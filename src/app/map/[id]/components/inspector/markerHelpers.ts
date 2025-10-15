import { LayerType } from "@/types";
import type { InspectorContent } from "@/app/map/[id]/context/InspectorContext";
import type { DataSource } from "@/server/models/DataSource";
import type { Folder } from "@/server/models/Folder";
import type { PlacedMarker } from "@/server/models/PlacedMarker";
import type { RecordData } from "@/types";

/**
 * Creates consistent inspector content for placed markers (dropped pins)
 */
export function createPlacedMarkerInspectorContent(
  placedMarker: PlacedMarker,
  folders: Folder[] | null,
  parent?: { type: LayerType; name: string; id: string },
): InspectorContent {
  const folderName = placedMarker.folderId
    ? folders?.find((f) => f.id === placedMarker.folderId)?.name ||
      "Unknown folder"
    : null;

  return {
    type: LayerType.Marker,
    name: placedMarker.label,
    properties: {
      coordinates: `${placedMarker.point.lat.toFixed(4)}, ${placedMarker.point.lng.toFixed(4)}`,
      folder: folderName || "No folder",
      notes: placedMarker.notes || "No notes",
      ...(placedMarker.address && { address: placedMarker.address }),
    },
    dataSource: null,
    id: placedMarker.id,
    recordId: placedMarker.id,
    parent,
  };
}

/**
 * Creates consistent inspector content for data source records (members/markers)
 */
export function createDataSourceRecordInspectorContent(
  record: RecordData,
  dataSource: DataSource | null,
  type: LayerType.Member | LayerType.Marker,
  parent?: { type: LayerType; name: string; id: string },
): InspectorContent {
  const nameColumn = dataSource?.columnRoles?.nameColumns?.[0];
  const displayName = nameColumn
    ? String(record.json[nameColumn] || "")
    : `Id: ${record.id}`;

  return {
    type: type,
    name: displayName,
    properties: {
      ...record.json,
      // Add internal properties for consistency
      __name: nameColumn ? record.json[nameColumn] : "",
      // Include geocodePoint for flyTo functionality
      geocodePoint: record.geocodePoint,
    },
    dataSource: dataSource as DataSource,
    id: record.id,
    recordId: record.id,
    parent,
  };
}
