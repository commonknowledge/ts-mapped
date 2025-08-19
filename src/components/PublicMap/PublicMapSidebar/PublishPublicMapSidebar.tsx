"use client";

import { gql, useMutation } from "@apollo/client";
import { PanelLeft } from "lucide-react";
import { FormEvent, useContext, useState } from "react";
import {
  UpsertPublicMapMutation,
  UpsertPublicMapMutationVariables,
} from "@/__generated__/types";
import DataListRow from "@/components/DataListRow";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Switch } from "@/shadcn/ui/switch";
import { cn } from "@/shadcn/utils";

export default function PublishPublicMapSidebar() {
  const { publicMap, updatePublicMap } = useContext(PublicMapContext);
  const [hideSidebar, setHideSidebar] = useState(false);
  const [error, setError] = useState("");
  const [publishedHost, setPublishedHost] = useState(
    publicMap?.published ? publicMap.host : ""
  );

  const [upsertPublicMap, { loading }] = useMutation<
    UpsertPublicMapMutation,
    UpsertPublicMapMutationVariables
  >(gql`
    mutation UpsertPublicMap(
      $viewId: String!
      $host: String!
      $name: String!
      $description: String!
      $descriptionLink: String!
      $published: Boolean!
      $dataSourceConfigs: [PublicMapDataSourceConfigInput!]!
    ) {
      upsertPublicMap(
        viewId: $viewId
        host: $host
        name: $name
        description: $description
        descriptionLink: $descriptionLink
        published: $published
        dataSourceConfigs: $dataSourceConfigs
      ) {
        code
        result {
          host
          published
        }
      }
    }
  `);

  // Should never happen
  if (!publicMap) {
    return;
  }

  const onSubmitForm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      const result = await upsertPublicMap({
        variables: publicMap,
      });
      if (result.data?.upsertPublicMap?.result) {
        setPublishedHost(
          result.data.upsertPublicMap.result.published
            ? result.data.upsertPublicMap.result.host
            : ""
        );
      }
      if (result.data?.upsertPublicMap?.code === 409) {
        setError("A public map already exists for this subdomain.");
      }
    } catch (e) {
      console.error("Failed to upsert public map", e);
      setError("Unknown error.");
    }
  };

  return (
    <div
      className={cn(
        "absolute top-0 right-0 z-10 bg-white flex",
        hideSidebar ? "h-auto" : "h-full"
      )}
    >
      <div className="flex flex-col h-full w-[360px]">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-neutral-200 pr-4 py-4 pl-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHideSidebar(!hideSidebar)}
            >
              <PanelLeft className="w-4 h-4" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <h1 className="text-xl font-semibold">Publish Map</h1>
          </div>
        </div>
        {!hideSidebar && (
          <div className="px-4 py-2 flex flex-col gap-4">
            <span>Make this view accessible to the public. </span>
            <span className="font-bold text-red-500">
              Ensure no private data is used in this map, as it will become
              public!{" "}
            </span>
            {publishedHost && (
              <span className="font-bold">
                This view is published at{" "}
                <a href={getPublicMapUrl(publishedHost)} target="_blank">
                  {getPublicMapUrl(publishedHost)}
                </a>
              </span>
            )}
            <form
              className="flex flex-col gap-4 relative"
              onSubmit={onSubmitForm}
            >
              <DataListRow label="Subdomain">
                <Input
                  type="text"
                  placeholder="my-map"
                  value={getSubdomain(publicMap.host)}
                  onChange={(e) =>
                    updatePublicMap({ host: makeHost(e.target.value) })
                  }
                  required
                  pattern="^[a-z]+(-[a-z]+)*$"
                />
              </DataListRow>
              <DataListRow label="Published">
                <Switch
                  checked={publicMap.published}
                  onCheckedChange={(published) =>
                    updatePublicMap({ published })
                  }
                />
              </DataListRow>
              <DataListRow label="Name">
                <Input
                  type="text"
                  placeholder="My Map"
                  value={publicMap.name}
                  onChange={(e) => updatePublicMap({ name: e.target.value })}
                  required
                />
              </DataListRow>
              <DataListRow label="Description">
                <Input
                  type="text"
                  placeholder="A public map made by me."
                  value={publicMap.description}
                  onChange={(e) =>
                    updatePublicMap({ description: e.target.value })
                  }
                />
              </DataListRow>
              <DataListRow label="Project Link">
                <Input
                  type="text"
                  placeholder="https://example.com"
                  value={publicMap.descriptionLink}
                  onChange={(e) =>
                    updatePublicMap({ descriptionLink: e.target.value })
                  }
                />
              </DataListRow>
              <Button disabled={loading} type="submit">
                Update
              </Button>
              {error && <span className="text-sm text-red-500">{error}</span>}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const getBaseUrl = () =>
  new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001");

const makeHost = (subdomain: string) => {
  const baseHost = getBaseUrl().host;
  return `${subdomain}.${baseHost}`;
};

const getPublicMapUrl = (host: string) => {
  const proto = getBaseUrl().protocol;
  return `${proto}//${host}`;
};

const getSubdomain = (host: string | undefined) => {
  if (!host) {
    return "";
  }
  return host.split(".")[0];
};
