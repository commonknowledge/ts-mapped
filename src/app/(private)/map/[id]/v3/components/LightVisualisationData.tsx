"use client";

import Legend from "../../components/Legend/Legend";

// The data pickers (source, column, second column, aggregation) for the top
// of the visualisation flyout; the colour key stays in the sidebar
export default function LightVisualisationData() {
  return (
    <Legend
      showLegendBars={false}
      showBoundaryControls={false}
      framed={false}
    />
  );
}
