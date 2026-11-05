import { Layer, Source } from "react-map-gl/mapbox";
import { MapType } from "@/models/MapView";
import { useQuickAddAreaList } from "../../hooks/useAreaLists";
import { useMapMode } from "../../hooks/useMapCore";
import { useMapViews } from "../../hooks/useMapViews";
import { getSecondaryAreaSetConfig } from "./configs";
import { quickAddFillLayerId, quickAddSourceId } from "./listsOnly";

/**
 * While adding to a list by clicking: the list's boundary set over the map,
 * whatever the map shows, every area clickable and the list's own shaded in
 * its colour, so each click shows straight away
 */
export default function QuickAddLayer() {
  const mapMode = useMapMode();
  const { viewConfig } = useMapViews();
  const { list } = useQuickAddAreaList();
  if (!list || mapMode !== "private" || viewConfig.mapType === MapType.Hex) {
    return null;
  }
  const config = getSecondaryAreaSetConfig({
    areaSetCode: list.areaSetCode,
    mapType: viewConfig.mapType,
  });
  if (!config) return null;

  const { mapbox } = config;
  const sourceId = quickAddSourceId(list.areaSetCode);
  const isInList = [
    "in",
    ["get", mapbox.featureCodeProperty],
    ["literal", list.areas.map((area) => area.code)],
  ];
  return (
    <Source
      id={sourceId}
      type="vector"
      url={`mapbox://${mapbox.sourceId}`}
      promoteId={mapbox.featureCodeProperty}
    >
      <Layer
        id={quickAddFillLayerId(list.areaSetCode)}
        source={sourceId}
        source-layer={mapbox.layerId}
        type="fill"
        paint={{
          "fill-color": list.color,
          "fill-opacity": ["case", isInList, 0.4, 0],
        }}
      />
      <Layer
        id={`${sourceId}-line`}
        source={sourceId}
        source-layer={mapbox.layerId}
        type="line"
        paint={{
          "line-color": ["case", isInList, list.color, "#737373"],
          "line-width": ["case", isInList, 2.5, 0.5],
        }}
      />
    </Source>
  );
}
