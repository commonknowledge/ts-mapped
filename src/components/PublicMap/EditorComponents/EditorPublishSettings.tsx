import { gql, useMutation } from "@apollo/client";
import { FormEvent, useContext, useState } from "react";
import {
  UpsertPublicMapMutation,
  UpsertPublicMapMutationVariables,
} from "@/__generated__/types";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { Switch } from "@/shadcn/ui/switch";

export default function EditorPublishSettings() {
  const { publicMap, updatePublicMap } = useContext(PublicMapContext);
  const [, setError] = useState("");

  const [upsertPublicMap] = useMutation<
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

  const onSubmitForm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      if (!publicMap) return;
      const result = await upsertPublicMap({
        variables: publicMap,
      });
      if (result.data?.upsertPublicMap?.result) {
      }
      if (result.data?.upsertPublicMap?.code === 409) {
        setError("A public map already exists for this subdomain.");
      }
    } catch (e) {
      console.error("Failed to upsert public map", e);
      setError("Unknown error.");
    }
  };

  if (!publicMap) {
    return null;
  }

  // Helper functions
  const getBaseUrl = () =>
    new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001");

  const makeHost = (subdomain: string) => {
    const baseHost = getBaseUrl().host;
    return `${subdomain}.${baseHost}`;
  };

  const getPublicMapUrlAfterSubDomain = () => {
    const baseHost = getBaseUrl().host;
    return `.${baseHost}`;
  };

  const getSubdomain = (host: string | undefined) => {
    if (!host) {
      return "";
    }
    return host.split(".")[0];
  };

  return (
    <>
      <form onSubmit={onSubmitForm} className="flex flex-col gap-2">
        <Label>URL</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">https://</span>
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
          <span className="text-sm text-neutral-500">
            {getPublicMapUrlAfterSubDomain()}
          </span>
        </div>
        <div className="flex items-center gap-2 py-8">
          <span className="text-sm text-neutral-500">Published</span>
          <Switch
            checked={publicMap.published}
            onCheckedChange={(published) => updatePublicMap({ published })}
          />
        </div>
      </form>
    </>
  );
}
