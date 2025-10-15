import * as turf from "@turf/turf";
import { ArrowLeft } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import LayerIcon from "@/components/LayerIcon";
import { LayerType, type RecordData } from "@/types";
import { InspectorContentFactory } from "./inspectorContentFactory";
import type { Feature, MultiPolygon, Polygon } from "geojson";

interface AreasContainingRecordProps {
  recordId: string;
  recordType: LayerType.Member | LayerType.Marker;
}

export default function AreasContainingRecord({
  recordId,
  recordType,
}: AreasContainingRecordProps) {
  const { setInspectorContent, inspectorContent } =
    useContext(InspectorContext);
  const { mapRef } = useContext(MapContext);
  const { choroplethLayerConfig } = useContext(ChoroplethContext);
  const { placedMarkers, turfs } = useContext(MarkerAndTurfContext);

  // Use the unified identifier system
  const unifiedId = inspectorContent?.id || recordId;
  const dataSourceId = inspectorContent?.dataSourceId;
  const mapId = inspectorContent?.mapId;

  // Get the record data from inspector content
  const recordData = inspectorContent?.properties as RecordData | undefined;
  const geocodeResult = (recordData?.json as Record<string, unknown>)
    ?.geocodeResult;
  const geocodePoint = recordData?.geocodePoint;

  // State for fetched record data
  const [fetchedRecordData, setFetchedRecordData] = useState<RecordData | null>(
    null,
  );
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  console.log("AreasContainingRecord - Component rendered:", {
    recordId,
    recordType,
    unifiedId,
    dataSourceId,
    mapId,
    hasRecordData: !!recordData,
    hasGeocodeResult: !!geocodeResult,
    hasGeocodePoint: !!geocodePoint,
    isLoadingRecord,
    hasAttemptedFetch,
    willFetch:
      recordType === LayerType.Member &&
      dataSourceId &&
      !isLoadingRecord &&
      !hasAttemptedFetch,
  });

  // Reset fetch attempt when recordId changes
  useEffect(() => {
    setHasAttemptedFetch(false);
    setFetchedRecordData(null);
  }, [unifiedId]);

  // Always fetch full record data for members when we have a dataSourceId to ensure consistency
  useEffect(() => {
    console.log("AreasContainingRecord - useEffect check:", {
      recordType,
      dataSourceId,
      isLoadingRecord,
      hasAttemptedFetch,
      shouldFetch:
        recordType === LayerType.Member &&
        dataSourceId &&
        !isLoadingRecord &&
        !hasAttemptedFetch,
    });

    if (
      recordType === LayerType.Member &&
      dataSourceId &&
      !isLoadingRecord &&
      !hasAttemptedFetch
    ) {
      console.log("AreasContainingRecord - Fetching full record data:", {
        recordId: unifiedId,
        dataSourceId: dataSourceId,
      });

      setIsLoadingRecord(true);
      setHasAttemptedFetch(true);

      // Use direct fetch instead of tRPC hook
      fetch(
        `/api/trpc/dataRecord.byId?input=${encodeURIComponent(
          JSON.stringify({
            json: {
              recordId: unifiedId,
              dataSourceId: dataSourceId,
            },
          }),
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
        .then((response) => response.json())
        .then((data: unknown) => {
          console.log("AreasContainingRecord - Fetched record data:", data);
          const response = data as { result?: { data?: RecordData } };
          if (response.result?.data) {
            console.log(
              "AreasContainingRecord - Setting fetched data with dataSource: server",
            );
            setFetchedRecordData(response.result.data);
          }
          setIsLoadingRecord(false);
        })
        .catch((error: Error) => {
          console.error(
            "AreasContainingRecord - Error fetching record:",
            error,
          );
          setIsLoadingRecord(false);
        });
    }
  }, [
    unifiedId,
    recordType,
    dataSourceId,
    geocodeResult,
    isLoadingRecord,
    hasAttemptedFetch,
  ]);

  // Use fetched data if available, otherwise use inspector content data
  const effectiveRecordData = fetchedRecordData || recordData;
  const effectiveGeocodePoint = fetchedRecordData?.geocodePoint || geocodePoint;
  const effectiveGeocodeResult =
    (fetchedRecordData?.json as Record<string, unknown>)?.geocodeResult ||
    geocodeResult;

  console.log("AreasContainingRecord - Data access debug:", {
    recordId,
    hasFetchedData: !!fetchedRecordData,
    hasRecordData: !!recordData,
    fetchedGeocodePoint: fetchedRecordData?.geocodePoint,
    fetchedGeocodeResult: (fetchedRecordData?.json as Record<string, unknown>)
      ?.geocodeResult,
    fetchedJsonGeocodePoint: (
      fetchedRecordData?.json as Record<string, unknown>
    )?.geocodePoint,
    fetchedJsonGeocodeResult: (
      fetchedRecordData?.json as Record<string, unknown>
    )?.geocodeResult,
    inspectorGeocodePoint: geocodePoint,
    inspectorGeocodeResult: geocodeResult,
    effectiveGeocodePoint,
    effectiveGeocodeResult,
  });

  // Note: Using hardcoded boundary mapping instead of API fetch

  // Create a lookup map from boundary name to GSS code
  // For now, use a hardcoded map since the API is not working
  const boundaryNameToCodeMap = useMemo(() => {
    // Hardcoded mapping for known boundaries
    const map: Record<string, string> = {
      "Tunbridge Wells": "E14001555",
      "Edmonton and Winchmore Hill": "E14001221",
      "Henley and Thame": "E14000742",
      // Add more as needed
    };

    return map;
  }, []);

  // Note: Using hardcoded boundary mapping instead of API fetch

  // Find areas/boundaries containing this record
  const areasContainingRecord: {
    type: LayerType;
    name: string;
    code?: string;
    id?: string;
    areaSetName?: string;
  }[] = [];

  if (recordType === LayerType.Member) {
    // For members: Look for mapped areas in the record data
    // The geocoding data is stored as "Mapped: [Area Set Name]: [Area Name]" properties
    const foundMemberAreas = new Set<string>(); // Track found areas to prevent duplicates

    console.log("AreasContainingRecord - Member data:", {
      recordId,
      dataSource: fetchedRecordData ? "server" : "inspector",
      hasJsonProperty: !!(effectiveRecordData?.json as Record<string, unknown>),
      jsonKeys: effectiveRecordData?.json
        ? Object.keys(effectiveRecordData.json)
        : null,
    });

    if (effectiveRecordData) {
      // Check both top-level properties and nested json properties
      const dataToCheck = [
        effectiveRecordData,
        ...(effectiveRecordData.json ? [effectiveRecordData.json] : []),
      ];

      dataToCheck.forEach((data) => {
        if (data && typeof data === "object") {
          Object.entries(data).forEach(([key, value]) => {
            // If this is a json object, expand it and check its properties too
            if (key === "json" && value && typeof value === "object") {
              Object.entries(value).forEach(([jsonKey, jsonValue]) => {
                if (
                  jsonKey.toLowerCase().startsWith("mapped:") &&
                  typeof jsonValue === "string" &&
                  jsonValue.trim() !== ""
                ) {
                  // Extract the area set name and area name
                  const match = jsonKey.match(/^mapped:\s*(.+?)\s*$/i);

                  if (match) {
                    const areaSetName = match[1];
                    const areaName = jsonValue;

                    // Create a unique key for this area
                    const areaKey = `${areaSetName}:${areaName}`;

                    // Only add if we haven't seen this area before
                    if (!foundMemberAreas.has(areaKey)) {
                      foundMemberAreas.add(areaKey);

                      // Determine the type based on the area set name
                      let areaType = LayerType.Boundary;
                      let areaCode = null;

                      if (areaSetName.includes("Westminster Constituencies")) {
                        areaType = LayerType.Boundary;
                        // Look up the actual GSS code from the boundary name
                        areaCode = boundaryNameToCodeMap[areaName] || areaName;
                      }

                      areasContainingRecord.push({
                        type: areaType,
                        name: areaName,
                        code: areaCode || undefined,
                        areaSetName: areaSetName,
                      });
                    }
                  }
                }
              });
            }

            if (
              key.toLowerCase().startsWith("mapped:") &&
              typeof value === "string" &&
              value.trim() !== ""
            ) {
              // Extract the area set name and area name
              const match = key.match(/^mapped:\s*(.+?)\s*$/i);
              console.log("AreasContainingRecord - Match result:", {
                key,
                match,
              });

              if (match) {
                const areaSetName = match[1];
                const areaName = value;

                // Create a unique key for this area
                const areaKey = `${areaSetName}:${areaName}`;

                // Only add if we haven't seen this area before
                if (!foundMemberAreas.has(areaKey)) {
                  foundMemberAreas.add(areaKey);

                  // Determine the type based on the area set name
                  let areaType = LayerType.Boundary;
                  let areaCode = null;

                  if (areaSetName.includes("Westminster Constituencies")) {
                    areaType = LayerType.Boundary;
                    // Look up the actual GSS code from the boundary name
                    areaCode = boundaryNameToCodeMap[areaName] || areaName;
                  }

                  areasContainingRecord.push({
                    type: areaType,
                    name: areaName,
                    code: areaCode || undefined,
                    areaSetName: areaSetName,
                  });
                }
              }
            }
          });
        }
      });
    }

    // For members: Also check if they're spatially inside any custom areas (turfs)
    // This is in addition to the geocoding data above
    // Try to get coordinates from geocodePoint, geocodeResult, or record properties
    let memberCoordinates = null;

    if (effectiveGeocodePoint) {
      memberCoordinates = effectiveGeocodePoint;
    } else if (
      (effectiveGeocodeResult as Record<string, unknown>)?.centralPoint
    ) {
      memberCoordinates = (effectiveGeocodeResult as Record<string, unknown>)
        .centralPoint;
    } else if (
      (effectiveGeocodeResult as Record<string, unknown>)?.samplePoint
    ) {
      memberCoordinates = (effectiveGeocodeResult as Record<string, unknown>)
        .samplePoint;
    }

    console.log("AreasContainingRecord - Member coordinate sources:", {
      recordId,
      hasGeocodePoint: !!effectiveGeocodePoint,
      hasGeocodeResult: !!effectiveGeocodeResult,
      hasCentralPoint: !!(effectiveGeocodeResult as Record<string, unknown>)
        ?.centralPoint,
      hasSamplePoint: !!(effectiveGeocodeResult as Record<string, unknown>)
        ?.samplePoint,
      memberCoordinates,
      turfsCount: turfs?.length || 0,
      effectiveGeocodePoint,
      effectiveGeocodeResult,
    });

    if (memberCoordinates && turfs) {
      console.log(
        "AreasContainingRecord - Checking member spatial analysis for turfs:",
        {
          recordId,
          memberCoordinates,
          turfsCount: turfs.length,
        },
      );

      const foundMemberTurfs = new Set<string>(); // Track found turfs to prevent duplicates

      turfs.forEach((turfArea) => {
        if (turfArea.polygon) {
          const point = turf.point([
            (memberCoordinates as { lng: number; lat: number }).lng,
            (memberCoordinates as { lng: number; lat: number }).lat,
          ]);
          const isInside = turf.booleanPointInPolygon(point, turfArea.polygon);

          console.log("AreasContainingRecord - Member turf check:", {
            recordId,
            turfId: turfArea.id,
            turfName: turfArea.label,
            memberCoordinates,
            isInside,
          });

          if (isInside && !foundMemberTurfs.has(turfArea.id)) {
            foundMemberTurfs.add(turfArea.id);
            areasContainingRecord.push({
              type: LayerType.Turf,
              name: turfArea.label || `Area ${turfArea.id}`,
              id: turfArea.id,
            });
          }
        }
      });
    } else {
      console.log("AreasContainingRecord - Skipping member spatial analysis:", {
        recordId,
        reason: !memberCoordinates
          ? "No coordinates available"
          : "No turfs available",
        memberCoordinates,
        turfsCount: turfs?.length || 0,
      });
    }
  } else if (recordType === LayerType.Marker) {
    // For markers: Use spatial analysis to find which boundaries contain this marker
    const marker = placedMarkers?.find((m) => m.id === recordId);
    if (marker && mapRef?.current && choroplethLayerConfig) {
      const map = mapRef.current;
      const { sourceId, layerId, featureCodeProperty, featureNameProperty } =
        choroplethLayerConfig.mapbox;

      // Get all boundary features from the map
      const features = map.querySourceFeatures(sourceId, {
        sourceLayer: layerId,
      });

      // Check which boundaries contain this marker
      const foundBoundaries = new Set<string>(); // Track found boundary codes to prevent duplicates

      features.forEach((feature) => {
        if (
          feature.geometry &&
          (feature.geometry.type === "Polygon" ||
            feature.geometry.type === "MultiPolygon")
        ) {
          const point = turf.point([marker.point.lng, marker.point.lat]);
          const isInside = turf.booleanPointInPolygon(
            point,
            feature as Feature<Polygon | MultiPolygon>,
          );

          if (isInside) {
            const boundaryName =
              feature.properties?.[featureNameProperty] || "Unknown Boundary";
            const boundaryCode = feature.properties?.[featureCodeProperty];

            // Only add if we haven't seen this boundary code before
            if (boundaryCode && !foundBoundaries.has(boundaryCode)) {
              foundBoundaries.add(boundaryCode);
              areasContainingRecord.push({
                type: LayerType.Boundary,
                name: boundaryName,
                code: boundaryCode,
                areaSetName: "Westminster Constituencies",
              });
            }
          }
        }
      });

      // Also check if the marker is inside any custom areas (turfs)
      const foundTurfs = new Set<string>(); // Track found turf IDs to prevent duplicates

      turfs?.forEach((turfArea) => {
        if (turfArea.polygon) {
          const point = turf.point([marker.point.lng, marker.point.lat]);
          const isInside = turf.booleanPointInPolygon(point, turfArea.polygon);

          if (isInside && !foundTurfs.has(turfArea.id)) {
            foundTurfs.add(turfArea.id);
            areasContainingRecord.push({
              type: LayerType.Turf,
              name: turfArea.label || `Area ${turfArea.id}`,
              id: turfArea.id,
            });
          }
        }
      });
    }
  }

  const handleAreaClick = (area: {
    type: LayerType;
    name: string;
    code?: string;
    id?: string;
  }) => {
    const parent = {
      type: recordType,
      name: inspectorContent?.name || "Record",
      id: unifiedId, // Use unified identifier for parent
    };

    if (area.type === LayerType.Boundary && area.code) {
      // Fetch the actual boundary feature from the map
      if (!mapRef?.current || !choroplethLayerConfig) {
        console.log("No map or choropleth config available");
        return;
      }

      const map = mapRef.current;
      const { sourceId, layerId, featureCodeProperty } =
        choroplethLayerConfig.mapbox;

      const features = map.querySourceFeatures(sourceId, {
        sourceLayer: layerId,
        filter: ["==", featureCodeProperty, area.code],
      });

      if (features.length > 0) {
        const feature = features[0];
        const inspectorContent =
          InspectorContentFactory.createBoundaryInspectorContent(
            area.name,
            feature as unknown as Record<string, unknown>,
            area.code,
            parent,
          );
        setInspectorContent(inspectorContent);
      } else {
        console.log("No boundary feature found for code:", area.code);
      }
    } else if (area.type === LayerType.Turf) {
      // Navigate to area view - use complete turf data like when clicking on map
      const turf = turfs?.find((t) => t.id === area.id);
      if (turf) {
        // Find the index of this turf in the visible turfs array for consistent naming
        const turfIndex = turfs.findIndex((t) => t.id === turf.id);
        const areaNumber = turfIndex >= 0 ? turfIndex + 1 : 1;

        const inspectorContent =
          InspectorContentFactory.createTurfInspectorContent(
            turf,
            areaNumber,
            parent,
          );
        setInspectorContent(inspectorContent);
      } else {
        console.log("Turf not found:", area.id);
      }
    }
  };

  console.log("AreasContainingRecord - Final result:", {
    recordId,
    recordType,
    areasFound: areasContainingRecord.length,
    areas: areasContainingRecord,
  });

  // Show loading state if we're fetching record data
  if (isLoadingRecord) {
    return (
      <div className="flex flex-col gap-3 border-t pt-2 bg-white">
        <h3 className="text-xs font-mono uppercase text-muted-foreground">
          Found in:
        </h3>
        <div className="text-sm text-muted-foreground">
          Loading record data...
        </div>
      </div>
    );
  }

  // Don't render anything if no areas are found
  if (areasContainingRecord.length === 0) {
    console.log("AreasContainingRecord - No areas found, returning null");
    return null;
  }

  return (
    <div className="flex flex-col gap-3 border-t pt-2 bg-white">
      <h3 className="text-xs font-mono uppercase text-muted-foreground">
        Found in:
      </h3>

      <div className="flex flex-col gap-2">
        {areasContainingRecord.map((area) => (
          <div
            onClick={() => handleAreaClick(area)}
            key={`${area.type}-${area.code || area.id}`}
            className="flex items-center cursor-pointer p-1 gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <LayerIcon type={area.type} />
              <span className="text-sm font-medium">{area.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
