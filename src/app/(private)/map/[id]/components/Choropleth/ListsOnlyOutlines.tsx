import { Layer, Source } from "react-map-gl/mapbox";
import { MapType } from "@/models/MapView";
import { useAreaListVisibility, useAreaLists } from "../../hooks/useAreaLists";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useInspectorState } from "../../hooks/useInspectorState";
import { useMapMode } from "../../hooks/useMapCore";
import { useMapViews } from "../../hooks/useMapViews";
import { getSecondaryAreaSetConfig } from "./configs";
import { listsOnlyFillLayerId, listsOnlySourceId } from "./listsOnly";

/**
 * Lists on their own boundary sets, so a list always shows whatever the
 * map's boundaries: with "Lists only" (or no boundaries) every shown list,
 * otherwise those on a different set from the map's (lists on the same set
 * are outlined by AreaListOutlines). Each is outlined in its colour; with
 * "Lists only" its areas can be hovered and clicked open in the inspector.
 */
export default function ListsOnlyOutlines({ beforeId }: { beforeId: string }) {
  const mapMode = useMapMode();
  const { viewConfig } = useMapViews();
  const { lists } = useAreaLists();
  const { isVisible } = useAreaListVisibility();
  const { selectedBoundary } = useInspectorState();
  const { choroplethLayerConfig } = useChoropleth();
  if (mapMode !== "private" || viewConfig.mapType === MapType.Hex) {
    return null;
  }

  // With boundaries on the map, lists on those are outlined there instead
  const hasBoundaries = Boolean(viewConfig.areaSetGroupCode);
  const shown = lists.filter(
    (list) =>
      isVisible(list.id) &&
      list.areas.length > 0 &&
      (!hasBoundaries ||
        list.areaSetCode !== choroplethLayerConfig.areaSetCode),
  );
  // One source per boundary set, shared by its lists
  const sources = [...new Set(shown.map((list) => list.areaSetCode))].flatMap(
    (areaSetCode) => {
      const config = getSecondaryAreaSetConfig({
        areaSetCode,
        mapType: viewConfig.mapType,
      });
      return config
        ? [
            {
              areaSetCode,
              config,
              lists: shown.filter((list) => list.areaSetCode === areaSetCode),
            },
          ]
        : [];
    },
  );

  return sources.map(({ areaSetCode, config: { mapbox }, lists: setLists }) => {
    const sourceId = listsOnlySourceId(areaSetCode);
    const codeProperty = mapbox.featureCodeProperty;
    const selectedCode =
      selectedBoundary?.areaSetCode === areaSetCode
        ? selectedBoundary.code
        : "";
    return (
      <Source
        key={sourceId}
        id={sourceId}
        type="vector"
        url={`mapbox://${mapbox.sourceId}`}
        promoteId={codeProperty}
      >
        {/* Invisible except on hover, so the list's areas can be clicked */}
        <Layer
          id={listsOnlyFillLayerId(areaSetCode)}
          beforeId={beforeId}
          source={sourceId}
          source-layer={mapbox.layerId}
          type="fill"
          filter={[
            "in",
            ["get", codeProperty],
            [
              "literal",
              setLists.flatMap((list) => list.areas.map((a) => a.code)),
            ],
          ]}
          paint={{
            "fill-color": "#000000",
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.15,
              0,
            ],
          }}
        />
        {setLists.map((list) => (
          <Layer
            key={list.id}
            id={`${sourceId}-${list.id}`}
            beforeId={beforeId}
            source={sourceId}
            source-layer={mapbox.layerId}
            type="line"
            filter={[
              "in",
              ["get", codeProperty],
              ["literal", list.areas.map((area) => area.code)],
            ]}
            paint={{
              "line-color": list.color,
              "line-width": [
                "case",
                ["==", ["get", codeProperty], selectedCode],
                4,
                2.5,
              ],
            }}
            layout={{ "line-cap": "round", "line-join": "round" }}
          />
        ))}
      </Source>
    );
  });
}
