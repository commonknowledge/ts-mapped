"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMapId } from "@/app/map/[id]/hooks/useMapCore";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useTRPC } from "@/services/trpc/react";
import {
  useHostAvailable,
  usePublicMapValue,
  usePublishedPublicMapValue,
  useSetPublicMap,
  useUpdatePublicMap,
} from "./usePublicMap";
import { extractDraft } from "./usePublicMapQuery";

function getSubdomain(host: string | undefined) {
  if (!host) return "";
  return host.split(".")[0];
}

/**
 * Shared hook that owns the publish / discard mutations and exposes
 * handlers + derived state for both the navbar controls and the sidebar.
 */
export function usePublishActions() {
  const publicMap = usePublicMapValue();
  const publishedPublicMap = usePublishedPublicMapValue();
  const updatePublicMap = useUpdatePublicMap();
  const setPublicMap = useSetPublicMap();
  const hostAvailable = useHostAvailable();
  const mapId = useMapId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { organisationId } = useOrganisations();

  const isPublishedOnServer = publishedPublicMap?.published === true;

  // Apply-draft mutation (promotes draft fields to the live record)
  const { mutate: applyDraft, isPending: isApplyingDraft } = useMutation(
    trpc.publicMap.applyDraft.mutationOptions({
      onSuccess: (res) => {
        // Server returns the new authoritative state — replace the whole cache entry
        setPublicMap({ ...res, draft: null });
        queryClient.invalidateQueries({
          queryKey: trpc.publicMap.list.queryKey({
            organisationId: organisationId || "",
          }),
        });
        toast.success(res.published ? "Map published!" : "Map unpublished");
      },
      onError: (e) => {
        console.error("Failed to apply draft", e);
        if (publicMap && !isPublishedOnServer) {
          updatePublicMap({ published: false });
        }
        toast.error(e.message || "Failed to apply draft.");
      },
    }),
  );

  // Discard draft mutation
  const { mutate: discard, isPending: isDiscarding } = useMutation(
    trpc.publicMap.discardDraft.mutationOptions({
      onSuccess: (res) => {
        // Server returns the reverted state — replace the whole cache entry
        setPublicMap({ ...res, draft: null });
        toast.success("Changes reverted.");
      },
      onError: (e) => {
        console.error("Failed to discard draft", e);
        toast.error("Failed to revert changes.");
      },
    }),
  );

  const loading = isApplyingDraft || isDiscarding;

  const handleSwitchChange = (checked: boolean) => {
    if (!publicMap || !mapId) return;

    if (checked) {
      if (hostAvailable === false) {
        toast.error("Subdomain is taken — choose another before publishing.");
        return;
      }
      if (!getSubdomain(publicMap.host ?? "")) {
        toast.error("Enter a subdomain before publishing.");
        return;
      }
      const draft = extractDraft({ ...publicMap, published: true });
      applyDraft({
        mapId,
        viewId: publicMap.viewId,
        publicMapId: publicMap.id,
        draft,
      });
      updatePublicMap({ published: true });
    } else {
      const draft = extractDraft({ ...publicMap, published: false });
      applyDraft({
        mapId,
        viewId: publicMap.viewId,
        publicMapId: publicMap.id,
        draft,
      });
      updatePublicMap({ published: false });
    }
  };

  const handleApplyDraft = () => {
    if (!publicMap || !mapId) return;
    if (hostAvailable === false) {
      toast.error("Subdomain is taken — choose another before publishing.");
      return;
    }
    applyDraft({
      mapId,
      viewId: publicMap.viewId,
      publicMapId: publicMap.id,
      draft: extractDraft(publicMap),
    });
  };

  const handleRevert = () => {
    if (!publicMap || !mapId || !publishedPublicMap) return;
    discard({ mapId, viewId: publicMap.viewId });
  };

  const publishedHost = isPublishedOnServer ? publishedPublicMap.host : "";

  return {
    loading,
    isApplyingDraft,
    isDiscarding,
    isPublishedOnServer,
    publishedHost,
    handleSwitchChange,
    handleApplyDraft,
    handleRevert,
  };
}
