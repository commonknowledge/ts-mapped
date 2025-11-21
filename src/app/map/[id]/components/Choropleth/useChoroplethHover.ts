import { useEffect } from "react";
import type { MapRef } from "react-map-gl/mapbox";

export function useChoroplethHover(
  mapRef: React.RefObject<MapRef | null> | null,
  sourceId: string,
  layerId: string,
) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on("mousemove", onMouseMove as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on("mouseleave", onMouseLeave as any);

    return () => {
      // Clean up hover state on unmount
      if (hoveredFeatureId !== undefined) {
        map.setFeatureState(
          { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
          { hover: false },
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.off("mousemove", onMouseMove as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.off("mouseleave", onMouseLeave as any);
    };
  }, [mapRef, sourceId, layerId]);
}
