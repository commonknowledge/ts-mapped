import { gql, useMutation } from "@apollo/client";
import { useContext, useState } from "react";
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

export default function Controls() {
  const { organisationId } = useContext(OrganisationsContext);
  const { mapRef, mapId, viewConfig, viewId, setViewId } =
    useContext(MapContext);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

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

      const imageDataUrl = await new Promise<string | undefined>(function (
        resolve,
      ) {
        mapRef?.current?.once("render", function () {
          resolve(mapRef.current?.getCanvas().toDataURL());
        });
        /* trigger render */
        mapRef?.current?.triggerRepaint();
      });

      if (imageDataUrl) {
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
      }
    } catch (e) {
      console.error("UpsertMapView failed", e);
      setSaveError("Could not save this map view, please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-lg gap-4 absolute top-0 left-0 m-3 p-4 z-10 w-[300px]">
      <Tabs defaultValue="Layers" className="w-full">
        <TabsList>
          <TabsTrigger value="Layers">Layers</TabsTrigger>
          <TabsTrigger value="Legend">Legend</TabsTrigger>
        </TabsList>
        <Separator />
        <TabsContent
          key="Layers"
          value="Layers"
          className="flex flex-col gap-4 py-2"
        >
          <MembersControl />
          <Separator />
          <MarkersControl />
          <Separator />
          <TurfControl />
        </TabsContent>
        <TabsContent
          key="Legend"
          value="Legend"
          className="flex flex-col gap-4 py-2"
        >
          <ChoroplethControl />
        </TabsContent>
      </Tabs>
      {mapId && (
        <div className="flex flex-col gap-4">
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
