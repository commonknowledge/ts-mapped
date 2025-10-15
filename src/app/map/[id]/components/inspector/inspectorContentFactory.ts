import { LayerType } from "@/types";
import type { InspectorContent } from "@/app/map/[id]/context/InspectorContext";
import type { DataSource } from "@/server/models/DataSource";
import type { Folder } from "@/server/models/Folder";
import type { PlacedMarker } from "@/server/models/PlacedMarker";
import type { Turf } from "@/server/models/Turf";
import type { RecordData } from "@/types";

/**
 * Centralized factory for creating consistent inspector content across all layer types
 */
export const InspectorContentFactory = {
  /**
   * Creates inspector content for data source records (members/markers)
   */
  createMemberInspectorContent(
    record: RecordData,
    dataSource: DataSource | null,
    parent?: { type: LayerType; name: string; id: string },
  ): InspectorContent {
    const nameColumn = dataSource?.columnRoles?.nameColumns?.[0];
    const displayName = nameColumn
      ? String(record.json[nameColumn] || "")
      : `Id: ${record.id}`;

    return {
      type: LayerType.Member,
      name: displayName,
      properties: {
        ...record.json,
        // Add internal properties for consistency
        __name: nameColumn ? record.json[nameColumn] : "",
        // Include geocodePoint for flyTo functionality
        geocodePoint: record.geocodePoint,
        // Include geocodeResult for area detection (if available)
        ...(((record.json as Record<string, unknown>).geocodeResult as Record<
          string,
          unknown
        >) && {
          geocodeResult: (record.json as Record<string, unknown>).geocodeResult,
        }),
      },
      dataSource: dataSource as DataSource,
      id: record.id, // Unified identifier
      dataSourceId: dataSource?.id, // Data source ID for fetching complete data
      recordId: record.id, // Keep for backward compatibility
      parent,
    };
  },

  /**
   * Creates inspector content for data source records as markers
   */
  createDataSourceMarkerInspectorContent(
    record: RecordData,
    dataSource: DataSource | null,
    parent?: { type: LayerType; name: string; id: string },
  ): InspectorContent {
    const nameColumn = dataSource?.columnRoles?.nameColumns?.[0];
    const displayName = nameColumn
      ? String(record.json[nameColumn] || "")
      : `Id: ${record.id}`;

    return {
      type: LayerType.Marker,
      name: displayName,
      properties: {
        ...record.json,
        // Add internal properties for consistency
        __name: nameColumn ? record.json[nameColumn] : "",
        // Include geocodePoint for flyTo functionality
        geocodePoint: record.geocodePoint,
        // Include geocodeResult for area detection (if available)
        ...(((record.json as Record<string, unknown>).geocodeResult as Record<
          string,
          unknown
        >) && {
          geocodeResult: (record.json as Record<string, unknown>).geocodeResult,
        }),
      },
      dataSource: dataSource as DataSource,
      id: record.id, // Unified identifier
      dataSourceId: dataSource?.id, // Data source ID for fetching complete data
      recordId: record.id, // Keep for backward compatibility
      parent,
    };
  },

  /**
   * Creates inspector content for placed markers (dropped pins)
   */
  createPlacedMarkerInspectorContent(
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
        // Include point for flyTo functionality
        point: placedMarker.point,
      },
      dataSource: null,
      id: placedMarker.id, // Unified identifier
      mapId: placedMarker.mapId, // Map ID for placed markers
      recordId: placedMarker.id, // Keep for backward compatibility
      parent,
    };
  },

  /**
   * Creates inspector content for boundaries
   */
  createBoundaryInspectorContent(
    name: string,
    boundaryFeature: Record<string, unknown>,
    areaCode?: string,
    parent?: { type: LayerType; name: string; id: string },
  ): InspectorContent {
    // Get dataset name based on layer ID and other properties
    const getDatasetName = () => {
      const layerId =
        (boundaryFeature?.properties as Record<string, unknown>)?.layerId || "";
      const sourceLayer =
        (boundaryFeature?.properties as Record<string, unknown>)?.sourceLayer ||
        "";
      const gssCode =
        (boundaryFeature?.properties as Record<string, unknown>)?.gss_code ||
        "";

      // Check multiple possible identifiers for Westminster Constituencies
      if (
        (layerId as string).includes("uk_cons") ||
        (sourceLayer as string).includes("uk_cons") ||
        (sourceLayer as string).includes("uk_cons_2025") ||
        (gssCode as string).startsWith("E14")
      ) {
        return "Westminster Constituencies";
      }
      if (
        (layerId as string).includes("OA21") ||
        (sourceLayer as string).includes("OA21")
      )
        return "Output Areas";
      if (
        (layerId as string).includes("MSOA") ||
        (sourceLayer as string).includes("MSOA")
      )
        return "Middle Layer Super Output Areas";

      // Default fallback - if we have a GSS code starting with E14, it's likely Westminster Constituencies
      if ((gssCode as string).startsWith("E14"))
        return "Westminster Constituencies";

      return "Boundary Data";
    };

    const datasetName = getDatasetName();

    return {
      type: LayerType.Boundary,
      name: name,
      properties: {
        "Area Code":
          areaCode ||
          (boundaryFeature?.properties as Record<string, unknown>)?.gss_code,
        Dataset: datasetName,
        areaCode:
          areaCode ||
          (boundaryFeature?.properties as Record<string, unknown>)?.gss_code,
        areaName: name,
      },
      dataSource: null,
      id:
        areaCode ||
        ((boundaryFeature?.properties as Record<string, unknown>)
          ?.gss_code as string) ||
        name, // Unified identifier
      boundaryFeature: boundaryFeature,
      parent,
    };
  },

  /**
   * Creates inspector content for custom areas (turfs)
   */
  createTurfInspectorContent(
    turf: Turf,
    areaNumber?: number,
    parent?: { type: LayerType; name: string; id: string },
  ): InspectorContent {
    return {
      type: LayerType.Turf,
      name: turf.label || `Area ${areaNumber || turf.id}`,
      properties: {
        id: turf.id,
        area: `${turf.area?.toFixed(2)} m²`,
        notes: turf.notes || "No notes",
        created: turf.createdAt.toLocaleDateString(),
      },
      dataSource: null,
      id: turf.id, // Unified identifier
      mapId: turf.mapId, // Map ID for turfs
      parent,
    };
  },

  /**
   * Creates inspector content for the boundaries list page
   */
  createBoundariesListInspectorContent(): InspectorContent {
    return {
      type: LayerType.Boundary,
      name: "Boundaries",
      properties: {},
      dataSource: null,
      id: "boundaries-list", // Unified identifier
    };
  },

  /**
   * Creates inspector content for data source records from map clicks (incomplete data)
   * This method creates a minimal inspector content that will be enhanced with complete data
   */
  createMemberInspectorContentFromMap(
    recordId: string,
    dataSource: DataSource | null,
    properties: Record<string, unknown> = {},
    parent?: { type: LayerType; name: string; id: string },
  ): InspectorContent {
    const nameColumn = dataSource?.columnRoles?.nameColumns?.[0];
    const displayName = nameColumn
      ? String(properties[nameColumn] || "")
      : `Id: ${recordId}`;

    return {
      type: LayerType.Member,
      name: displayName,
      properties: {
        ...properties,
        __name: nameColumn ? properties[nameColumn] : "",
        // Note: geocodePoint and geocodeResult will be fetched separately
      },
      dataSource: dataSource as DataSource,
      id: recordId, // Unified identifier
      dataSourceId: dataSource?.id, // Data source ID for fetching complete data
      recordId: recordId, // Keep for backward compatibility
      parent,
    };
  },

  /**
   * Creates inspector content for data source markers from map clicks (incomplete data)
   */
  createDataSourceMarkerInspectorContentFromMap(
    recordId: string,
    dataSource: DataSource | null,
    properties: Record<string, unknown> = {},
    parent?: { type: LayerType; name: string; id: string },
  ): InspectorContent {
    const nameColumn = dataSource?.columnRoles?.nameColumns?.[0];
    const displayName = nameColumn
      ? String(properties[nameColumn] || "")
      : `Id: ${recordId}`;

    return {
      type: LayerType.Marker,
      name: displayName,
      properties: {
        ...properties,
        __name: nameColumn ? properties[nameColumn] : "",
        // Note: geocodePoint and geocodeResult will be fetched separately
      },
      dataSource: dataSource as DataSource,
      id: recordId, // Unified identifier
      dataSourceId: dataSource?.id, // Data source ID for fetching complete data
      recordId: recordId, // Keep for backward compatibility
      parent,
    };
  },
};

// Legacy exports for backward compatibility
export const createDataSourceRecordInspectorContent =
  InspectorContentFactory.createMemberInspectorContent;
export const createPlacedMarkerInspectorContent =
  InspectorContentFactory.createPlacedMarkerInspectorContent;
