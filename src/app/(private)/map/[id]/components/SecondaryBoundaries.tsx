import { Layer, Source } from "react-map-gl/mapbox";
import { useMapViews } from "../hooks/useMapViews";
import { useOverlayBoundaries } from "../hooks/useOverlayBoundaries";
import { useSecondaryAreaSetConfig } from "../hooks/useSecondaryAreaSet";
import { DEFAULT_SECONDARY_BOUNDARY_STROKE_COLOR } from "../styles";
import { getSecondaryAreaSetConfig } from "./Choropleth/configs";
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
      <ExtraOverlays />
    </>
  );
}

// Overlays after the first visible one (which is drawn above, from
// secondaryAreaSetCode, as hover and the inspector rely on its layer ids)
function ExtraOverlays() {
  const { viewConfig } = useMapViews();
  // The overlays as this view sees them (shared list, its own visibility)
  const { items } = useOverlayBoundaries();
  const extras = items.filter((overlay) => overlay.visible).slice(1);

  return (
    <>
      {extras.map((overlay) => {
        const config = getSecondaryAreaSetConfig({
          areaSetCode: overlay.areaSetCode,
          mapType: viewConfig.mapType,
        });
        if (!config) return null;
        const { sourceId, layerId } = config.mapbox;
        const overlaySourceId = `${sourceId}-overlay-${overlay.id}`;
        return (
          <Source
            id={overlaySourceId}
            key={overlaySourceId}
            type="vector"
            url={`mapbox://${sourceId}`}
          >
            <Layer
              id={`${overlaySourceId}-line`}
              beforeId={`${SECONDARY_TOP_LAYER_ID}-line`}
              source={overlaySourceId}
              source-layer={layerId}
              type="line"
              paint={{
                "line-color":
                  overlay.color || DEFAULT_SECONDARY_BOUNDARY_STROKE_COLOR,
                "line-width": 1.5,
              }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
          </Source>
        );
      })}
    </>
  );
}

function Boundaries({ config }: { config: ChoroplethLayerConfig }) {
  const { viewConfig } = useMapViews();
  const {
    mapbox: { sourceId, layerId, featureCodeProperty },
  } = config;
  const secondarySourceId = `${sourceId}-secondary`;
  const strokeColor =
    viewConfig.secondaryBoundaryStrokeColor ||
    DEFAULT_SECONDARY_BOUNDARY_STROKE_COLOR;
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
        id={`${sourceId}-secondary-line`}
        beforeId={`${SECONDARY_TOP_LAYER_ID}-line`}
        source={secondarySourceId}
        source-layer={layerId}
        type="line"
        paint={{
          "line-color": strokeColor,
          "line-width": 1.5,
          "line-opacity": 1,
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round",
        }}
      />
      {/* Fill Layer */}
      <Layer
        id={`${sourceId}-secondary-fill`}
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
