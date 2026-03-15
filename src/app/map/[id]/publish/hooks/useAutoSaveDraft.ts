"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useMapId } from "@/app/map/[id]/hooks/useMapCore";
import { useTRPC } from "@/services/trpc/react";
import { usePublicMapQuery } from "./usePublicMapQuery";
import type { PublicMapData } from "../atoms/publicMapAtoms";
import type { PublicMapDraft } from "@/server/models/PublicMap";

function extractDraft(publicMap: NonNullable<PublicMapData>): PublicMapDraft {
  return {
    host: publicMap.host,
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
 * Auto-saves draft changes to the server whenever the public map changes
 * in the React Query cache.
 * Uses a debounced approach (1s) to avoid excessive server calls.
 * Only saves when the working copy differs from the published snapshot.
 */
export function useAutoSaveDraftEffect() {
  const { publicMap, publishedPublicMap } = usePublicMapQuery();
  const mapId = useMapId();
  const trpc = useTRPC();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether this is the first render to skip auto-save on mount
  const isInitialRender = useRef(true);

  const { mutate: saveDraft, isPending } = useMutation(
    trpc.publicMap.saveDraft.mutationOptions({
      onError: (e) => {
        console.error("Failed to auto-save draft", e);
      },
    }),
  );

  useEffect(() => {
    // Skip on initial render — we don't want to save when atoms are first initialized
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (!publicMap || !publishedPublicMap || !mapId) {
      return;
    }

    // Check if there are actual changes from the published state
    const currentDraft = extractDraft(publicMap);
    const publishedDraft = extractDraft(publishedPublicMap);
    if (JSON.stringify(currentDraft) === JSON.stringify(publishedDraft)) {
      return;
    }

    // Debounce saves
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      saveDraft({
        mapId,
        viewId: publicMap.viewId,
        publicMapId: publicMap.id,
        draft: currentDraft,
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [publicMap, publishedPublicMap, mapId, saveDraft]);

  return { isSaving: isPending };
}

export { extractDraft };
