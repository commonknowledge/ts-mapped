import { useContext, useMemo } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { mapColors } from "../styles";
import type { FeatureCollection, Polygon } from "geojson";

export default function TurfVisibilityManager() {
    const { turfs, getTurfVisibility } = useContext(MarkerAndTurfContext);
    const { viewConfig } = useMapViews();

    const visibleTurfs = useMemo(() => {
        return turfs.filter((turf) => {
            // Check individual visibility first
            if (!getTurfVisibility(turf.id)) {
                return false;
            }

            // Then check global area visibility
            return viewConfig.showTurf;
        });
    }, [turfs, getTurfVisibility, viewConfig.showTurf]);

    const features: FeatureCollection<Polygon> = {
        type: "FeatureCollection",
        features: visibleTurfs.map((turf) => ({
            type: "Feature",
            properties: {
                id: turf.id,
                label: turf.label,
                area: turf.area,
            },
            geometry: turf.polygon,
        })),
    };

    if (visibleTurfs.length === 0) {
        return null;
    }

    return (
        <Source id="turf-areas" type="geojson" data={features}>
            {/* Fill layer */}
            <Layer
                id="turf-areas-fill"
                type="fill"
                source="turf-areas"
                paint={{
                    "fill-color": mapColors.areas.color,
                    "fill-opacity": 0.3,
                }}
            />

            {/* Stroke layer */}
            <Layer
                id="turf-areas-stroke"
                type="line"
                source="turf-areas"
                paint={{
                    "line-color": mapColors.areas.color,
                    "line-width": 2,
                    "line-opacity": 0.8,
                }}
            />

            {/* Labels */}
            <Layer
                id="turf-areas-labels"
                type="symbol"
                source="turf-areas"
                layout={{
                    "text-field": ["get", "label"],
                    "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
                    "text-size": 12,
                    "text-transform": "uppercase",
                    "text-offset": [0, 0],
                    "text-anchor": "center",
                }}
                paint={{
                    "text-color": mapColors.areas.color,
                    "text-halo-color": "#ffffff",
                    "text-halo-width": 1,
                }}
            />
        </Source>
    );
}
