import { useContext } from "react";
import { Layer, Popup, Source } from "react-map-gl/mapbox";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { mapColours } from "@/app/(private)/map/[id]/styles";
import { MARKER_NAME_KEY } from "@/constants";

export default function Markers() {
  const { markersQuery, viewConfig, selectedMarker, setSelectedMarker } =
    useContext(MapContext);
  // Always return a layer - this ensures it is always placed on top
  const safeMarkers = markersQuery?.data?.dataSource?.markers || {
    type: "FeatureCollection",
    features: [],
  };

  return (
    <>
      {viewConfig.showMembers && (
        <Source
          id="markers"
          key="markers"
          type="geojson"
          data={safeMarkers}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer
            id="markers-circles"
            type="circle"
            source="markers"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": mapColours.member.color,
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["get", "point_count"],
                1,
                50,
                1000,
                100,
              ],
              "circle-opacity": 0.6,
            }}
          />
          <Layer
            id="markers-counts"
            type="symbol"
            source="markers"
            filter={["has", "point_count"]}
            layout={{
              "text-field": ["get", "point_count_abbreviated"],
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 16,
            }}
            paint={{
              "text-color": "#000000",
              "text-halo-color": "#ffffff",
              "text-halo-width": 1,
            }}
          />
          <Layer
            id="markers-pins"
            type="circle"
            source="markers"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                4, // Smaller radius at low zoom levels
                10,
                6, // Larger radius at higher zoom levels
              ],
              "circle-color": "#678DE3", // You can change this color
              "circle-opacity": 1,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#ffffff",
            }}
          />
          <Layer
            id="markers-labels"
            type="symbol"
            source="markers"
            filter={["!", ["has", "point_count"]]}
            minzoom={10}
            layout={{
              "text-field": ["get", MARKER_NAME_KEY],
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 12,
              "text-transform": "uppercase",
              "text-offset": [0, -1.25],
            }}
            paint={{
              "text-color": "#678DE3",
              "text-halo-color": "#ffffff",
              "text-halo-width": 1,
            }}
          />
          {/* This layer here for styling purposes as it adds a glow effect to the markers */}
          <Layer
            id="markers-heatmap"
            type="heatmap"
            source="markers"
            paint={{
              // Increase weight based on point count
              "heatmap-weight": [
                "interpolate",
                ["linear"],
                ["get", "point_count"],
                0,
                0,
                10,
                1,
              ],
              // Increase intensity as zoom level increases
              "heatmap-intensity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                1,
                15,
                3,
              ],
              // Assign colors to heatmap based on density
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0,
                "rgba(103, 141, 227, 0)",
                0.2,
                "rgba(103, 141, 227, 0.2)",
                0.4,
                "rgba(103, 141, 227, 0.4)",
                0.6,
                "rgba(103, 141, 227, 0.6)",
                0.8,
                "rgba(103, 141, 227, 0.8)",
                1,
                "rgba(103, 141, 227, 1)",
              ],
              // Adjust radius based on zoom level
              "heatmap-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                2,
                10,
                20,
              ],
              // Opacity based on zoom level
              "heatmap-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                7,
                1,
                15,
                0,
              ],
            }}
          />
        </Source>
      )}
      {selectedMarker && (
        <Popup
          anchor="bottom"
          latitude={selectedMarker.coordinates[1]}
          longitude={selectedMarker.coordinates[0]}
          closeOnClick={false}
          onClose={() => setSelectedMarker(null)}
        >
          <div>
            {Object.keys(selectedMarker.properties).map((key) => (
              <div key={key}>
                {key}: {String(selectedMarker.properties[key])}
              </div>
            ))}
          </div>
        </Popup>
      )}
    </>
  );
}
