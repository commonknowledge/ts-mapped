"use client";

import { useQueries } from "@tanstack/react-query";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useFolders, usePlacedMarkers, useTurfs } from "../hooks";
import { useMapQuery } from "../hooks/useMapQuery";
import { getDataSourceIds } from "../utils";
import { PublicMapContext } from "../view/[viewIdOrHost]/publish/context/PublicMapContext";
import type { Turf } from "@/server/models/Turf";
import type { PointFeature } from "@/types";
import type { Feature } from "geojson";
import type { ReactNode } from "react";

export default function MarkerAndTurfProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { mapRef, mapId, setPinDropMode } = useContext(MapContext);
  const { mapConfig } = useMapConfig();
  const { view, viewConfig } = useMapViews();

  const { data: map } = useMapQuery(mapId);
  const { publicMap } = useContext(PublicMapContext);
  /* State */

  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);
  const [selectedPlacedMarkerId, setSelectedPlacedMarkerId] = useState<
    string | null
  >(null);
  const [searchMarker, setSearchMarker] = useState<Feature | null>(null);

  // Individual visibility states
  const [markerVisibility, setMarkerVisibility] = useState<
    Record<string, boolean>
  >({});
  const [turfVisibility, setTurfVisibility] = useState<Record<string, boolean>>(
    {},
  );
  const [dataSourceVisibility, setDataSourceVisibility] = useState<
    Record<string, boolean>
  >({});

  const dataSourceIds = useMemo(() => {
    if (!publicMap) {
      return getDataSourceIds(mapConfig);
    }
    // If a public map is being displayed, don't fetch markers that aren't included
    return getDataSourceIds(mapConfig).filter((id) =>
      publicMap.dataSourceConfigs.some((dsc) => dsc.dataSourceId === id),
    );
  }, [mapConfig, publicMap]);

  // Using the `combine` option in this useQueries call makes `markerQueries`
  // only update when the data updates. This prevents infinite loops
  // when `markerQueries` is used in useEffect hooks.
  const markerQueries = useQueries({
    queries: dataSourceIds.map((dataSourceId) => {
      const dsv = view?.dataSourceViews.find(
        (dsv) => dsv.dataSourceId === dataSourceId,
      );
      const filter = JSON.stringify(dsv?.filter || null);
      const search = dsv?.search || "";
      return {
        queryKey: ["markers", dataSourceId, filter, search],
        queryFn: async () => {
          const params = new URLSearchParams();
          params.set("filter", filter);
          params.set("search", search);
          const response = await fetch(
            `/api/data-sources/${dataSourceId}/markers?${params.toString()}`,
          );
          if (!response.ok) {
            throw new Error(`Bad response: ${response.status}`);
          }
          const data = await response.json();
          return data as PointFeature[];
        },
      };
    }),
    combine: (results) => {
      return {
        data: results.map((result, i) => ({
          dataSourceId: dataSourceIds[i],
          markers: result.data || [],
        })),
        isFetching: results.some((result) => result.isFetching),
      };
    },
  });

  /* Persisted map features */
  const {
    folders,
    loading: foldersLoading,
    setFolders,
    deleteFolder,
    insertFolder,
    updateFolder,
  } = useFolders(mapId);

  const {
    placedMarkers,
    setPlacedMarkers,
    deletePlacedMarker,
    insertPlacedMarker,
    preparePlacedMarkerUpdate,
    commitPlacedMarkerUpdates,
    updatePlacedMarker,
    loading: placedMarkersLoading,
  } = usePlacedMarkers(mapId);

  const { deleteTurf, insertTurf, updateTurf, turfs, setTurfs } =
    useTurfs(mapId);

  useEffect(() => {
    if (map?.folders) {
      setFolders(map?.folders);
    }
    if (map?.placedMarkers) {
      setPlacedMarkers(map?.placedMarkers);
      // Initialize visibility for existing markers
      const initialMarkerVisibility: Record<string, boolean> = {};
      map.placedMarkers.forEach((marker) => {
        initialMarkerVisibility[marker.id] = true;
      });
      setMarkerVisibility(initialMarkerVisibility);
    }
    if (map?.turfs) {
      setTurfs(map?.turfs);
      // Initialize visibility for existing turfs
      const initialTurfVisibility: Record<string, boolean> = {};
      map.turfs.forEach((turf) => {
        initialTurfVisibility[turf.id] = true;
      });
      setTurfVisibility(initialTurfVisibility);
    }
  }, [map]);

  const handleAddArea = () => {
    const map = mapRef?.current;
    if (map) {
      // Find the polygon draw button and click it
      const drawButton = document.querySelector(
        ".mapbox-gl-draw_polygon",
      ) as HTMLButtonElement;
      if (drawButton) {
        drawButton.click();
      }
    }
  };

  const handleDropPin = () => {
    const map = mapRef?.current;
    if (!map || !mapId) return;
    setPinDropMode(true);
    map.getCanvas().style.cursor = "crosshair";

    const clickHandler = (e: mapboxgl.MapMouseEvent) => {
      const markerId = uuidv4();
      const markerCount = placedMarkers.length + 1;
      insertPlacedMarker({
        id: markerId,
        label: `Marker ${markerCount}`,
        notes: "",
        address: null,
        point: e.lngLat,
        folderId: null,
      });

      // Set initial visibility to true
      setMarkerVisibility((prev) => ({ ...prev, [markerId]: true }));

      // Reset cursor
      map.getCanvas().style.cursor = "";
      map.off("click", clickHandler);

      setPinDropMode(false);

      // Fly to the new marker
      map.flyTo({
        center: e.lngLat,
        zoom: 14,
      });
    };

    map.once("click", clickHandler);
  };

  // Visibility management functions
  const setMarkerVisibilityState = (markerId: string, isVisible: boolean) => {
    setMarkerVisibility((prev) => ({ ...prev, [markerId]: isVisible }));
  };

  const setTurfVisibilityState = (turfId: string, isVisible: boolean) => {
    setTurfVisibility((prev) => ({ ...prev, [turfId]: isVisible }));
  };

  const getMarkerVisibility = (markerId: string) => {
    return markerVisibility[markerId] ?? true; // Default to visible
  };

  const getTurfVisibility = useCallback(
    (turfId: string): boolean => {
      return turfVisibility[turfId] ?? true;
    },
    [turfVisibility],
  );

  const setDataSourceVisibilityState = (
    dataSourceId: string,
    isVisible: boolean,
  ) => {
    setDataSourceVisibility((prev) => ({ ...prev, [dataSourceId]: isVisible }));
  };

  const getDataSourceVisibility = (dataSourceId: string) => {
    return dataSourceVisibility[dataSourceId] ?? true; // Default to visible
  };

  // Initialize visibility for new turfs when they're added
  useEffect(() => {
    turfs.forEach((turf) => {
      if (!(turf.id in turfVisibility)) {
        setTurfVisibility((prev) => ({ ...prev, [turf.id]: true }));
      }
    });
  }, [turfs]);

  // Initialize visibility for new markers when they're added
  useEffect(() => {
    placedMarkers.forEach((marker) => {
      if (!(marker.id in markerVisibility)) {
        setMarkerVisibility((prev) => ({ ...prev, [marker.id]: true }));
      }
    });
  }, [placedMarkers]);

  // Initialize visibility for data sources when they're added
  useEffect(() => {
    dataSourceIds.forEach((dataSourceId) => {
      if (!(dataSourceId in dataSourceVisibility)) {
        setDataSourceVisibility((prev) => ({ ...prev, [dataSourceId]: true }));
      }
    });
  }, [dataSourceIds]);

  const visibleTurfs = useMemo(() => {
    return turfs.filter((turf) => {
      // Check individual visibility first
      if (!getTurfVisibility(turf.id)) {
        return false;
      }

      // Then check global area visibility
      return viewConfig.showTurf;
    });
  }, [turfs, getTurfVisibility, viewConfig?.showTurf]);

  return (
    <MarkerAndTurfContext
      value={{
        editingTurf,
        setEditingTurf,
        folders,
        foldersLoading,
        deleteFolder,
        insertFolder,
        updateFolder,
        placedMarkers,
        placedMarkersLoading,
        deletePlacedMarker,
        insertPlacedMarker,
        preparePlacedMarkerUpdate,
        commitPlacedMarkerUpdates,
        updatePlacedMarker,
        selectedPlacedMarkerId,
        setSelectedPlacedMarkerId,
        deleteTurf,
        insertTurf,
        turfs,
        visibleTurfs,
        updateTurf,
        markerQueries,
        searchMarker,
        setSearchMarker,
        handleAddArea,
        handleDropPin,
        // Individual visibility management
        markerVisibility,
        turfVisibility,
        dataSourceVisibility,
        setMarkerVisibilityState,
        setTurfVisibilityState,
        setDataSourceVisibilityState,
        getMarkerVisibility,
        getTurfVisibility,
        getDataSourceVisibility,
      }}
    >
      {children}
    </MarkerAndTurfContext>
  );
}
