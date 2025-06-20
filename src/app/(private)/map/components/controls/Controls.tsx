import { gql, useMutation } from "@apollo/client";
import { useContext, useState } from "react";
import {
  UpsertMapViewMutation,
  UpsertMapViewMutationVariables,
} from "@/__generated__/types";
import { MapContext } from "@/app/(private)/map/context/MapContext";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import ChoroplethControl from "./ChoroplethControl";
import MarkersControl from "./MarkersControl";
import MembersControl from "./MembersControl";
import TurfControl from "./TurfControl";

export default function Controls() {
  const { mapConfig, viewId, setViewId } = useContext(MapContext);
  const { organisationId } = useContext(OrganisationsContext);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [upsertMapConfig] = useMutation<
    UpsertMapViewMutation,
    UpsertMapViewMutationVariables
  >(gql`
    mutation UpsertMapView(
      $id: String
      $config: MapConfigInput!
      $organisationId: String!
    ) {
      upsertMapView(id: $id, config: $config, organisationId: $organisationId) {
        code
        result
      }
    }
  `);

  const saveMapConfig = async () => {
    // Should never happen, button is also hidden in this case
    if (!organisationId) {
      return;
    }

    setLoading(true);
    setSaveError("");
    try {
      const result = await upsertMapConfig({
        variables: { id: viewId, config: mapConfig, organisationId },
      });
      if (!result.data?.upsertMapView?.result) {
        throw new Error(String(result.errors || "Unknown error"));
      }
      setViewId(result.data.upsertMapView.result);
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
      {organisationId && (
        <div className="flex flex-col gap-4">
          <Button
            className="cursor-pointer"
            type="button"
            onClick={() => saveMapConfig()}
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
