import { Layer, Source } from "react-map-gl/mapbox";
import { useSecondaryAreaSetConfig } from "../hooks/useSecondaryAreaSet";
import type { ChoroplethLayerConfig } from "./Choropleth/configs";

const SECONDARY_TOP_LAYER_ID = "secondary-top";

export default function SecondaryBoundaries() {
  const config = useSecondaryAreaSetConfig();
  return (
    <>
      {/* Position layer */}
      <Source
        id={SECONDARY_TOP_LAYER_ID}
        key={SECONDARY_TOP_LAYER_ID}
        type="geojson"
        data={{ type: "FeatureCollection", features: [] }}
      >
        <Layer
          id={SECONDARY_TOP_LAYER_ID}
          source={SECONDARY_TOP_LAYER_ID}
          type="circle"
        />
        <Layer
          id={`${SECONDARY_TOP_LAYER_ID}-line`}
          source={SECONDARY_TOP_LAYER_ID}
          type="circle"
        />
      </Source>
      {config && <Boundaries config={config} />}
    </>
  );
}

function Boundaries({ config }: { config: ChoroplethLayerConfig }) {
  const {
    mapbox: { sourceId, layerId, featureCodeProperty },
  } = config;
  const secondarySourceId = `${sourceId}-secondary`;
  return (
    <Source
      id={secondarySourceId}
      key={secondarySourceId}
      promoteId={featureCodeProperty}
      type="vector"
      url={`mapbox://${sourceId}`}
    >
      {/* Line Layer */}
      <Layer
        id={`${sourceId}-line`}
        beforeId={`${SECONDARY_TOP_LAYER_ID}-line`}
        source={secondarySourceId}
        source-layer={layerId}
        type="line"
        paint={{
          "line-color": "#555",
          "line-width": 3,
          "line-opacity": 1,
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round",
        }}
      />
      {/* Fill Layer */}
      <Layer
        id={`${sourceId}-fill`}
        beforeId={SECONDARY_TOP_LAYER_ID}
        source={secondarySourceId}
        source-layer={layerId}
        type="fill"
        paint={{
          "fill-opacity": 0,
        }}
      />
    </Source>
  );
}
