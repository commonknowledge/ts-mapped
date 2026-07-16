import { useMemo } from "react";
import { useInspectorContent } from "@/app/(private)/map/[id]/hooks/useInspector";
import { useInspectorState } from "@/app/(private)/map/[id]/hooks/useInspectorState";
import { DataSourceRecordType } from "@/models/DataSource";
import { useMarkerQueries } from "../../hooks/useMarkerQueries";
import { MarkersList, MembersList } from "./MarkersLists";
import type { MarkerFeature } from "@/types";

export default function ClusterMarkersList() {
  const { selectedRecords } = useInspectorState();
  const { inspectorContent } = useInspectorContent();
  const markerQueries = useMarkerQueries();
  const recordType = inspectorContent?.dataSource?.recordType;

  // Selected records only carry id/name/position, but the loaded marker
  // features also carry the styling column values (icon/colour/size), so
  // rows can show each marker's map shape and colour
  const featureByRecord = useMemo(() => {
    const lookup = new Map<string, MarkerFeature>();
    for (const group of markerQueries.data ?? []) {
      for (const feature of group.markers) {
        lookup.set(`${group.dataSourceId}:${feature.properties.id}`, feature);
      }
    }
    return lookup;
  }, [markerQueries.data]);

  const markerFeatures = selectedRecords
    .map((r): MarkerFeature | null => {
      if (!r.dataSourceId || !r.geocodePoint) {
        // Should never happen for markers in a cluster
        return null;
      }
      const feature = featureByRecord.get(`${r.dataSourceId}:${r.id}`);
      if (feature) {
        return feature;
      }
      return {
        type: "Feature",
        geometry: {
          // [0, 0] should never happen because these records are in a cluster on the map
          coordinates: [r.geocodePoint?.lng || 0, r.geocodePoint?.lat || 0],
          type: "Point",
        },
        properties: {
          id: r.id,
          name: r.name,
          dataSourceId: r.dataSourceId,
          matched: true,
        },
      };
    })
    .filter((r) => r !== null);

  return (
    <div className="flex flex-col gap-6">
      {recordType === DataSourceRecordType.Members ? (
        <MembersList
          dataSource={inspectorContent?.dataSource}
          markers={markerFeatures}
          areaType="cluster"
        />
      ) : (
        <MarkersList
          dataSource={inspectorContent?.dataSource}
          markers={markerFeatures}
        />
      )}
    </div>
  );
}
