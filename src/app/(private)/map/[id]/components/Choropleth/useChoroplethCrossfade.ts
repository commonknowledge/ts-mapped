import { useEffect, useRef } from "react";
import { useAreaStats } from "@/app/(private)/map/[id]/data";
import { useChoropleth } from "@/app/(private)/map/[id]/hooks/useChoropleth";
import { useMapRef } from "@/app/(private)/map/[id]/hooks/useMapCore";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import { CHOROPLETH_CROSSFADE_MS } from "../../constants";
import { withPreviousValues } from "./utils";
import type { DataDrivenPropertyValueSpecification } from "mapbox-gl";

interface Shown {
  key: string;
  sourceId: string;
  fillColor: DataDrivenPropertyValueSpecification<string>;
  values: Map<string, { primary: unknown; secondary: unknown }>;
}

/**
 * Fades the areas from one view's data to the next rather than blanking
 * them while the new data loads. Mapbox can't animate colours worked out
 * per area, so the previous colours are kept in a copy of the fill that
 * reads a copy of the old values, and it fades out as the new fill fades in.
 * Imperative: the layers' opacities are animated outside React.
 */
export function useChoroplethCrossfade({
  fillColor,
  mainLayerId,
  previousLayerId,
  opacity,
}: {
  fillColor: DataDrivenPropertyValueSpecification<string>;
  mainLayerId: string;
  previousLayerId: string;
  opacity: number;
}) {
  const mapRef = useMapRef();
  const { data: areaStats } = useAreaStats();
  const { viewConfig } = useMapViews();
  const hasVisualisation = Boolean(
    viewConfig.areaDataSourceId && viewConfig.areaDataColumn,
  );
  const {
    choroplethLayerConfig: {
      mapbox: { sourceId, layerId },
    },
  } = useChoropleth();

  // What the areas last showed, and whether it's still on screen above them
  const shown = useRef<Shown | null>(null);
  const isHolding = useRef(false);
  const timers = useRef<{ frame?: number; timeout?: number }>({});

  useEffect(() => {
    const map = mapRef?.current?.getMap();
    if (!map) return;
    const hasLayers = () =>
      Boolean(map.getLayer(mainLayerId) && map.getLayer(previousLayerId));

    // Puts the previous view's colours over the areas, at full strength
    const hold = (previous: Shown) => {
      if (isHolding.current || !hasLayers() || !opacity) return;
      if (previous.sourceId !== sourceId) return;
      previous.values.forEach((value, areaCode) =>
        map.setFeatureState(
          { source: sourceId, sourceLayer: layerId, id: areaCode },
          { prevValue: value.primary, prevSecondaryValue: value.secondary },
        ),
      );
      map.setPaintProperty(
        previousLayerId,
        "fill-color",
        withPreviousValues(previous.fillColor),
      );
      map.setPaintProperty(previousLayerId, "fill-opacity-transition", {
        duration: 0,
        delay: 0,
      });
      map.setPaintProperty(previousLayerId, "fill-opacity", opacity);
      isHolding.current = true;
    };

    // The new colours fade in from nothing, and the held ones fade out
    const fadeIn = () => {
      if (!hasLayers() || !opacity) return;
      cancelAnimationFrame(timers.current.frame ?? 0);
      window.clearTimeout(timers.current.timeout);
      const instant = { duration: 0, delay: 0 };
      const fade = { duration: CHOROPLETH_CROSSFADE_MS, delay: 0 };
      map.setPaintProperty(mainLayerId, "fill-opacity-transition", instant);
      map.setPaintProperty(mainLayerId, "fill-opacity", 0);
      // A frame at 0 first, so the fade has somewhere to start from
      timers.current.frame = requestAnimationFrame(() => {
        timers.current.frame = requestAnimationFrame(() => {
          map.setPaintProperty(mainLayerId, "fill-opacity-transition", fade);
          map.setPaintProperty(mainLayerId, "fill-opacity", opacity);
          map.setPaintProperty(
            previousLayerId,
            "fill-opacity-transition",
            fade,
          );
          map.setPaintProperty(previousLayerId, "fill-opacity", 0);
          timers.current.timeout = window.setTimeout(() => {
            isHolding.current = false;
          }, CHOROPLETH_CROSSFADE_MS);
        });
      });
    };

    // Fades out whatever's held, e.g. once there's nothing to fade across to
    const release = () => {
      cancelAnimationFrame(timers.current.frame ?? 0);
      window.clearTimeout(timers.current.timeout);
      isHolding.current = false;
      if (!hasLayers()) return;
      map.setPaintProperty(previousLayerId, "fill-opacity-transition", {
        duration: CHOROPLETH_CROSSFADE_MS,
        delay: 0,
      });
      map.setPaintProperty(previousLayerId, "fill-opacity", 0);
    };

    // Turned off or hidden: no data is coming, so don't hold the old colours
    if (!hasVisualisation || !opacity) {
      shown.current = null;
      release();
      return;
    }

    // Loading the next view's data: keep the last colours up meanwhile
    if (!areaStats) {
      if (shown.current) hold(shown.current);
      return;
    }

    const key = [
      areaStats.areaSetCode,
      areaStats.calculationType,
      areaStats.dataSourceId,
      areaStats.primary?.column,
      areaStats.secondary?.column,
    ].join("|");
    const previous = shown.current;
    shown.current = {
      key,
      sourceId,
      fillColor,
      values: new Map(
        areaStats.stats.map((stat) => [
          stat.areaCode,
          { primary: stat.primary ?? null, secondary: stat.secondary ?? null },
        ]),
      ),
    };

    // Different data from what was showing: fade across to it. More of
    // the same data (e.g. panning into new areas) just appears.
    if (previous && previous.key !== key) {
      hold(previous);
      fadeIn();
    }
  }, [
    areaStats,
    fillColor,
    hasVisualisation,
    layerId,
    mainLayerId,
    mapRef,
    opacity,
    previousLayerId,
    sourceId,
  ]);

  useEffect(() => {
    const current = timers.current;
    return () => {
      cancelAnimationFrame(current.frame ?? 0);
      window.clearTimeout(current.timeout);
    };
  }, []);
}
