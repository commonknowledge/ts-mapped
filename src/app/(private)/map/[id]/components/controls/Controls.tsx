import { gql, useMutation } from "@apollo/client";
import { useContext, useEffect, useState } from "react";
import {
  UpdateMapImageMutation,
  UpdateMapImageMutationVariables,
  UpsertMapViewMutation,
  UpsertMapViewMutationVariables,
} from "@/__generated__/types";
import { LIST_MAPS_QUERY } from "@/app/(private)/dashboard/queries";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { uploadFile } from "@/services/uploads";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import ChoroplethControl from "./ChoroplethControl";
import MarkersControl from "./MarkersControl";
import MembersControl from "./MembersControl";
import TurfControl from "./TurfControl";
import { Columns } from "lucide-react";

export default function Controls() {
  const { organisationId } = useContext(OrganisationsContext);
  const { mapRef, mapId, viewConfig, viewId, setViewId, selectedDataSourceId } =
    useContext(MapContext);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
    const [showControls, setShowControls] = useState(true);
  const [upsertMapView] = useMutation<
    UpsertMapViewMutation,
    UpsertMapViewMutationVariables
  >(gql`
    mutation UpsertMapView(
      $id: String
      $config: MapViewConfigInput!
      $mapId: String!
    ) {
      upsertMapView(id: $id, config: $config, mapId: $mapId) {
        code
        result
      }
    }
  `);

  const [updateMap] = useMutation<
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

  //reset map when ui shifts
  useEffect(() => {
    if (mapRef?.current) {
      mapRef.current.resize();    }
  }, [selectedDataSourceId, showControls]);


  const saveMapView = async () => {
    // Should never happen, button is also hidden in this case
    if (!mapId) {
      return;
    }

    setLoading(true);
    setSaveError("");
    try {
      const result = await upsertMapView({
        variables: { id: viewId, config: viewConfig, mapId },
      });
      if (!result.data?.upsertMapView?.result) {
        throw new Error(String(result.errors || "Unknown error"));
      }
      setViewId(result.data.upsertMapView.result);

      await updateMapImage();
    } catch (e) {
      console.error("UpsertMapView failed", e);
      setSaveError("Could not save this map view, please try again.");
    }
    setLoading(false);
  };

  const updateMapImage = async () => {
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
    await updateMap({
      variables: { id: mapId, mapInput: { imageUrl } },
      refetchQueries: [
        { query: LIST_MAPS_QUERY, variables: { organisationId } },
      ],
    });
  };

  if (!showControls) {
    return (
      <div className="flex absolute top-17 left-3 z-10 bg-white rounded-lg shadow-lg">
        <Button variant="ghost" size="icon" onClick={() => setShowControls(!showControls)}>
          <Columns className="w-4 h-4" />
          <span className="sr-only">Toggle columns</span>
        </Button>
      </div>
    );
  }
  return (
    <div className={`flex flex-col bg-white z-10 w-[300px] h-full border-r border-gray-200 ${showControls ? "block" : "hidden"}`}>
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-1 pr-1">
        <p className="text-sm font-bold">Layers</p>
        <Button variant="ghost" size="icon" onClick={() => setShowControls(!showControls)}>
          <Columns className="w-4 h-4" />
          <span className="sr-only">Toggle columns</span>
        </Button>
      </div>
          <MembersControl />
          <Separator />
          <MarkersControl />
          <Separator />
          <TurfControl />
      
      {mapId && (
        <div className="flex flex-col gap-4 p-4">
          <Button
            type="button"
            onClick={() => saveMapView()}
            disabled={loading}
          >
            Save
          </Button>
          {saveError && <span>{saveError}</span>}
        </div>
      )}
    </div>
  );
}
