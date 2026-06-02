"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useMapId } from "@/app/(private)/map/[id]/hooks/useMapCore";
import { useTRPC } from "@/services/trpc/react";
import { extractDraft, usePublicMapQuery } from "./usePublicMapQuery";
import type { PublicMapDataSourceConfig } from "@/models/PublicMap";

/**
 * Signature of the listing-title/subtitle columns across all data source
 * configs. Marker labels are built from these, so a change means the markers
 * must be re-fetched once the draft is saved.
 */
function listingSignature(configs: PublicMapDataSourceConfig[]): string {
  return JSON.stringify(
    configs.map((c) => ({
      dataSourceId: c.dataSourceId,
      nameColumns: c.nameColumns,
      descriptionColumn: c.descriptionColumn,
    })),
  );
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
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const listed = searchParams.get("listed") === "true" ? true : undefined;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether this is the first render to skip auto-save on mount
  const isInitialRender = useRef(true);
  // Last-saved listing-column signature, used to refetch markers only when the
  // listing title/subtitle columns actually change.
  const lastListingSigRef = useRef<string | null>(null);

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

    // Seed the listing signature once the public map is available (before any
    // edit), so the first listing-column change is detected as a change.
    if (lastListingSigRef.current === null) {
      lastListingSigRef.current = listingSignature(publicMap.dataSourceConfigs);
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
      saveDraft(
        {
          mapId,
          viewId: publicMap.viewId,
          publicMapId: publicMap.id,
          draft: currentDraft,
          listed,
        },
        {
          onSuccess: () => {
            // Markers are labelled server-side from the saved draft. Now that
            // it's persisted, refetch them — but only when the listing columns
            // changed, to avoid re-streaming markers on unrelated edits
            // (name, colours, etc.).
            const sig = listingSignature(currentDraft.dataSourceConfigs);
            if (lastListingSigRef.current !== sig) {
              lastListingSigRef.current = sig;
              queryClient.invalidateQueries({ queryKey: ["markers"] });
            }
          },
        },
      );
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [publicMap, publishedPublicMap, mapId, saveDraft, listed, queryClient]);

  return { isSaving: isPending };
}
