"use client";

import { useMutation } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { useContext, useState } from "react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import { Link } from "@/components/Link";
import MapViews from "@/components/Map/components/MapViews";
import { MapContext } from "@/components/Map/context/MapContext";
import { useTRPC } from "@/services/trpc/react";
import { uploadFile } from "@/services/uploads";
import { Button } from "@/shadcn/ui/button";
import PrivateMapNavbarControls from "./PrivateMapNavbarControls";

/**
 * TODO: Move complex logic into MapProvider
 */
export default function PrivateMapNavbar() {
  const router = useRouter();
  const { mapName, setMapName, mapId, saveMapConfig, mapRef, view } =
    useContext(MapContext);
  const showPublishButton = useFeatureFlagEnabled("public-maps");
  const [isEditingName, setIsEditingName] = useState(false);
  const [loading, setLoading] = useState(false);

  const trpc = useTRPC();

  const { mutate, isPending } = useMutation(
    trpc.map.update.mutationOptions({
      onSuccess: (data) => {
        setMapName(data.name);
        setIsEditingName(false);
      },
      onError: (error) => {
        toast.error("Failed to update map");
        console.error("Failed to update map name", error);
      },
    }),
  );

  const { mutate: saveToCrm, isPending: crmSaveLoading } = useMutation(
    trpc.mapView.saveToCrm.mutationOptions({
      onSuccess: () => {
        toast.success("Map views saved to CRM");
      },
      onError: () => {
        toast.error("Failed to save map views to CRM");
      },
    }),
  );

  const onClickSave = async () => {
    // Should never happen, button is also hidden in this case
    if (!mapId) return;
    setLoading(true);
    try {
      await saveMapConfig();
      await regenerateMapImage();
      toast.success("Map view saved!");
    } catch (e) {
      console.error("UpdateMapConfig failed", e);
      toast.error("Could not save this map view, please try again.");
    }
    setLoading(false);
  };

  const onClickPublish = async () => {
    // Should never happen, button is also hidden in this case
    if (!mapId || !view) return;
    // Need to save the map + view before trying to publish it
    setLoading(true);
    try {
      await saveMapConfig();
      router.push(`/map/${mapId}/view/${view.id}/publish`);
    } catch (e) {
      console.error("UpdateMapConfig failed", e);
      toast.error("Could not publish this map view, please try again.");
      setLoading(false);
    }
  };

  const onClickCRMSave = async () => {
    // Should never happen, button is also hidden in this case
    if (!mapId) return;
    saveToCrm({ mapId });
  };

  const regenerateMapImage = async () => {
    if (!mapId) return;

    const imageDataUrl = await new Promise<string | undefined>(function (
      resolve,
    ) {
      mapRef?.current?.once("render", function () {
        resolve(mapRef.current?.getCanvas().toDataURL());
      });
      /* trigger render */
      mapRef?.current?.triggerRepaint();
    });

    if (!imageDataUrl) return;

    const response = await fetch(imageDataUrl);
    const imageBlob = await response.blob();
    const imageFile = new File([imageBlob], `map_${mapId}.png`, {
      type: "image/png",
    });
    const imageUrl = await uploadFile(imageFile);
    mutate({ mapId, imageUrl });
  };

  const onSubmitSaveName = async () => {
    if (!mapId || !mapName) return;
    mutate({ mapId, name: mapName });
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
                    value={mapName || ""}
                    className="px-3 py-1 border border-neutral-300 rounded text-sm"
                    onChange={(e) => setMapName(e.target.value)}
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
                    onClick={() => setIsEditingName(false)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <p className="truncate max-w-[300px]">
                  {mapName || "Loading..."}
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
              <Button
                type="button"
                onClick={() => onClickSave()}
                disabled={loading}
              >
                Save view
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onClickCRMSave()}
                disabled={crmSaveLoading}
              >
                Save to CRM
              </Button>
              {showPublishButton && view && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onClickPublish()}
                  disabled={loading}
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
