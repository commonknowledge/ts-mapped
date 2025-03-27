import { Layer, Popup, Source } from "react-map-gl/mapbox";
import { MarkersQuery } from "@/__generated__/types";
import { MarkerData } from "@/types";

export default function Markers({
  markers,
  selectedMarker,
  onCloseSelectedMarker,
}: {
  markers: MarkersQuery["markers"] | undefined;
  selectedMarker: MarkerData | null;
  onCloseSelectedMarker: () => void;
}) {
  // Always return a layer - this ensures it is always placed on top
  const safeMarkers = markers || {
    type: "FeatureCollection",
    features: [],
  };

  return (
    <>
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
            "circle-color": "rgba(255, 0, 0, 0.25)",
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "point_count"],
              1,
              50,
              1000,
              100,
            ],
          }}
        />
        <Layer
          id="markers-counts"
          type="symbol"
          source="markers"
          filter={["has", "point_count"]}
          layout={{
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": 12,
          }}
        />
        <Layer
          id="markers-pins"
          type="symbol"
          source="markers"
          filter={["!", ["has", "point_count"]]}
          layout={{
            "icon-image": "map-pin",
            "icon-anchor": "bottom",
            "icon-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              0.5, // Smaller at low zoom levels
              10,
              1.5, // Full size at higher zoom levels
            ],
          }}
        />
      </Source>
      {selectedMarker ? (
        <Popup
          anchor="top"
          latitude={selectedMarker.coordinates[1]}
          longitude={selectedMarker.coordinates[0]}
          closeOnClick={false}
          onClose={() => onCloseSelectedMarker()}
        >
          <div>
            {Object.keys(selectedMarker.properties).map((key) => (
              <div key={key}>
                {key}: {String(selectedMarker.properties[key])}
              </div>
            ))}
          </div>
        </Popup>
      ) : null}
    </>
  );
}
