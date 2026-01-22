import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { MarkersList, MembersList } from "./MarkersLists";
import type { MarkerFeature } from "@/types";

export default function ClusterMarkersList() {
  const { getDataSourceById } = useDataSources();
  const { selectedRecords, inspectorContent } = useInspector();
  const dataSource = getDataSourceById(inspectorContent?.dataSource?.id);
  const recordType = dataSource?.recordType;
  const markerFeatures = selectedRecords
    .map((r): MarkerFeature | null => {
      if (!r.dataSourceId || !r.geocodePoint) {
        // Should never happen for markers in a cluster
        return null;
      }
      return {
        type: "Feature",
        geometry: {
          coordinates: [r.geocodePoint.lng, r.geocodePoint.lat],
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
          dataSource={dataSource}
          markers={markerFeatures}
          areaType="cluster"
        />
      ) : (
        <MarkersList dataSource={dataSource} markers={markerFeatures} />
      )}
    </div>
  );
}
