"use client";

import { useQueries } from "@tanstack/react-query";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import {
  MapContext,
  getDataSourceIds,
} from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useFolders, usePlacedMarkers, useTurfs } from "../hooks";
import { useMapQuery } from "../hooks/useMapQuery";
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
  const featuresInitialized = useRef(false);
  const { mapConfig } = useMapConfig();
  const { view } = useMapViews();

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
  const setMarkerVisibilityState = (markerId: string, isVisible: boolean) => {
    setMarkerVisibility((prev) => ({ ...prev, [markerId]: isVisible }));
  };
  const getMarkerVisibility = (markerId: string) => {
    return markerVisibility[markerId] ?? true; // Default to visible
  };

  const [turfVisibility, setTurfVisibility] = useState<Record<string, boolean>>(
    {},
  );
  const setTurfVisibilityState = (turfId: string, isVisible: boolean) => {
    setTurfVisibility((prev) => ({ ...prev, [turfId]: isVisible }));
  };
  const getTurfVisibility = useCallback(
    (turfId: string): boolean => {
      return turfVisibility[turfId] ?? true;
    },
    [turfVisibility],
  );

  const [dataSourceVisibility, setDataSourceVisibility] = useState<
    Record<string, boolean>
  >({});
  const setDataSourceVisibilityState = (
    dataSourceId: string,
    isVisible: boolean,
  ) => {
    setDataSourceVisibility((prev) => ({ ...prev, [dataSourceId]: isVisible }));
  };
  const getDataSourceVisibility = (dataSourceId: string) => {
    return dataSourceVisibility[dataSourceId] ?? true; // Default to visible
  };

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

  const visibleTurfs = useMemo(() => {
    return turfs.filter((turf) => {
      return getTurfVisibility(turf.id);
    });
  }, [turfs, getTurfVisibility]);

  useEffect(() => {
    // Only initialize the features when the map first loads
    // TODO: use the TRPC query cache for this state
    if (featuresInitialized.current || !map) {
      return;
    }
    featuresInitialized.current = true;

    if (map.folders) {
      setFolders(map.folders);
    }
    if (map.placedMarkers) {
      setPlacedMarkers(map.placedMarkers);
    }
    if (map.turfs) {
      setTurfs(map.turfs);
    }
  }, [map, setFolders, setPlacedMarkers, setTurfs]);

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
      insertPlacedMarker({
        id: uuidv4(),
        label: `Dropped Pin (${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)})`,
        notes: "",
        point: e.lngLat,
        folderId: null,
      });

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
