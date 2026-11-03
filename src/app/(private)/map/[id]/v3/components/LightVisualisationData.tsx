"use client";

import Legend from "../../components/Legend/Legend";
import { useMapViews } from "../../hooks/useMapViews";
import { useSavedVisualisations } from "../../hooks/useSavedVisualisations";
import LightDataSourceList from "./LightDataSourceList";

// The top of the visualisation flyout: a list of data sources to pick from,
// then the data pickers (column, second column, aggregation) once one is
// chosen. The colour key stays in the sidebar.
export default function LightVisualisationData() {
  const { viewConfig } = useMapViews();
  const { chooseDataSource } = useSavedVisualisations();

  if (!viewConfig.areaDataSourceId) {
    return <LightDataSourceList onSelect={(ds) => chooseDataSource(ds.id)} />;
  }

  return (
    <Legend
      showLegendBars={false}
      showBoundaryControls={false}
      framed={false}
    />
  );
}
