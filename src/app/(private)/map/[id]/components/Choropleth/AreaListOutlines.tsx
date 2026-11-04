import { Layer } from "react-map-gl/mapbox";
import { useAreaListVisibility, useAreaLists } from "../../hooks/useAreaLists";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useMapMode } from "../../hooks/useMapCore";

/**
 * Each shown list of areas, outlined in its colour on the boundaries on
 * screen (when they're the list's). Private maps only: lists are working
 * notes, not part of a published map.
 */
export default function AreaListOutlines({
  sourceId,
  sourceLayer,
  codeProperty,
}: {
  sourceId: string;
  sourceLayer: string;
  codeProperty: string;
}) {
  const mapMode = useMapMode();
  const { lists } = useAreaLists();
  const { isVisible } = useAreaListVisibility();
  const { choroplethLayerConfig } = useChoropleth();
  if (mapMode !== "private") return null;

  return lists
    .filter(
      (list) =>
        isVisible(list.id) &&
        list.areas.length > 0 &&
        list.areaSetCode === choroplethLayerConfig.areaSetCode,
    )
    .map((list) => (
      <Layer
        key={list.id}
        id={`${sourceId}-list-${list.id}`}
        source={sourceId}
        source-layer={sourceLayer}
        type="line"
        filter={[
          "in",
          ["get", codeProperty],
          ["literal", list.areas.map((area) => area.code)],
        ]}
        paint={{ "line-color": list.color, "line-width": 2.5 }}
      />
    ));
}
