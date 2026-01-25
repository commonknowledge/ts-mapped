import { LayerType } from "@/types";
import BoundaryMarkersList from "./BoundaryMarkersList";
import ClusterMarkersList from "./ClusterMarkersList";
import TurfMarkersList from "./TurfMarkersList";

interface InspectorMarkersTabProps {
  type: LayerType;
}

export default function InspectorMarkersTab({
  type,
}: InspectorMarkersTabProps) {
  return (
    <div className="flex flex-col gap-4">
      {type === LayerType.Cluster && <ClusterMarkersList />}
      {type === LayerType.Turf && <TurfMarkersList />}
      {type === LayerType.Boundary && <BoundaryMarkersList />}
    </div>
  );
}
