"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useMapQuery } from "@/app/map/[id]/hooks/useMapQuery";
import Navbar from "@/components/layout/Navbar";
import { Link } from "@/components/Link";
import { useFeatureFlagEnabled } from "@/hooks";
import { useTRPC } from "@/services/trpc/react";
import { uploadFile } from "@/services/uploads";
import { Button } from "@/shadcn/ui/button";
import { useMapViews } from "../hooks/useMapViews";
import MapViews from "./MapViews";
import PrivateMapNavbarControls from "./PrivateMapNavbarControls";

/**
 * TODO: Move complex logic into MapProvider
 */
export default function PrivateMapNavbar() {
  const router = useRouter();
  const { mapId, mapRef, dirtyViewIds, configDirty } = useContext(MapContext);
  const { data: map } = useMapQuery(mapId);
  const { view } = useMapViews();

  const showPublishButton = useFeatureFlagEnabled("public-maps");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(map?.name || "");
  const [loading, setLoading] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // keep edited name in sync with cache map name
    setEditedName(map?.name || "");
  }, [map?.name]);

  const { mutate: updateMap, isPending } = useMutation(
    trpc.map.update.mutationOptions({
      onSuccess: () => {
        setIsEditingName(false);
        if (mapId) {
          queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
            if (!old) return old;
            return { ...old, name: editedName };
          });
        }
      },
      onError: (error) => {
        toast.error("Failed to update map");
        console.error("Failed to update map name", error);
      },
    }),
  );

  useLayoutEffect(() => {
    if (!isEditingName) return;
    // input isnt rendered immediately, so we need to wait for it to be ready
    const timeout = setTimeout(() => {
      inputRef.current?.select();
    }, 200);
    return () => clearTimeout(timeout);
  }, [isEditingName]);

  const onClickPublish = async () => {
    if (!mapId || !view) return;
    setLoading(true);
    // Auto-save handles saving map config and views automatically
    // Just navigate to the publish page
    router.push(`/map/${mapId}/view/${view.id}/publish`);
  };

  const regenerateMapImage = useCallback(async () => {
    if (!mapId) return;
    if (!mapRef?.current) return;

    const map = mapRef.current;

    const imageDataUrl = await new Promise<string | undefined>((resolve) => {
      map.once("render", () => {
        resolve(mapRef.current?.getCanvas().toDataURL());
      });
      // trigger render once
      map.triggerRepaint();
    });

    if (!imageDataUrl) return;

    const response = await fetch(imageDataUrl);
    const imageBlob = await response.blob();
    const imageFile = new File([imageBlob], `map_${mapId}.png`, {
      type: "image/png",
    });

    const imageUrl = await uploadFile(imageFile);
    updateMap({ mapId, imageUrl });
  }, [mapId, mapRef, updateMap]);

  useEffect(() => {
    if (!mapId) return;

    const checkMapReady = () => {
      const map = mapRef?.current;
      return Boolean(map);
    };

    let interval: NodeJS.Timeout | number | undefined;

    // if mapRef.current == null, come back in 5s and try again - until mapRef.current != null
    // mapRef as dependency doesn't trigger useEffect when current changes
    // 5s - cause it should be enough time for everything on the map to load (= avoiding incomplete thumbnails)
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        if (checkMapReady()) {
          regenerateMapImage();
          clearInterval(interval);
        }
      }, 5000);
    }, 10000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [mapId, mapRef, regenerateMapImage]);

  const onSubmitSaveName = async () => {
    if (!mapId || !editedName) return;
    updateMap({ mapId, name: editedName });
  };

  return (
    <Navbar>
      <div className="flex justify-between items-center gap-4 w-full">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Link
              href="/dashboard"
              className="text-neutral-500 hover:text-neutral-800"
            >
              Maps
            </Link>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
            <div className="flex items-center gap-1">
              {isEditingName ? (
                <>
                  <input
                    type="text"
                    value={editedName || ""}
                    autoFocus
                    ref={inputRef}
                    className="px-3 py-1 border border-neutral-300 rounded text-sm"
                    onChange={(e) => setEditedName(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={onSubmitSaveName}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      setIsEditingName(false);
                      setEditedName(map ? map.name : "");
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <p className="truncate max-w-[300px]">
                  {map ? map.name : "Loading..."}
                </p>
              )}
            </div>
            <PrivateMapNavbarControls setIsEditingName={setIsEditingName} />
          </div>
          <MapViews />
        </div>
        <div className="flex items-center gap-4">
          {mapId && (
            <div className="flex items-center gap-4">
              {showPublishButton && view && (
                <Button
                  type="button"
                  disabled={loading || dirtyViewIds.length > 0 || configDirty}
                  variant="outline"
                  onClick={onClickPublish}
                >
                  Publish
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Navbar>
  );
}
