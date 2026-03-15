"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapId } from "@/app/map/[id]/hooks/useMapCore";
import { useViewId } from "@/app/map/[id]/hooks/useMapViews";
import { getDataSourceIds } from "@/app/map/[id]/utils/map";
import { useTRPC } from "@/services/trpc/react";
import { activeDataSourceIdAtom } from "../atoms/publicMapAtoms";
import { createDataSourceConfig } from "../components/DataSourcesSelect";
import type { PublicMapData } from "../atoms/publicMapAtoms";
import type {
  PublicMap,
  PublicMapColumn,
  PublicMapDataSourceConfig,
  PublicMapDraft,
} from "@/server/models/PublicMap";

/**
 * Return the working draft, creating one from the published fields if
 * none exists yet.
 */
function getWorkingDraft(data: NonNullable<PublicMapData>): PublicMapDraft {
  return (
    data.draft ?? {
      host: data.host,
      name: data.name,
      description: data.description,
      descriptionLong: data.descriptionLong,
      descriptionLink: data.descriptionLink,
      imageUrl: data.imageUrl,
      published: data.published,
      dataSourceConfigs: data.dataSourceConfigs,
      colorScheme: data.colorScheme,
    }
  );
}

/**
 * Combine published data with its draft overlay.
 */
function applyDraft(
  data: NonNullable<PublicMapData>,
): NonNullable<PublicMapData> {
  if (!data.draft) return data;
  return { ...data, ...data.draft };
}

/**
 * Shared query key helper so cache reads/writes are consistent.
 */
export function usePublicMapQueryKey() {
  const viewId = useViewId();
  const trpc = useTRPC();
  return trpc.publicMap.get.queryKey({ viewId: viewId ?? "" });
}

/**
 * Reads the public map from the React Query cache.
 *
 * The cache stores the **raw server shape** — published fields at the
 * top level and an optional `draft` overlay.
 *
 * Returns:
 * - `publicMap`          – combined (published + draft applied), for rendering.
 * - `publishedPublicMap` – raw record (draft NOT applied), for diffing / revert.
 * - `isPending`          – whether the query is still loading.
 */
export function usePublicMapQuery() {
  const viewId = useViewId();
  const mapId = useMapId();
  const trpc = useTRPC();

  // Subscribe to the query – this causes re-renders when the cache changes.
  const { data: rawData, isPending } = useQuery(
    trpc.publicMap.get.queryOptions(
      { viewId: viewId ?? "" },
      { enabled: !!viewId },
    ),
  );

  // Stable stub for when no server record exists (new public map)
  const [stubId] = useState(() => uuidv4());
  const stub = useMemo(
    () =>
      viewId && mapId
        ? ({
            id: stubId,
            mapId,
            viewId,
            host: "",
            colorScheme: "red" as const,
            name: "My Public Map",
            description: "",
            descriptionLong: "",
            descriptionLink: "",
            imageUrl: "",
            published: false,
            dataSourceConfigs: [],
            createdAt: new Date(),
            draft: null,
          } as NonNullable<PublicMapData>)
        : null,
    [viewId, mapId, stubId],
  );

  // Only fall back to the stub once the query has settled with no
  // existing record.  While still loading, keep `data` as null so
  // consumers can show a loading state instead of the stub defaults.
  const data = rawData ?? (isPending ? null : stub);

  // Combined version: published fields + draft overlay (for rendering)
  const publicMap = useMemo(() => {
    if (!data) return null;
    return applyDraft(data);
  }, [data]);

  // Raw version: draft NOT applied (for diffing / revert)
  const publishedPublicMap = data ?? null;

  return { publicMap, publishedPublicMap, isPending };
}

// ---------------------------------------------------------------------------
// Optimistic cache updaters
// ---------------------------------------------------------------------------

export function useSetPublicMap() {
  const queryKey = usePublicMapQueryKey();
  const queryClient = useQueryClient();

  return useCallback(
    (
      updater:
        | NonNullable<PublicMapData>
        | ((prev: PublicMapData) => PublicMapData),
    ) => {
      if (typeof updater === "function") {
        queryClient.setQueryData<PublicMapData>(queryKey, (old) =>
          updater(old ?? null),
        );
      } else {
        queryClient.setQueryData<PublicMapData>(queryKey, updater);
      }
    },
    [queryClient, queryKey],
  );
}

/**
 * Partially update the public map's **draft**.
 * Creates a draft from the published fields if none exists yet, so the
 * published top-level fields are never mutated directly.
 */
export function useUpdatePublicMap() {
  const queryKey = usePublicMapQueryKey();
  const queryClient = useQueryClient();

  return useCallback(
    (updates: Partial<PublicMap>) => {
      queryClient.setQueryData<NonNullable<PublicMapData>>(queryKey, (old) => {
        if (!old) return old;
        const draft = getWorkingDraft(old);
        return { ...old, draft: { ...draft, ...updates } };
      });
    },
    [queryClient, queryKey],
  );
}

/**
 * Update a specific data source config in the **draft**.
 */
export function useUpdateDataSourceConfig() {
  const queryKey = usePublicMapQueryKey();
  const queryClient = useQueryClient();

  return useCallback(
    (dataSourceId: string, updates: Partial<PublicMapDataSourceConfig>) => {
      queryClient.setQueryData<NonNullable<PublicMapData>>(queryKey, (old) => {
        if (!old) return old;
        const draft = getWorkingDraft(old);
        return {
          ...old,
          draft: {
            ...draft,
            dataSourceConfigs: draft.dataSourceConfigs.map((dsc) =>
              dsc.dataSourceId === dataSourceId ? { ...dsc, ...updates } : dsc,
            ),
          },
        };
      });
    },
    [queryClient, queryKey],
  );
}

/**
 * Update a specific additional column in the **draft**.
 */
export function useUpdateAdditionalColumn() {
  const queryKey = usePublicMapQueryKey();
  const queryClient = useQueryClient();

  return useCallback(
    (
      dataSourceId: string,
      columnIndex: number,
      updates: Partial<PublicMapColumn>,
    ) => {
      queryClient.setQueryData<NonNullable<PublicMapData>>(queryKey, (old) => {
        if (!old) return old;
        const draft = getWorkingDraft(old);
        return {
          ...old,
          draft: {
            ...draft,
            dataSourceConfigs: draft.dataSourceConfigs.map((dsc) =>
              dsc.dataSourceId === dataSourceId
                ? {
                    ...dsc,
                    additionalColumns: dsc.additionalColumns.map((c, i) =>
                      i === columnIndex ? { ...c, ...updates } : c,
                    ),
                  }
                : dsc,
            ),
          },
        };
      });
    },
    [queryClient, queryKey],
  );
}

// ---------------------------------------------------------------------------
// Auto-populate data source configs for newly created public maps
// ---------------------------------------------------------------------------

export function useAutoPopulateDataSources() {
  const { publicMap } = usePublicMapQuery();
  const { mapConfig } = useMapConfig();
  const { getDataSourceById } = useDataSources();
  const updatePublicMap = useUpdatePublicMap();
  const setActiveDataSourceId = useSetAtom(activeDataSourceIdAtom);

  const hasAutoPopulated = useRef(false);

  useEffect(() => {
    if (hasAutoPopulated.current) return;
    if (!publicMap || !mapConfig) return;
    if (publicMap.dataSourceConfigs.length > 0) return;

    hasAutoPopulated.current = true;

    const dataSources = getDataSourceIds(mapConfig)
      .map(getDataSourceById)
      .filter((ds): ds is NonNullable<typeof ds> => ds != null);

    const dataSourceConfigs = dataSources.map(createDataSourceConfig);

    updatePublicMap({ dataSourceConfigs });
    if (dataSourceConfigs.length) {
      setActiveDataSourceId(dataSourceConfigs[0].dataSourceId);
    }
  }, [
    publicMap,
    mapConfig,
    getDataSourceById,
    updatePublicMap,
    setActiveDataSourceId,
  ]);
}
