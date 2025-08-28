import { useQuery } from "@tanstack/react-query";
import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { Folder, PlacedMarker, Turf } from "@/__generated__/types";
import { getNewLastPosition } from "@/app/(private)/map/[id]/utils";
import { useTRPC } from "@/lib/trpc";
import { MapContext } from "./context/MapContext";
import { TableContext } from "./context/TableContext";
import {
  useDeleteFolderMutation,
  useDeletePlacedMarkerMutation,
  useDeleteTurfMutation,
  useUpsertFolderMutation,
  useUpsertPlacedMarkerMutation,
  useUpsertTurfMutation,
} from "./data";

export const useFolders = (mapId: string | null) => {
  const [folders, setFolders] = useState<Folder[]>([]);

  const [deleteFolderMutation] = useDeleteFolderMutation();
  const [upsertFolderMutation, { loading }] = useUpsertFolderMutation();

  /* Complex actions */
  const deleteFolder = useCallback(
    (id: string) => {
      if (!mapId) {
        return;
      }

      deleteFolderMutation({
        variables: {
          id,
          mapId,
        },
      });
      const newFolders = folders.filter((m) => m.id !== id);
      setFolders(newFolders);
    },
    [deleteFolderMutation, folders, mapId],
  );

  const insertFolder = useCallback(
    (newFolder: Omit<Folder, "position">) => {
      if (!mapId) {
        return;
      }

      const newPosition = getNewLastPosition(folders);
      const positionedFolder = { ...newFolder, position: newPosition };

      const newFolders = [...folders, positionedFolder];
      setFolders(newFolders);

      upsertFolderMutation({
        variables: {
          ...positionedFolder,
          mapId,
        },
      });
    },
    [folders, mapId, upsertFolderMutation],
  );

  const updateFolder = useCallback(
    (updatedFolder: Folder) => {
      if (!mapId) {
        return;
      }

      upsertFolderMutation({
        variables: {
          ...updatedFolder,
          mapId,
        },
      });

      setFolders(
        folders.map((f) => (f.id === updatedFolder.id ? updatedFolder : f)),
      );
    },
    [folders, mapId, upsertFolderMutation],
  );

  return {
    folders,
    setFolders,
    deleteFolder,
    insertFolder,
    updateFolder,
    loading,
  };
};

export const usePlacedMarkers = (mapId: string | null) => {
  const ref = useRef<PlacedMarker[]>([]);
  const [placedMarkers, _setPlacedMarkers] = useState<PlacedMarker[]>([]);

  // Use a ref to keep track of dirty (unpersisted) markers, for immediate flagging
  const dirty = useRef<Record<string, PlacedMarker | null>>({});

  // Use a combination of ref and state, because Mapbox native components don't
  // update on state changes - ref is needed for them to update the latest state,
  // instead of the initial state.
  const setPlacedMarkers = useCallback(
    (markers: PlacedMarker[]) => {
      ref.current = markers;
      _setPlacedMarkers(markers);
    },
    [_setPlacedMarkers],
  );

  const [deletePlacedMarkerMutation] = useDeletePlacedMarkerMutation();
  const [upsertPlacedMarkerMutation, { loading }] =
    useUpsertPlacedMarkerMutation();

  /* Complex actions */
  const deletePlacedMarker = (id: string) => {
    if (!mapId) {
      return;
    }

    deletePlacedMarkerMutation({
      variables: {
        id,
        mapId,
      },
    });
    const newMarkers = ref.current.filter((m) => m.id !== id);
    setPlacedMarkers(newMarkers);
  };

  const insertPlacedMarker = useCallback(
    (newMarker: Omit<PlacedMarker, "position">) => {
      if (!mapId) {
        return;
      }

      const newPosition = getNewLastPosition(ref.current);
      const positionedMarker = { ...newMarker, position: newPosition };

      const newMarkers = [...ref.current, positionedMarker];
      setPlacedMarkers(newMarkers);

      upsertPlacedMarkerMutation({
        variables: {
          ...positionedMarker,
          mapId,
        },
      });
    },
    [mapId, setPlacedMarkers, upsertPlacedMarkerMutation],
  );

  const updatePlacedMarker = useCallback(
    (placedMarker: PlacedMarker) => {
      if (!mapId) {
        return;
      }

      upsertPlacedMarkerMutation({
        variables: {
          ...placedMarker,
          mapId,
        },
      });

      setPlacedMarkers(
        ref.current.map((m) => (m.id === placedMarker.id ? placedMarker : m)),
      );
    },
    [mapId, setPlacedMarkers, upsertPlacedMarkerMutation],
  );

  /**
   * Two functions, preparePlacedMarkerUpdate and commitPlacedMarkerUpdates
   * to aggregate updates before sending them to the API. Originally
   * added for the drag-and-drop functionality of the marker sidebar.
   */
  const preparePlacedMarkerUpdate = useCallback(
    (placedMarker: PlacedMarker) => {
      setPlacedMarkers(
        ref.current.map((m) => (m.id === placedMarker.id ? placedMarker : m)),
      );
      dirty.current[placedMarker.id] = placedMarker;
    },
    [setPlacedMarkers],
  );

  const commitPlacedMarkerUpdates = useCallback(() => {
    if (!mapId) {
      return;
    }

    for (const placedMarker of Object.values(dirty.current)) {
      if (placedMarker) {
        upsertPlacedMarkerMutation({
          variables: {
            ...placedMarker,
            mapId,
          },
        });
        dirty.current[placedMarker.id] = null;
      }
    }
  }, [mapId, upsertPlacedMarkerMutation]);

  return {
    placedMarkers,
    setPlacedMarkers,
    deletePlacedMarker,
    insertPlacedMarker,
    preparePlacedMarkerUpdate,
    commitPlacedMarkerUpdates,
    updatePlacedMarker,
    loading,
  };
};

export const useTurfs = (mapId: string | null) => {
  const ref = useRef<Turf[]>([]);
  const [turfs, _setTurfs] = useState<Turf[]>([]);

  // Use a combination of ref and state, because Mapbox native components don't
  // update on state changes - ref is needed for them to update the latest state,
  // instead of the initial state.
  const setTurfs = useCallback(
    (turfs: Turf[]) => {
      ref.current = turfs;
      _setTurfs(turfs);
    },
    [_setTurfs],
  );

  const [deleteTurfMutation] = useDeleteTurfMutation();
  const [upsertTurfMutation, { loading }] = useUpsertTurfMutation();

  /* Complex actions */
  const deleteTurf = (id: string) => {
    if (!mapId) {
      return;
    }

    deleteTurfMutation({
      variables: {
        id,
        mapId,
      },
    });
    const newTurfs = ref.current.filter((m) => m.id !== id);
    setTurfs(newTurfs);
  };

  const insertTurf = async (newTurf: Turf) => {
    if (!mapId) {
      return;
    }

    const newTurfs = [...ref.current, newTurf];
    setTurfs(newTurfs);

    const { data } = await upsertTurfMutation({
      variables: {
        label: newTurf.label,
        notes: newTurf.notes,
        polygon: newTurf.polygon,
        createdAt: newTurf.createdAt,
        area: newTurf.area,
        mapId,
      },
    });
    const newId = data?.upsertTurf?.result?.id;
    if (newId) {
      setTurfs(
        newTurfs.map((t) => (t.id === newTurf.id ? { ...t, id: newId } : t)),
      );
    }
  };

  const updateTurf = (updatedTurf: Turf) => {
    if (!mapId) {
      return;
    }

    upsertTurfMutation({
      variables: {
        id: updatedTurf.id,
        label: updatedTurf.label,
        notes: updatedTurf.notes,
        polygon: updatedTurf.polygon,
        createdAt: updatedTurf.createdAt,
        area: updatedTurf.area,
        mapId,
      },
    });

    setTurfs(
      ref.current.map((t) => (t.id === updatedTurf.id ? updatedTurf : t)),
    );
  };

  return {
    turfs,
    setTurfs,
    deleteTurf,
    insertTurf,
    updateTurf,
    loading,
  };
};

export function useDataSources() {
  const trpc = useTRPC();
  const { data: dataSources = [] } = useQuery(
    trpc.dataSource.all.queryOptions(),
  );

  return dataSources;
}

export function useSelectedDataSource(id: string) {
  const dataSources = useDataSources();
  return useMemo(
    () => dataSources.find((ds) => ds.id === id),
    [dataSources, id],
  );
}

export function useTableDataSource() {
  const { selectedDataSourceId: tableDataSourceId } = useContext(TableContext);
  const dataSources = useDataSources();
  return useMemo(
    () => dataSources.find((ds) => ds.id === tableDataSourceId),
    [dataSources, tableDataSourceId],
  );
}

export function useAreaDataSource() {
  const { viewConfig } = useContext(MapContext);
  const dataSources = useDataSources();
  return useMemo(
    () => dataSources.find((ds) => ds.id === viewConfig.areaDataSourceId),
    [dataSources, viewConfig.areaDataSourceId],
  );
}

export function useMembersDataSource() {
  const { mapConfig } = useContext(MapContext);
  const dataSources = useDataSources();
  return useMemo(
    () => dataSources.find((ds) => ds.id === mapConfig.membersDataSourceId),
    [dataSources, mapConfig.membersDataSourceId],
  );
}

export function useMarkerDataSources() {
  const { mapConfig } = useContext(MapContext);
  const dataSources = useDataSources();
  return useMemo(
    () =>
      dataSources.filter((ds) => mapConfig.markerDataSourceIds.includes(ds.id)),
    [dataSources, mapConfig.markerDataSourceIds],
  );
}
