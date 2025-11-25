import { useContext, useEffect } from "react";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";

export function useChoroplethHover() {
  const { mapRef } = useContext(MapContext);
  const { choroplethLayerConfig } = useContext(ChoroplethContext);
  const {
    mapbox: { sourceId, layerId },
  } = choroplethLayerConfig;

  /* Set cursor to pointer and darken fill on hover over choropleth areas */
  useEffect(() => {
    if (!mapRef?.current) {
      return;
    }

    const map = mapRef.current;
    const fillLayerId = `${sourceId}-fill`;
    const lineLayerId = `${sourceId}-line`;
    const prevPointer = { cursor: "" };
    let hoveredFeatureId: string | number | undefined;

    const onMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!map.getLayer(fillLayerId) && !map.getLayer(lineLayerId)) {
        return;
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: [fillLayerId, lineLayerId].filter((l) => map.getLayer(l)),
      });

      if (features?.length) {
        const feature = features[0];

        // Remove hover state from previous feature
        if (hoveredFeatureId !== undefined) {
          map.setFeatureState(
            { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
            { hover: false },
          );
        }

        // Set hover state on current feature
        if (feature.id !== undefined) {
          hoveredFeatureId = feature.id;
          map.setFeatureState(
            { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
            { hover: true },
          );
        }

        if (map.getCanvas().style.cursor !== "pointer") {
          prevPointer.cursor = map.getCanvas().style.cursor || "";
        }
        map.getCanvas().style.cursor = "pointer";
      } else {
        if (hoveredFeatureId !== undefined) {
          map.setFeatureState(
            { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
            { hover: false },
          );
          hoveredFeatureId = undefined;
        }

        if (map.getCanvas().style.cursor === "pointer") {
          map.getCanvas().style.cursor = prevPointer.cursor;
        }
      }
    };

    const onMouseLeave = () => {
      if (hoveredFeatureId !== undefined) {
        map.setFeatureState(
          { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
          { hover: false },
        );
        hoveredFeatureId = undefined;
      }
      map.getCanvas().style.cursor = prevPointer.cursor;
    };

    map.on("mousemove", onMouseMove);
    map.on("mouseleave", onMouseLeave);

    return () => {
      // Clean up hover state on unmount
      if (hoveredFeatureId !== undefined) {
        map.setFeatureState(
          { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
          { hover: false },
        );
      }

      map.off("mousemove", onMouseMove);
      map.off("mouseleave", onMouseLeave);
    };
  }, [mapRef, sourceId, layerId]);
}
