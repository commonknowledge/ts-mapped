"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InfoIcon, PanelLeftIcon } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "@/components/Link";
import { useFeatureFlagEnabled } from "@/hooks";
import { useOrganisations } from "@/hooks/useOrganisations";
import { Feature } from "@/models/Organisation";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import PrivateMapNavbarControls from "../../components/PrivateMapNavbarControls";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useOpenInfoPopup } from "../../hooks/useInfoPopup";
import { useInitialMapViewEffect } from "../../hooks/useInitialMapView";
import { useShowControlsAtom } from "../../hooks/useMapControls";
import { useMapId } from "../../hooks/useMapCore";
import { useMapQuery } from "../../hooks/useMapQuery";
import { useViewId } from "../../hooks/useMapViews";
import { useSyncMapModeToUrlEffect } from "../../hooks/useSyncMapModeToUrl";
import { useSyncViewIdToUrlEffect } from "../../hooks/useSyncViewIdToUrl";
import LightViewTabs from "./LightViewTabs";

const SearchBox = dynamic(
  () =>
    import("../../components/SearchBox").then((mod) => ({
      default: mod.SearchBox,
    })),
  { ssr: false, loading: () => null },
);

export default function LightNavbar() {
  const mapId = useMapId();
  const viewId = useViewId();
  const { data: map } = useMapQuery(mapId);
  const openInfoPopup = useOpenInfoPopup();
  const [showControls, setShowControls] = useShowControlsAtom();
  const { setBoundariesPanelOpen } = useChoropleth();
  const toggleLayers = () => {
    setShowControls(!showControls);
    // The visualisation flyout hangs off the panel, so it closes with it
    if (showControls) {
      setBoundariesPanelOpen(false);
    }
  };
  const { currentOrganisation } = useOrganisations();
  const showPublish = useFeatureFlagEnabled(
    Feature.PublicMaps,
    currentOrganisation?.features,
  );

  // Same effects as the classic MapNavbar
  useInitialMapViewEffect();
  useSyncViewIdToUrlEffect();
  useSyncMapModeToUrlEffect();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(map?.name ?? "");
  useEffect(() => setEditedName(map?.name ?? ""), [map?.name]);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate: updateMap } = useMutation(
    trpc.map.update.mutationOptions({
      onSuccess: (_, variables) => {
        setIsEditingName(false);
        if (mapId) {
          queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) =>
            old ? { ...old, name: variables.name || old.name } : old,
          );
        }
      },
      onError: () => toast.error("Failed to rename map"),
    }),
  );

  const saveName = () => {
    const name = editedName.trim();
    if (mapId && name && name !== map?.name) {
      updateMap({ mapId, name });
    } else {
      setEditedName(map?.name ?? "");
      setIsEditingName(false);
    }
  };

  const viewQuery = viewId ? `?viewId=${viewId}` : "";

  return (
    <nav className="pointer-events-auto relative z-1000 flex h-[var(--navbar-height)] items-center gap-3 border-b border-neutral-200/80 bg-white px-3">
      <Link href="/maps" className="shrink-0" aria-label="All maps">
        <Image src="/logo.svg" alt="Mapped" width={22} height={22} />
      </Link>
      <button
        type="button"
        onClick={toggleLayers}
        aria-pressed={showControls}
        aria-label={showControls ? "Hide layers" : "Show layers"}
        title={showControls ? "Hide layers" : "Show layers"}
        className={cn(
          "flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-neutral-100",
          showControls ? "text-neutral-900" : "text-neutral-400",
        )}
      >
        <PanelLeftIcon className="size-4" />
      </button>

      <div className="flex min-w-0 shrink-0 items-center gap-1 text-sm">
        <Link
          href="/maps"
          className="rounded px-1.5 py-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          Maps
        </Link>
        <span className="text-neutral-300">/</span>
        {isEditingName ? (
          <input
            autoFocus
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") {
                setEditedName(map?.name ?? "");
                setIsEditingName(false);
              }
            }}
            aria-label="Map name"
            className="w-56 rounded border border-neutral-300 px-1.5 py-0.5 font-medium outline-none focus:border-neutral-500"
          />
        ) : (
          <button
            type="button"
            onDoubleClick={() => setIsEditingName(true)}
            title="Double-click to rename"
            className="max-w-[240px] cursor-text truncate rounded px-1.5 py-1 font-medium hover:bg-neutral-100"
          >
            {map?.name ?? "Loading…"}
          </button>
        )}
        {mapId && (
          <PrivateMapNavbarControls
            setIsEditingName={setIsEditingName}
            mapId={mapId}
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-neutral-500"
          onClick={openInfoPopup}
          title="Map info"
          aria-label="Map info"
        >
          <InfoIcon className="size-4" />
        </Button>
      </div>

      <div className="mx-2 h-5 w-px shrink-0 bg-neutral-200" />

      <LightViewTabs />

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <SearchBox />
        {showPublish && mapId && (
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/map/${mapId}?mode=publish${viewId ? `&viewId=${viewId}` : ""}`}
            >
              Publish
            </Link>
          </Button>
        )}
        {mapId && (
          <Link
            href={`/map/${mapId}${viewQuery}`}
            className="rounded px-2 py-1 font-mono text-[10px] tracking-widest text-neutral-400 uppercase hover:bg-neutral-100 hover:text-neutral-700"
            title="Open this map in the current editor"
          >
            Classic editor
          </Link>
        )}
      </div>
    </nav>
  );
}
