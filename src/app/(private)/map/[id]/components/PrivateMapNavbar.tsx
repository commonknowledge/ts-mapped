"use client";

import { gql, useMutation } from "@apollo/client";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { useContext, useState } from "react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import { Link } from "@/components/Link";
import MapViews from "@/components/Map/components/MapViews";
import { MapContext } from "@/components/Map/context/MapContext";
import { uploadFile } from "@/services/uploads";
import { Button } from "@/shadcn/ui/button";
import PrivateMapNavbarControls from "./PrivateMapNavbarControls";
import type {
  SaveMapViewsToCrmMutation,
  SaveMapViewsToCrmMutationVariables,
  UpdateMapImageMutation,
  UpdateMapImageMutationVariables,
} from "@/__generated__/types";

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
  const [crmSaveLoading, setCRMSaveLoading] = useState(false);

  const [updateMapName] = useMutation(gql`
    mutation UpdateMapName($id: String!, $mapInput: MapInput!) {
      updateMap(id: $id, map: $mapInput) {
        code
        result {
          id
          name
        }
      }
    }
  `);

  const [updateMapImage] = useMutation<
    UpdateMapImageMutation,
    UpdateMapImageMutationVariables
  >(gql`
    mutation UpdateMapImage($id: String!, $mapInput: MapInput!) {
      updateMap(id: $id, map: $mapInput) {
        code
        result {
          id
          imageUrl
        }
      }
    }
  `);

  const [saveMapViewsToCRM] = useMutation<
    SaveMapViewsToCrmMutation,
    SaveMapViewsToCrmMutationVariables
  >(gql`
    mutation SaveMapViewsToCRM($id: String!) {
      saveMapViewsToCRM(id: $id) {
        code
      }
    }
  `);

  const onClickSave = async () => {
    // Should never happen, button is also hidden in this case
    if (!mapId) {
      return;
    }

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
    if (!mapId || !view) {
      return;
    }

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
    if (!mapId) {
      return;
    }

    setCRMSaveLoading(true);

    const { data } = await saveMapViewsToCRM({ variables: { id: mapId } });
    if (data?.saveMapViewsToCRM?.code !== 200) {
      toast.error("Could not save to your CRM, please try again.");
    }
    setCRMSaveLoading(false);
  };

  const regenerateMapImage = async () => {
    if (!mapId) {
      return;
    }

    const imageDataUrl = await new Promise<string | undefined>(function (
      resolve,
    ) {
      mapRef?.current?.once("render", function () {
        resolve(mapRef.current?.getCanvas().toDataURL());
      });
      /* trigger render */
      mapRef?.current?.triggerRepaint();
    });

    if (!imageDataUrl) {
      return;
    }

    const response = await fetch(imageDataUrl);
    const imageBlob = await response.blob();
    const imageFile = new File([imageBlob], `map_${mapId}.png`, {
      type: "image/png",
    });
    const imageUrl = await uploadFile(imageFile);
    await updateMapImage({
      variables: { id: mapId, mapInput: { imageUrl } },
    });
  };

  const onSubmitSaveName = async () => {
    const queryResponse = await updateMapName({
      variables: {
        id: mapId,
        mapInput: {
          name: mapName,
        },
      },
    });
    const { data } = queryResponse;
    setIsEditingName(false);
    setMapName(data.updateMap.result.name);
    if (data.updateMap.code !== 200) {
      console.error("Failed to update map name");
    }
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
                    onClick={onSubmitSaveName}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
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
