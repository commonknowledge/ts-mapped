import { gql, useMutation, useQuery } from "@apollo/client";
import { LoaderPinwheel } from "lucide-react";
import { useEffect, useState } from "react";
import {
  PublicMapQuery,
  PublicMapQueryVariables,
  UpsertPublicMapMutation,
  UpsertPublicMapMutationVariables,
} from "@/__generated__/types";
import DataListRow from "@/components/DataListRow";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";

export default function PublishViewModal({
  viewId,
  onClose,
}: {
  viewId: string;
  onClose: () => void;
}) {
  const [error, setError] = useState("");
  const [host, setHost] = useState<string | null>(null);

  const publicMapQuery = useQuery<PublicMapQuery, PublicMapQueryVariables>(
    gql`
      query PublicMap($viewId: String!) {
        publicMap(viewId: $viewId) {
          id
          host
          name
          description
          descriptionLink
          published
        }
      }
    `,
    { variables: { viewId }, fetchPolicy: "network-only" },
  );

  useEffect(() => {
    if (
      publicMapQuery.data?.publicMap?.host &&
      publicMapQuery.data.publicMap.published
    ) {
      setHost(publicMapQuery.data.publicMap.host);
    }
  }, [publicMapQuery?.data]);

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
    ) {
      upsertPublicMap(
        viewId: $viewId
        host: $host
        name: $name
        description: $description
        descriptionLink: $descriptionLink
        published: $published
      ) {
        code
        result {
          host
        }
      }
    }
  `);

  const onClickUnpublish = async () => {
    if (!viewId || !publicMapQuery.data?.publicMap) {
      return;
    }
    setError("");
    try {
      const result = await upsertPublicMap({
        variables: {
          ...publicMapQuery.data.publicMap,
          viewId,
          published: false,
        },
      });
      if (result.data?.upsertPublicMap?.code === 200) {
        setHost(null);
        return;
      }
      setError("Unknown error.");
    } catch (e) {
      console.error("Failed to unpublish public map", e);
      setError("Unknown error.");
    }
  };

  const onSubmitForm = async (variables: PublishViewFormVariables) => {
    if (!viewId) {
      return;
    }
    setError("");
    try {
      const result = await upsertPublicMap({
        variables: {
          host: makeHost(variables.subdomain),
          name: variables.name,
          description: variables.description,
          descriptionLink: variables.descriptionLink,
          viewId,
          published: true,
        },
      });
      if (result.data?.upsertPublicMap?.result?.host) {
        setHost(result.data.upsertPublicMap.result.host);
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
    <Dialog
      open={Boolean(viewId)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish View</DialogTitle>
          <DialogDescription>
            <span>Make this view accessible to the public. </span>
            <span className="font-bold text-red-500">
              Ensure no private data is used in this map, as it will become
              public!{" "}
            </span>
            {host && (
              <span className="font-bold">
                This view is published at{" "}
                <a href={getPublicMapUrl(host)} target="_blank">
                  {getPublicMapUrl(host)}
                </a>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        {publicMapQuery.loading ? (
          <LoaderPinwheel className="animate-spin" />
        ) : (
          <PublishViewForm
            onClickUnpublish={onClickUnpublish}
            onSubmitForm={onSubmitForm}
            publicMap={publicMapQuery.data?.publicMap}
            published={Boolean(host)}
            loading={loading}
          />
        )}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </DialogContent>
    </Dialog>
  );
}

interface PublishViewFormVariables {
  subdomain: string;
  name: string;
  description: string;
  descriptionLink: string;
}

function PublishViewForm({
  onClickUnpublish,
  onSubmitForm,
  publicMap,
  published,
  loading,
}: {
  onClickUnpublish: () => void;
  onSubmitForm: (variables: PublishViewFormVariables) => void;
  publicMap: PublicMapQuery["publicMap"];
  published: boolean;
  loading: boolean;
}) {
  const [subdomain, setSubdomain] = useState(getSubdomain(publicMap?.host));
  const [name, setName] = useState(publicMap?.name || "");
  const [description, setDescription] = useState(publicMap?.description || "");
  const [descriptionLink, setDescriptionLink] = useState(
    publicMap?.descriptionLink || "",
  );

  return (
    <form
      className="flex flex-col gap-4 relative"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitForm({ subdomain, name, description, descriptionLink });
      }}
    >
      <DataListRow label="Subdomain">
        <Input
          type="text"
          placeholder="my-map"
          value={subdomain}
          onChange={(e) => setSubdomain(e.target.value)}
          required
          pattern="^[a-z]+(-[a-z]+)*$"
        />
      </DataListRow>
      <DataListRow label="Name">
        <Input
          type="text"
          placeholder="My Map"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </DataListRow>
      <DataListRow label="Description">
        <Input
          type="text"
          placeholder="A public map made by me."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </DataListRow>
      <DataListRow label="Project Link">
        <Input
          type="text"
          placeholder="https://example.com"
          value={descriptionLink}
          onChange={(e) => setDescriptionLink(e.target.value)}
        />
      </DataListRow>
      <div className="flex gap-4">
        {published && (
          <Button
            className="basis-0 grow"
            disabled={loading}
            type="button"
            variant="outline"
            onClick={onClickUnpublish}
          >
            Unpublish
          </Button>
        )}
        <Button className="basis-0 grow" disabled={loading} type="submit">
          {published ? "Update" : "Publish"}
        </Button>
      </div>
    </form>
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
