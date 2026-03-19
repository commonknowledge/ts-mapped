"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  isPublicMapRouteAtom,
  mapModeAtom,
} from "@/app/map/[id]/atoms/mapStateAtoms";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapId } from "@/app/map/[id]/hooks/useMapCore";
import { useViewId } from "@/app/map/[id]/hooks/useMapViews";
import { useTRPC } from "@/services/trpc/react";
import { getMarkerDataSourceIds } from "@/utils/map";
import { activeDataSourceIdAtom } from "../atoms/publicMapAtoms";
import type { PublicMapData } from "../atoms/publicMapAtoms";
import type { ColumnDef } from "@/server/models/DataSource";
import type {
  PublicMapColumn,
  PublicMapDataSourceConfig,
  PublicMapDraft,
} from "@/server/models/PublicMap";

interface DataSource {
  id: string;
  name: string;
  columnDefs: ColumnDef[];
  columnRoles: { nameColumns?: string[] | null };
}

export function extractDraft(
  publicMap: NonNullable<PublicMapData>,
): PublicMapDraft {
  return {
    host: publicMap.host ?? "",
    name: publicMap.name,
    description: publicMap.description,
    descriptionLong: publicMap.descriptionLong,
    descriptionLink: publicMap.descriptionLink,
    imageUrl: publicMap.imageUrl,
    published: publicMap.published,
    dataSourceConfigs: publicMap.dataSourceConfigs,
    colorScheme: publicMap.colorScheme,
  };
}

/**
 * Return the working draft, creating one from the published fields if
 * none exists yet.
 */
function getWorkingDraft(data: NonNullable<PublicMapData>): PublicMapDraft {
  return data.draft ?? extractDraft(data);
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
  const isPublicMapRoute = useAtomValue(isPublicMapRouteAtom);
  const mapMode = useAtomValue(mapModeAtom);

  // Only fetch when on the public route or in publish mode – avoids an
  // unnecessary tRPC call on every private map page load.
  const needsPublicMap = isPublicMapRoute || mapMode === "public";

  const options = trpc.publicMap.get.queryOptions(
    { viewId: viewId ?? "" },
    { enabled: Boolean(viewId) && needsPublicMap },
  );

  // Wrap queryFn to replace null responses with a stub directly in the
  // cache, so optimistic updaters always see a non-null `old` value.
  const { queryFn } = options;
  const { data: rawData, isPending } = useQuery({
    ...options,
    queryFn: queryFn
      ? async (ctx) => {
          const result = await queryFn(ctx);
          if (result !== null) return result;
          if (!viewId || !mapId) return result;
          return {
            id: uuidv4(),
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
            listed: false,
          };
        }
      : undefined,
  });

  const data = rawData ?? null;

  // Combined version: published fields + draft overlay (for rendering).
  // On the public-facing route, never apply the draft — only show
  // what has actually been published.
  const publicMap = useMemo(() => {
    if (!data) return null;
    return isPublicMapRoute ? data : applyDraft(data);
  }, [data, isPublicMapRoute]);

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
    (updates: Partial<PublicMapDraft>) => {
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

export function useAutoPopulateDataSourcesEffect() {
  const { publicMap } = usePublicMapQuery();
  const { mapConfig } = useMapConfig();
  const { getDataSourceById } = useDataSources();
  const updatePublicMap = useUpdatePublicMap();
  const setActiveDataSourceId = useSetAtom(activeDataSourceIdAtom);

  const needsAutoPopulate = useRef(true);

  useEffect(() => {
    if (!needsAutoPopulate.current) return;
    if (!publicMap || !mapConfig) return;
    if (publicMap.dataSourceConfigs.length > 0) {
      needsAutoPopulate.current = false;
      return;
    }

    const dataSources = getMarkerDataSourceIds(mapConfig)
      .map(getDataSourceById)
      .filter((ds): ds is NonNullable<typeof ds> => ds != null);

    const dataSourceConfigs = dataSources.map(createDataSourceConfig);

    updatePublicMap({ dataSourceConfigs });
    if (dataSourceConfigs.length) {
      setActiveDataSourceId(dataSourceConfigs[0].dataSourceId);
      needsAutoPopulate.current = false;
    }
  }, [
    publicMap,
    mapConfig,
    getDataSourceById,
    updatePublicMap,
    setActiveDataSourceId,
  ]);
}

export const createDataSourceConfig = (
  dataSource: DataSource,
): PublicMapDataSourceConfig => {
  return {
    allowUserEdit: false,
    allowUserSubmit: false,
    dataSourceId: dataSource.id,
    dataSourceLabel: dataSource.name,
    formUrl: "",
    editFormUrl: "",
    nameLabel: "Name",
    nameColumns: dataSource.columnRoles.nameColumns || [],
    descriptionLabel: "",
    descriptionColumn: "",
    additionalColumns: [],
  };
};
