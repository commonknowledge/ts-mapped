"use client";

import { gql, useMutation } from "@apollo/client";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataSourcesContext } from "@/app/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import Navbar from "@/components/layout/Navbar";
import { Link } from "@/components/Link";
import { DataSourceTypeLabels } from "@/labels";
import { uploadFile } from "@/services/uploads";
import { Button } from "@/shadcn/ui/button";
import MapViews from "./MapViews";
import PrivateMapNavbarControls from "./PrivateMapNavbarControls";
import type {
  SaveMapViewsToCrmMutation,
  SaveMapViewsToCrmMutationVariables,
  UpdateMapImageMutation,
  UpdateMapImageMutationVariables,
} from "@/__generated__/types";
import type { DataSourceType } from "@/server/models/DataSource";

/**
 * TODO: Move complex logic into MapProvider
 */
export default function PrivateMapNavbar() {
  const router = useRouter();
  const { mapName, setMapName, mapId, saveMapConfig, mapRef, view, mapConfig } =
    useContext(MapContext);
  const { getDataSourceById } = useContext(DataSourcesContext);

  const showPublishButton = useFeatureFlagEnabled("public-maps");

  const [isEditingName, setIsEditingName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [crmSaveLoading, setCRMSaveLoading] = useState(false);

  const syncLabel = useMemo(() => {
    const dataSourceIds = mapConfig.getDataSourceIds() ?? [];
    if (dataSourceIds.length === 0) return "";

    if (dataSourceIds.length === 1) {
      const CRMType = getDataSourceById(dataSourceIds[0])?.config?.type as
        | DataSourceType
        | undefined;
      return CRMType
        ? `Sync with ${DataSourceTypeLabels[CRMType]}`
        : "Sync with CRMs";
    }

    return "Sync with CRMs";
  }, [getDataSourceById, mapConfig]);

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
    await updateMapImage({
      variables: { id: mapId, mapInput: { imageUrl } },
    });
  }, [mapId, mapRef, updateMapImage]);

  useEffect(() => {
    if (!mapId) return;

    const checkMapReady = () => {
      const map = mapRef?.current;

      if (!map) {
        return false;
      } else {
        return true;
      }
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
              {syncLabel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onClickCRMSave()}
                  disabled={crmSaveLoading}
                >
                  {syncLabel}
                </Button>
              )}

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
