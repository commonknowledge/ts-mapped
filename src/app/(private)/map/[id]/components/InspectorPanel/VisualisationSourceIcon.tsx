"use client";

import DataSourceIcon from "@/components/DataSourceIcon";
import { useDataSources } from "@/hooks/useDataSources";
import { useMarkerLayerColor } from "../../hooks/useMarkerLayerColor";
import RingSwatch from "../RingSwatch";

// The same icon as the visualisation's row in the Areas list: a marker
// layer's ring, or the data source's type icon
export default function VisualisationSourceIcon({
  dataSourceId,
}: {
  dataSourceId: string;
}) {
  const { getDataSourceById } = useDataSources();
  const markerColor = useMarkerLayerColor(dataSourceId);
  if (markerColor) return <RingSwatch color={markerColor} size={12} />;
  return (
    <span className="flex size-3.5 shrink-0 items-center justify-center [&_svg]:size-3.5">
      <DataSourceIcon
        type={getDataSourceById(dataSourceId)?.config.type ?? "unknown"}
      />
    </span>
  );
}
