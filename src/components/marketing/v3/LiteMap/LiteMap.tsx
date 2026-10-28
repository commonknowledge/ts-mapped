"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import Image from "next/image";
import { useMemo, useState } from "react";
import MapGL, { AttributionControl, Layer, Source } from "react-map-gl/mapbox";
import { cn } from "@/shadcn/utils";
import {
  BOUNDARIES,
  COLLECTION_IDS,
  FILL_OPACITY,
  INK_COLOR,
  MAP_STYLE,
  UK_BOUNDS,
  VIEWS,
  type Visualisation,
} from "./constants";
import {
  AREAS,
  AREAS_BY_CODE,
  DEFAULT_SELECTED,
  MARKERS_GEOJSON,
  MARKER_COUNTS,
} from "./data";
import LiteMapInspector from "./LiteMapInspector";
import LiteMapSidebar from "./LiteMapSidebar";
import { addMarkerImages, getMarkerImageId } from "./markerImages";
import { buildFillColor, getFitPadding } from "./utils";
import type { Boundary, CollectionId } from "./types";
import type { FilterSpecification, Map as MapboxMap } from "mapbox-gl";
import type { MapMouseEvent } from "react-map-gl/mapbox";

// Keep the whole UK in view beside the inspector, whatever size the demo is
const fitToUK = (map: MapboxMap) =>
  map.fitBounds(UK_BOUNDS, {
    padding: getFitPadding(map.getContainer().clientWidth),
    animate: false,
  });

export default function LiteMap() {
  const [boundary, setBoundary] = useState<Boundary>("constituencies");
  const [visualisation, setVisualisation] = useState<Visualisation>("winner");
  const [visibleCollections, setVisibleCollections] = useState<
    Record<CollectionId, boolean>
  >(VIEWS[0].collections);
  const [selectedCode, setSelectedCode] = useState<string | null>(
    DEFAULT_SELECTED.constituencies,
  );
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [targetCodes, setTargetCodes] = useState<string[]>([]);
  const [markerImagesReady, setMarkerImagesReady] = useState(false);

  const { layer, kind } = BOUNDARIES[boundary];
  const { sourceId, layerId, featureCodeProperty } = layer;
  const areas = AREAS[boundary];
  const fillLayerId = `lite-${boundary}-fill`;

  const fillColor = useMemo(
    () =>
      buildFillColor({ results: areas, visualisation, featureCodeProperty }),
    [areas, visualisation, featureCodeProperty],
  );

  const matchCode = (code: string | null): FilterSpecification => [
    "==",
    ["get", featureCodeProperty],
    code ?? "",
  ];

  const getFeatureCode = (e: MapMouseEvent) => {
    const code = e.features?.[0]?.properties?.[featureCodeProperty];
    return typeof code === "string" ? code : null;
  };

  // A view is active while the current settings still match it
  const activeView = VIEWS.find(
    (view) =>
      view.visualisation === visualisation &&
      COLLECTION_IDS.every(
        (id) => view.collections[id] === visibleCollections[id],
      ),
  );

  const selected = selectedCode ? AREAS_BY_CODE[selectedCode] : null;
  const hovered = hoveredCode ? AREAS_BY_CODE[hoveredCode] : null;

  return (
    <div className="flex size-full flex-col bg-white text-[11px] text-neutral-900">
      <header className="flex h-9 shrink-0 items-center border-b border-neutral-200">
        <div className="flex w-[18.4%] min-w-[156px] shrink-0 items-center gap-2 px-3">
          <Image src="/logo.svg" alt="" width={16} height={16} />
          <span className="truncate text-neutral-500">
            Maps <span className="mx-1">›</span>
            <span className="text-neutral-900">Sample Map</span>
          </span>
        </div>
        <div
          className="flex items-center gap-1 rounded-md px-1 py-0.5 outline-2 outline-offset-2 outline-transparent transition-[outline-color] group-data-[active=views]/demo:bg-[#91e17e]/20 group-data-[active=views]/demo:outline-[#15213b]"
          role="tablist"
          aria-label="Saved views"
        >
          {VIEWS.map((view) => (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={activeView?.id === view.id}
              onClick={() => {
                setVisualisation(view.visualisation);
                setVisibleCollections(view.collections);
              }}
              className={cn(
                "cursor-pointer rounded px-2 py-1 whitespace-nowrap hover:bg-neutral-100",
                activeView?.id === view.id &&
                  "bg-neutral-100 font-medium shadow-[inset_0_0_0_1px_#e5e5e5]",
              )}
            >
              {view.label}
            </button>
          ))}
        </div>
        <span className="ml-auto px-3 font-mono text-[9px] tracking-widest text-neutral-400 uppercase">
          Live demo
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        <LiteMapSidebar
          boundary={boundary}
          onBoundaryChange={(next) => {
            setBoundary(next);
            setSelectedCode(DEFAULT_SELECTED[next]);
            setHoveredCode(null);
          }}
          visualisation={visualisation}
          onVisualisationChange={setVisualisation}
          visibleCollections={visibleCollections}
          onCollectionVisibilityChange={(id, visible) =>
            setVisibleCollections((current) => ({ ...current, [id]: visible }))
          }
          results={areas}
        />

        <div className="relative min-w-0 flex-1">
          <MapGL
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
            mapStyle={MAP_STYLE}
            initialViewState={{ bounds: UK_BOUNDS }}
            onLoad={(e) => {
              fitToUK(e.target);
              addMarkerImages(e.target);
              setMarkerImagesReady(true);
            }}
            onResize={(e) => fitToUK(e.target)}
            cooperativeGestures
            dragRotate={false}
            attributionControl={false}
            interactiveLayerIds={[fillLayerId]}
            cursor={hoveredCode ? "pointer" : "grab"}
            onMouseMove={(e) => setHoveredCode(getFeatureCode(e))}
            onMouseLeave={() => setHoveredCode(null)}
            onClick={(e) => {
              const code = getFeatureCode(e);
              if (code) {
                setSelectedCode(code);
              }
            }}
            style={{ width: "100%", height: "100%" }}
          >
            {/* Bottom right is covered by the inspector */}
            <AttributionControl compact position="bottom-left" />

            {/* Keyed by boundary so switching swaps the whole source */}
            <Source
              key={boundary}
              id={sourceId}
              type="vector"
              url={`mapbox://${sourceId}`}
              promoteId={featureCodeProperty}
            >
              <Layer
                id={fillLayerId}
                type="fill"
                source-layer={layerId}
                paint={{
                  "fill-color": fillColor,
                  "fill-opacity": FILL_OPACITY,
                }}
              />
              <Layer
                id={`lite-${boundary}-outline`}
                type="line"
                source-layer={layerId}
                paint={{
                  "line-color": "#ffffff",
                  "line-width": boundary === "regions" ? 1 : 0.4,
                }}
              />
              <Layer
                id={`lite-${boundary}-target`}
                type="line"
                source-layer={layerId}
                filter={[
                  "in",
                  ["get", featureCodeProperty],
                  ["literal", targetCodes],
                ]}
                paint={{ "line-color": "#30a46c", "line-width": 2.5 }}
              />
              <Layer
                id={`lite-${boundary}-hover`}
                type="line"
                source-layer={layerId}
                filter={matchCode(hoveredCode)}
                paint={{ "line-color": INK_COLOR, "line-width": 1.5 }}
              />
              <Layer
                id={`lite-${boundary}-selected`}
                type="line"
                source-layer={layerId}
                filter={matchCode(selectedCode)}
                paint={{ "line-color": "#3b82f6", "line-width": 2.5 }}
              />
            </Source>

            {/* Re-keyed with the boundary so they're re-added on top of the new layers */}
            {/* Re-keyed with the boundary so they're re-added on top of the new layers */}
            {markerImagesReady &&
              COLLECTION_IDS.map((id) => (
                <Source
                  key={`${id}-${boundary}`}
                  id={`lite-${id}`}
                  type="geojson"
                  data={MARKERS_GEOJSON[id]}
                >
                  <Layer
                    id={`lite-${id}`}
                    type="symbol"
                    layout={{
                      visibility: visibleCollections[id] ? "visible" : "none",
                      "icon-image": getMarkerImageId(id),
                      "icon-allow-overlap": true,
                      // Only hubs have names, shown once zoomed in
                      "text-field": [
                        "step",
                        ["zoom"],
                        "",
                        5.5,
                        ["coalesce", ["get", "name"], ""],
                      ],
                      "text-size": 11,
                      "text-offset": [0, 1],
                      "text-anchor": "top",
                      "text-optional": true,
                      "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
                    }}
                    paint={{
                      "text-color": INK_COLOR,
                      "text-halo-color": "#ffffff",
                      "text-halo-width": 1.5,
                    }}
                  />
                </Source>
              ))}
          </MapGL>

          {hovered && hovered.code !== selectedCode && (
            <div className="pointer-events-none absolute top-2 left-2 rounded bg-white/95 px-2 py-1 shadow">
              {hovered.name}
            </div>
          )}

          <LiteMapInspector
            result={selected}
            kind={kind}
            markerCounts={COLLECTION_IDS.map((id) => ({
              id,
              count: selected ? (MARKER_COUNTS[id][selected.code] ?? 0) : 0,
            }))}
            isTarget={Boolean(selected && targetCodes.includes(selected.code))}
            onToggleTarget={() => {
              if (!selected) {
                return;
              }
              setTargetCodes((codes) =>
                codes.includes(selected.code)
                  ? codes.filter((code) => code !== selected.code)
                  : [...codes, selected.code],
              );
            }}
            onClose={() => setSelectedCode(null)}
          />
        </div>
      </div>
    </div>
  );
}
