import { useEffect, useRef } from "react";
import type { SelectedBoundary } from "@/app/map/[id]/context/InspectorContext";
import type { AreaSetCode } from "@/server/models/AreaSet";
import type { MapRef } from "react-map-gl/mapbox";

export function useChoroplethClick(
  mapRef: React.RefObject<MapRef | null> | null,
  sourceId: string,
  layerId: string,
  featureCodeProperty: string,
  featureNameProperty: string,
  areaSetCode: AreaSetCode,
  resetInspector: () => void,
  setSelectedBoundary: (args: SelectedBoundary | null) => void,
) {
  const activeFeatureId = useRef<string | number | undefined>(undefined);

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

          // Set active state on current feature
          activeFeatureId.current = feature.id;
          map.setFeatureState(
            { source: sourceId, sourceLayer: layerId, id: feature.id },
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on("click", onClick as any);

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.off("click", onClick as any);
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
}
