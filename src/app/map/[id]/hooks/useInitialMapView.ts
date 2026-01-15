import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { createNewViewConfig } from "@/app/map/[id]/context/MapContext";
import { useTRPC } from "@/services/trpc/react";
import { getNewLastPosition } from "../utils";
import { useMapId } from "./useMapCore";
import { useMapQuery } from "./useMapQuery";
import { useViewIdAtom } from "./useMapViews";

/**
 * Hook to initialize the map view.
 * Creates a default view if none exist and ensures a view is selected.
 */
export function useInitialMapViewEffect() {
  const mapId = useMapId();
  const [viewId, setViewId] = useViewIdAtom();

  /* Server Data */
  const mapQuery = useMapQuery(mapId);
  const { data: mapData } = mapQuery;

  const viewsInitialized = useRef(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate: createDefaultViewMutate } = useMutation(
    trpc.map.updateViews.mutationOptions(),
  );

  /* Views initialization: create view if none exist and ensure a view is selected */
  useEffect(() => {
    // Only initialize views once when data first loads (otherwise the selected view can change)
    if (viewsInitialized.current) return;
    if (!mapData?.views) return;
    if (!mapId) return;

    viewsInitialized.current = true;

    if (mapData?.views && mapData.views.length > 0) {
      const nextView =
        mapData.views.find((v) => v.id === viewId) || mapData.views[0];
      setViewId(nextView.id);
    } else {
      const newView = {
        id: uuidv4(),
        name: "Default View",
        config: createNewViewConfig(),
        dataSourceViews: [],
        inspectorConfig: [],
        mapId: mapId,
        position: getNewLastPosition(mapData.views),
        createdAt: new Date(),
      };
      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return { ...old, views: [...old.views, newView] };
      });
      setViewId(newView.id);
      // Save the default view to the server
      createDefaultViewMutate({ mapId, views: [newView] });
    }
  }, [
    viewId,
    mapData?.views,
    mapId,
    queryClient,
    trpc.map.byId,
    createDefaultViewMutate,
    setViewId,
  ]);
}
