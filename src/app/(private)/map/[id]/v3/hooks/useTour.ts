"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as turf from "@turf/turf";
import { useAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { DUMMY_COUNT_COLUMN, TUTORIAL_MAP_NAME } from "@/constants";
import { parseAreaGeography } from "@/models/Area";
import { AreaSetCode } from "@/models/AreaSet";
import { CalculationType } from "@/models/shared";
import { useTRPC } from "@/services/trpc/react";
import { useAreaLists, useInspectedAreaList } from "../../hooks/useAreaLists";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useInspectorActiveSource } from "../../hooks/useInspectorActiveSource";
import { useInspectorState } from "../../hooks/useInspectorState";
import { useLayers } from "../../hooks/useLayers";
import { useMapConfig } from "../../hooks/useMapConfig";
import { useMapId, useMapRef } from "../../hooks/useMapCore";
import { useMapQuery } from "../../hooks/useMapQuery";
import { useMapViews, useViewId } from "../../hooks/useMapViews";
import { useMarkerQueries } from "../../hooks/useMarkerQueries";
import { useMarkerSettings } from "../../hooks/useMarkerSettings";
import { tourStepIndexAtom } from "../atoms";
import { TOUR_OVERVIEW_BOUNDS, TOUR_STEPS } from "../constants";
import { findDensestCluster } from "../utils/tour";
import { useAddMarkersPanel } from "./useAddMarkersPanel";
import type { TourSnapshot } from "../constants";

/** The guided tour: which step it's on, and moving through it */
export function useTour() {
  const [stepIndex, setStepIndex] = useAtom(tourStepIndexAtom);

  const start = useCallback(() => setStepIndex(0), [setStepIndex]);
  const end = useCallback(() => setStepIndex(null), [setStepIndex]);
  const next = useCallback(
    () =>
      setStepIndex((index) =>
        index === null || index + 1 >= TOUR_STEPS.length ? null : index + 1,
      ),
    [setStepIndex],
  );
  const back = useCallback(
    () => setStepIndex((index) => (index ? index - 1 : index)),
    [setStepIndex],
  );

  return { stepIndex, start, next, back, end };
}

/** Whether this is a tutorial map, and whether anything's been added yet */
export function useTutorialMap() {
  const mapId = useMapId();
  const { data: map } = useMapQuery(mapId);
  const { mapConfig } = useMapConfig();
  const { viewConfig } = useMapViews();
  const isTutorialMap =
    Boolean(mapConfig.tutorial) || map?.name === TUTORIAL_MAP_NAME;
  const isEmpty =
    !mapConfig.membersDataSourceId &&
    mapConfig.markerDataSourceIds.length === 0 &&
    !viewConfig.areaDataSourceId;
  return { isLoaded: Boolean(map), isTutorialMap, isEmpty };
}

/** The data source a tour step has you add, if it's on one: the pickers
 *  list it first and grey out the rest */
export function useTourFocusedDataSourceId(kind: "markers" | "areas") {
  const { stepIndex } = useTour();
  const { mapConfig } = useMapConfig();
  const stepId = stepIndex === null ? null : TOUR_STEPS[stepIndex]?.id;
  if (!mapConfig.tutorial) return null;
  if (kind === "markers" && stepId === "addMembers") {
    return mapConfig.tutorial.membersDataSourceId;
  }
  if (kind === "areas" && stepId === "addAreaData") {
    return mapConfig.tutorial.areaDataSourceId;
  }
  return null;
}

/**
 * What a step sets up as it starts: zooming back out to the whole country
 * (you may have zoomed in to click something), or flying to where most
 * members live before you're asked to click an area
 */
/** View names used when the tour splits members and election data */
export const TOUR_MEMBERS_VIEW_NAME = "Members";
export const TOUR_ELECTION_VIEW_NAME = "Election results";

export function useTourStepStart(step: (typeof TOUR_STEPS)[number]) {
  const mapRef = useMapRef();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: markerData } = useMarkerQueries();
  const { mapConfig } = useMapConfig();
  const { view, updateView } = useMapViews();
  const { setBoundariesPanelOpen } = useChoropleth();
  const { setMarkerSettingsDataSourceId } = useMarkerSettings();
  const [, setAddMarkersPanelOpen] = useAddMarkersPanel();

  // The bounds of the constituency with the most of a layer's records
  const findBusiestConstituency = async (
    dataSourceId: string,
  ): Promise<[number, number, number, number] | null> => {
    const stats = await queryClient.fetchQuery(
      trpc.area.stats.queryOptions({
        dataSourceId,
        areaSetCode: AreaSetCode.WMC24,
        calculationType: CalculationType.Sum,
        column: DUMMY_COUNT_COLUMN,
      }),
    );
    const busiest = [...(stats?.primary?.stats ?? [])].sort(
      (a, b) => Number(b.value) - Number(a.value),
    )[0];
    if (!busiest) return null;
    const area = await queryClient.fetchQuery(
      trpc.area.byCode.queryOptions({
        areaSetCode: AreaSetCode.WMC24,
        code: busiest.areaCode,
      }),
    );
    if (!area?.geoJson) return null;
    const [minLng, minLat, maxLng, maxLat] = turf.bbox(
      parseAreaGeography(area.geoJson),
    );
    return [minLng, minLat, maxLng, maxLat];
  };

  useEffect(() => {
    if (step.closePanels) {
      setBoundariesPanelOpen(false);
      setMarkerSettingsDataSourceId(null);
      setAddMarkersPanelOpen(false);
    }
    if (step.zoomOut) {
      mapRef?.current?.fitBounds(TOUR_OVERVIEW_BOUNDS, {
        padding: 40,
        duration: 1500,
      });
    }
    // Keep the members map under a clear name before the election view is added
    if (step.id === "views" && view && view.name !== TOUR_MEMBERS_VIEW_NAME) {
      updateView({ ...view, name: TOUR_MEMBERS_VIEW_NAME });
    }
    if (step.id === "clickArea") {
      const membersId =
        mapConfig.tutorial?.membersDataSourceId ??
        mapConfig.membersDataSourceId;
      // Failing that, the densest cluster of members
      const flyToCluster = () => {
        const members =
          markerData.find((layer) => layer.dataSourceId === membersId)
            ?.markers ?? [];
        const centre = findDensestCluster({
          points: members.map((member) => member.geometry.coordinates),
          radius: 0.03,
        });
        if (centre) {
          mapRef?.current?.flyTo({ center: centre, zoom: 11, duration: 1800 });
        }
      };
      if (!membersId) {
        flyToCluster();
      } else {
        // The constituency with the most members, filling the screen
        findBusiestConstituency(membersId)
          .then((bounds) =>
            bounds
              ? mapRef?.current?.fitBounds(bounds, {
                  padding: 120,
                  duration: 1800,
                })
              : flyToCluster(),
          )
          .catch(flyToCluster);
      }
    }
    // Once, as the step starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);
}

/** Starts the tour when a new, empty tutorial map opens */
export function useAutoStartTour() {
  const { isLoaded, isTutorialMap, isEmpty } = useTutorialMap();
  const { stepIndex, start } = useTour();

  useEffect(() => {
    if (isLoaded && isTutorialMap && isEmpty && stepIndex === null) start();
    // Only as the map loads: ending the tour shouldn't restart it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);
}

/** The parts of the editor the tour watches, to see when a step is done */
export function useTourSnapshot(): TourSnapshot {
  const { mapConfig } = useMapConfig();
  const { viewConfig, views } = useMapViews();
  const viewId = useViewId();
  const { getDataSourceVisibility } = useLayers();
  const { selectedBoundary, selectedRecords } = useInspectorState();
  const [inspectorTab] = useInspectorActiveSource();
  const { lists } = useAreaLists();
  const { list: inspectedList } = useInspectedAreaList();

  const layerIds = [
    ...(mapConfig.membersDataSourceId ? [mapConfig.membersDataSourceId] : []),
    ...mapConfig.markerDataSourceIds,
  ];

  return {
    layerCount: layerIds.length,
    hiddenLayerCount: layerIds.filter((id) => !getDataSourceVisibility(id))
      .length,
    areaDataSourceId: viewConfig.areaDataSourceId ?? "",
    boundariesLocked: Boolean(viewConfig.boundariesLocked),
    areaDataKey: [
      viewConfig.areaDataSourceId,
      viewConfig.areaDataColumn,
      viewConfig.areaDataSecondaryColumn,
    ]
      .filter(Boolean)
      .join("|"),
    areaSetGroupCode: viewConfig.areaSetGroupCode ?? "",
    boundaryCode: selectedBoundary?.code ?? null,
    inspectorTab,
    selectedRecordCount: selectedRecords.length,
    listAreaCount: lists.reduce((sum, list) => sum + list.areas.length, 0),
    inspectedListId: inspectedList?.id ?? null,
    newestListId: lists.at(-1)?.id ?? null,
    viewId,
    viewCount: views.length,
  };
}
