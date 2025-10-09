import { useContext, useMemo } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { MARKER_MATCHED_KEY, MARKER_NAME_KEY } from "@/constants";
import { MARKER_ID_KEY } from "@/constants";
import { mapColors } from "../styles";
import { PublicFiltersContext } from "../view/[viewIdOrHost]/publish/context/PublicFiltersContext";
import type { PointFeature } from "@/types";
import type { FeatureCollection } from "geojson";

const MARKER_CLIENT_EXCLUDED_KEY = "__clientExcluded";

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function rgbaString(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function Markers() {
  const { viewConfig } = useMapViews();
  const { mapConfig } = useMapConfig();
  const { markerQueries } = useContext(MarkerAndTurfContext);

  const memberMarkers = useMemo(
    () =>
      markerQueries?.data.find(
        (dsm) => dsm.dataSourceId === mapConfig.membersDataSourceId,
      ),
    [markerQueries, mapConfig.membersDataSourceId],
  );

  const otherMarkers = useMemo(
    () =>
      mapConfig.markerDataSourceIds.map((id) =>
        markerQueries?.data.find((dsm) => dsm.dataSourceId === id),
      ),
    [markerQueries, mapConfig.markerDataSourceIds],
  );

  return (
    <>
      {memberMarkers && viewConfig.showMembers && (
        <DataSourceMarkers
          key={memberMarkers.dataSourceId}
          dataSourceMarkers={memberMarkers}
          isMembers
        />
      )}
      {otherMarkers.map((markers) => {
        if (!markers || !viewConfig.showLocations) {
          return null;
        }
        return (
          <DataSourceMarkers
            key={markers.dataSourceId}
            dataSourceMarkers={markers}
            isMembers={false}
          />
        );
      })}
    </>
  );
}

function DataSourceMarkers({
  dataSourceMarkers,
  isMembers,
}: {
  dataSourceMarkers: { dataSourceId: string; markers: PointFeature[] };
  isMembers: boolean;
}) {
  const { records, publicFilters } = useContext(PublicFiltersContext);

  const safeMarkers = useMemo<FeatureCollection>(() => {
    // Don't add MARKER_CLIENT_EXCLUDED_KEY property if no public filters exist
    if (Object.keys(publicFilters).length === 0) {
      return {
        type: "FeatureCollection",
        features: dataSourceMarkers.markers,
      };
    }

    // Add MARKER_CLIENT_EXCLUDED_KEY if public filters are set and marker is not matched
    const recordIds = (records || []).map((r) => r.id).filter(Boolean);
    return {
      type: "FeatureCollection",
      features: dataSourceMarkers.markers.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          [MARKER_CLIENT_EXCLUDED_KEY]: !recordIds.includes(
            String(f.properties[MARKER_ID_KEY]),
          ),
        },
      })),
    };
  }, [dataSourceMarkers.markers, publicFilters, records]);

  const sourceId = `${dataSourceMarkers.dataSourceId}-markers`;
  const colors = isMembers ? mapColors.member : mapColors.dataSource;
  return (
    <Source
      id={sourceId}
      key={sourceId}
      type="geojson"
      data={safeMarkers}
      // Disable clustering; use heatmap for density instead
    >
      {/* Heatmap layer replaces cluster circles/counts */}
      <Layer
        id={`${sourceId}-heatmap`}
        type="heatmap"
        source={sourceId}
        maxzoom={9}
        paint={{
          // Uniform weight (adjust if you have a numeric property to weight by)
          "heatmap-weight": [
            "case",
            [
              "any",
              ["!", ["get", MARKER_MATCHED_KEY]],
              ["get", MARKER_CLIENT_EXCLUDED_KEY],
            ],
            0.2, // Reduced weight for unmatched points (adjust as needed)
            1, // Full weight for matched points
          ],
          // Increase intensity as zoom level increases
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1,
            9,
            3,
          ],
          // Color ramp using the layer's base color
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            rgbaString(colors.color, 0),
            0.2,
            rgbaString(colors.color, 0.2),
            0.4,
            rgbaString(colors.color, 0.4),
            0.6,
            rgbaString(colors.color, 0.6),
            0.8,
            rgbaString(colors.color, 0.8),
            1,
            rgbaString(colors.color, 1),
          ],
          // Radius scales with zoom
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 9, 20],
          // Transition from heatmap to circles by zoom level
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 9, 0],
        }}
      />

      {/* Individual pins for higher zooms */}
      <Layer
        id={`${sourceId}-pins`}
        type="circle"
        source={sourceId}
        minzoom={8}
        paint={{
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 3, 16, 8],
          "circle-color": colors.color,
          "circle-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7,
            0,
            8,
            [
              "case",
              [
                "any",
                ["!", ["get", MARKER_MATCHED_KEY]],
                ["get", MARKER_CLIENT_EXCLUDED_KEY],
              ],
              0.5,
              1,
            ],
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        }}
      />

      {/* Labels for pins at higher zooms */}
      <Layer
        id={`${sourceId}-labels`}
        type="symbol"
        source={sourceId}
        minzoom={12}
        layout={{
          "text-field": ["get", MARKER_NAME_KEY],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
          "text-transform": "uppercase",
          "text-offset": [0, 1],
          "text-anchor": "top",
        }}
        paint={{
          "text-color": colors.color,
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        }}
      />
    </Source>
  );
}
