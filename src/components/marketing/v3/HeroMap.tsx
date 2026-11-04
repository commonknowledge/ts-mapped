"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { ChevronDownIcon } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import MapGL, { Layer, Source } from "react-map-gl/mapbox";
import { cn } from "@/shadcn/utils";
import {
  BOUNDARIES,
  COLLECTIONS,
  COLLECTION_IDS,
  INK_COLOR,
  MAP_STYLE,
} from "./LiteMap/constants";
import {
  AREAS,
  AREAS_BY_CODE,
  DEFAULT_SELECTED,
  MARGINALS,
  MARKERS,
  MARKERS_GEOJSON,
  MARKER_COUNTS,
} from "./LiteMap/data";
import LiteMapInspector from "./LiteMap/LiteMapInspector";
import { buildFillColor } from "./LiteMap/utils";
import type { ShowcaseFeatureId } from "./constants";
import type { MapRef } from "react-map-gl/mapbox";

// Great Britain, framed for the tall hero panel
const GB_BOUNDS: [number, number, number, number] = [-6.4, 49.9, 1.8, 58.7];

const { layer } = BOUNDARIES.constituencies;
const FOCUS_CODE = DEFAULT_SELECTED.constituencies;

// The focused constituency's centre: the middle of its members
const focusMembers = MARKERS.members.filter(
  (m) => m.areas.constituencies === FOCUS_CODE,
);
const FOCUS_CENTER: [number, number] = [
  focusMembers.reduce((sum, m) => sum + m.lng, 0) /
    Math.max(focusMembers.length, 1),
  focusMembers.reduce((sum, m) => sum + m.lat, 0) /
    Math.max(focusMembers.length, 1),
];

// "Win": a list of the closest seats, outlined on the map
const LIST_COLOR = "#30a46c";
const LIST_CODES = MARGINALS.map((area) => area.code);

// What each headline shows, layered up like using the app: members, then
// data under them, then one area in the inspector, then a list of targets
const SCENES: Record<
  ShowcaseFeatureId,
  { fill: number; markers: number; targets: boolean; focus: boolean }
> = {
  members: { fill: 0, markers: 1, targets: false, focus: false },
  data: { fill: 0.8, markers: 1, targets: false, focus: false },
  strategise: { fill: 0.8, markers: 0.6, targets: false, focus: true },
  win: { fill: 0.35, markers: 0, targets: true, focus: false },
};

const TRANSITION = { duration: 600, delay: 0 };

// The hero's left panel as a live map: hovering a headline animates its
// feature in, much as the app builds up (markers, areas, the inspector)
export default function HeroMap({
  featureId,
}: {
  featureId: ShowcaseFeatureId | null;
}) {
  const mapRef = useRef<MapRef>(null);
  const scene = SCENES[featureId ?? "members"];
  const fillColor = useMemo(
    () =>
      buildFillColor({
        results: AREAS.constituencies,
        visualisation: "winner",
        featureCodeProperty: layer.featureCodeProperty,
      }),
    [],
  );

  // Fly in to the focused area for Strategise; back out to Britain otherwise
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    if (scene.focus) {
      map.flyTo({
        center: FOCUS_CENTER,
        zoom: 9,
        duration: 1200,
        padding: { top: 0, bottom: 0, left: 0, right: 180 },
      });
    } else {
      map.fitBounds(GB_BOUNDS, { padding: 16, duration: 1000 });
    }
  }, [scene.focus]);

  const focused = FOCUS_CODE ? AREAS_BY_CODE[FOCUS_CODE] : null;

  return (
    <div className="absolute inset-0 font-sans text-[11px] text-neutral-900">
      <MapGL
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        mapStyle={MAP_STYLE}
        initialViewState={{
          bounds: GB_BOUNDS,
          fitBoundsOptions: { padding: 16 },
        }}
        interactive={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <Source
          id={layer.sourceId}
          type="vector"
          url={`mapbox://${layer.sourceId}`}
          promoteId={layer.featureCodeProperty}
        >
          <Layer
            id="hero-fill"
            type="fill"
            source-layer={layer.layerId}
            paint={{
              "fill-color": fillColor,
              "fill-opacity": scene.fill,
              "fill-opacity-transition": TRANSITION,
            }}
          />
          <Layer
            id="hero-outline"
            type="line"
            source-layer={layer.layerId}
            paint={{
              "line-color": "#ffffff",
              "line-width": 0.4,
              "line-opacity": scene.fill > 0 ? 1 : 0,
              "line-opacity-transition": TRANSITION,
            }}
          />
          <Layer
            id="hero-targets"
            type="line"
            source-layer={layer.layerId}
            filter={[
              "in",
              ["get", layer.featureCodeProperty],
              ["literal", LIST_CODES],
            ]}
            paint={{
              "line-color": LIST_COLOR,
              "line-width": 2.5,
              "line-opacity": scene.targets ? 1 : 0,
              "line-opacity-transition": TRANSITION,
            }}
          />
          <Layer
            id="hero-focus"
            type="line"
            source-layer={layer.layerId}
            filter={[
              "==",
              ["get", layer.featureCodeProperty],
              FOCUS_CODE ?? "",
            ]}
            paint={{
              "line-color": "#3b82f6",
              "line-width": 3,
              "line-opacity": scene.focus ? 1 : 0,
              "line-opacity-transition": TRANSITION,
            }}
          />
        </Source>

        {/* Markers grow in: an ink dot ringed in the layer's colour */}
        {COLLECTION_IDS.map((id) => (
          <Source
            key={id}
            id={`hero-${id}`}
            type="geojson"
            data={MARKERS_GEOJSON[id]}
          >
            <Layer
              id={`hero-${id}`}
              type="circle"
              paint={{
                "circle-color": INK_COLOR,
                "circle-stroke-color": COLLECTIONS[id].color,
                "circle-radius":
                  scene.markers > 0 ? (id === "hubs" ? 4 : 2.5) : 0,
                "circle-stroke-width": scene.markers > 0 ? 1.5 : 0,
                "circle-opacity": scene.markers,
                "circle-stroke-opacity": scene.markers,
                "circle-radius-transition": TRANSITION,
                "circle-stroke-width-transition": TRANSITION,
                "circle-opacity-transition": TRANSITION,
                "circle-stroke-opacity-transition": TRANSITION,
              }}
            />
          </Source>
        ))}
      </MapGL>

      {/* Strategise: the inspector slides in for the focused area */}
      <div
        aria-hidden={!scene.focus}
        className={cn(
          // Stops above the description card
          "pointer-events-none absolute inset-x-0 top-0 bottom-[24%] transition-[translate,opacity] duration-500",
          scene.focus ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0",
        )}
      >
        <LiteMapInspector
          result={focused}
          kind={BOUNDARIES.constituencies.kind}
          markerCounts={COLLECTION_IDS.map((id) => ({
            id,
            count: focused ? (MARKER_COUNTS[id][focused.code] ?? 0) : 0,
          }))}
          isTarget={false}
          onToggleTarget={() => undefined}
          onClose={() => undefined}
        />
      </div>

      {/* Win: a list of the closest seats, as in the app's Lists */}
      <div
        aria-hidden={!scene.targets}
        className={cn(
          "pointer-events-none absolute top-3 right-3 w-[min(210px,60%)] rounded-md border border-neutral-200 bg-white p-2 shadow-lg transition-[translate,opacity] duration-500",
          scene.targets
            ? "translate-y-0 opacity-100"
            : "-translate-y-2 opacity-0",
        )}
      >
        <p className="px-1 text-neutral-500">Lists</p>
        <div className="mt-1 flex items-center gap-1.5 rounded bg-neutral-100 px-1.5 py-1">
          <ChevronDownIcon className="size-3 text-neutral-400" />
          <span
            className="size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: LIST_COLOR }}
          />
          <span className="min-w-0 flex-1 truncate text-[12px] font-medium">
            Nearest marginals
          </span>
          <span className="text-neutral-400 tabular-nums">
            {MARGINALS.length}
          </span>
        </div>
        <ul className="mt-1 ml-3 border-l border-neutral-100 pl-1.5">
          {MARGINALS.map((area, index) => (
            <li
              key={area.code}
              className={cn(
                "flex items-center gap-2 px-1.5 py-0.5 text-neutral-700 transition-[translate,opacity] duration-300",
                scene.targets
                  ? "translate-x-0 opacity-100"
                  : "translate-x-2 opacity-0",
              )}
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <span className="min-w-0 flex-1 truncate">{area.name}</span>
              <span className="shrink-0 text-neutral-400 tabular-nums">
                {area.majority.toLocaleString("en-GB")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
