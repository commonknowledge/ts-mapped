import { useContext, useEffect, useRef } from "react";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";

export function useChoroplethClick() {
  const { mapRef } = useContext(MapContext);
  const { choroplethLayerConfig } = useContext(ChoroplethContext);
  const { resetInspector, setSelectedBoundary, selectedBoundary } =
    useContext(InspectorContext);

  const {
    mapbox: { sourceId, layerId, featureCodeProperty, featureNameProperty },
    areaSetCode,
  } = choroplethLayerConfig;

  const activeFeatureId = useRef<string | undefined>(undefined);

  /* Handle clicks on choropleth areas to set active state */
  useEffect(() => {
    if (!mapRef?.current) {
      return;
    }

    const map = mapRef.current;
    const fillLayerId = `${sourceId}-fill`;
    const lineLayerId = `${sourceId}-line`;

    const onClick = (e: mapboxgl.MapMouseEvent) => {
      if (!map.getLayer(fillLayerId) && !map.getLayer(lineLayerId)) {
        return;
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: [fillLayerId, lineLayerId].filter((l) => map.getLayer(l)),
      });

      if (features.length > 0) {
        const feature = features[0];
        const areaCode = feature.properties?.[featureCodeProperty] as string;
        const areaName = feature.properties?.[featureNameProperty] as string;

        if (areaCode && areaName && feature.id !== undefined) {
          // Remove active state from previous feature
          if (activeFeatureId.current !== undefined) {
            map.setFeatureState(
              {
                source: sourceId,
                sourceLayer: layerId,
                id: activeFeatureId.current,
              },
              { active: false },
            );
          }

          // Use areaCode as the ID for feature state (matches promoteId)
          activeFeatureId.current = areaCode;
          map.setFeatureState(
            { source: sourceId, sourceLayer: layerId, id: areaCode },
            { active: true },
          );

          // Prevent default context menu
          e.originalEvent.preventDefault();

          resetInspector();

          setSelectedBoundary({
            id: feature?.id as string,
            areaCode: areaCode,
            areaSetCode: areaSetCode,
            sourceLayerId: feature?.sourceLayer as string,
            name: areaName,
            properties: feature?.properties || null,
          });
        }
      }
    };

    map.on("click", onClick);

    return () => {
      // Clean up active state on unmount
      if (activeFeatureId.current !== undefined) {
        map.setFeatureState(
          {
            source: sourceId,
            sourceLayer: layerId,
            id: activeFeatureId.current,
          },
          { active: false },
        );
      }

      map.off("click", onClick);
    };
  }, [
    mapRef,
    sourceId,
    layerId,
    featureCodeProperty,
    featureNameProperty,
    areaSetCode,
    resetInspector,
    setSelectedBoundary,
  ]);

  // Clear active feature state when selectedBoundary is cleared (resetInspector called from outside)
  useEffect(() => {
    if (
      selectedBoundary === null &&
      mapRef?.current &&
      activeFeatureId.current !== undefined
    ) {
      const map = mapRef.current;
      map.setFeatureState(
        {
          source: sourceId,
          sourceLayer: layerId,
          id: activeFeatureId.current,
        },
        { active: false },
      );
      activeFeatureId.current = undefined;
    }
  }, [selectedBoundary, mapRef, sourceId, layerId]);
}
