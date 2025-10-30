import { notFound } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { createCaller } from "@/services/trpc/server";
import { MapStoreProvider } from "../../../providers/MapStoreProvider";
import PublicMap from "./components/PublicMap";
import { PublicMapEffects } from "./components/PublicMapEffects";
import { PublicMapStoreProvider } from "./providers/PublicMapStoreProvider";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string; viewIdOrHost: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { viewIdOrHost } = await params;
  const queryClient = await createCaller();

  const map = await queryClient.publicMap.getPublished({
    host: decodeURIComponent(viewIdOrHost),
  });

  return {
    title: Boolean(map?.name) ? `${map?.name} - Mapped` : "Mapped",
  };
}

export default async function PublicMapAdminPage({
  params,
}: {
  params: Promise<{ id: string; viewIdOrHost: string }>;
}) {
  const { id: mapIdOrPublic, viewIdOrHost } = await params;
  const isPublicRoute = mapIdOrPublic === "public";
  const queryClient = await createCaller();

  let publicMap = null;
  if (isPublicRoute) {
    publicMap = await queryClient.publicMap.getPublished({
      host: decodeURIComponent(viewIdOrHost),
    });
  } else {
    publicMap = await queryClient.publicMap.getEditable({
      viewId: viewIdOrHost,
    });
  }

  if (!publicMap) {
    if (isPublicRoute) {
      notFound();
    } else {
      publicMap = {
        id: uuidv4(),
        mapId: mapIdOrPublic,
        viewId: viewIdOrHost,
        host: "",
        name: "My Public Map",
        description: "",
        descriptionLink: "",
        published: false,
        dataSourceConfigs: [],
        createdAt: new Date(),
      };
    }
  }

  return (
    <MapStoreProvider viewId={publicMap.viewId}>
      <PublicMapStoreProvider publicMap={publicMap} editable={!isPublicRoute}>
        <PublicMapEffects />
        <PublicMap />
      </PublicMapStoreProvider>
    </MapStoreProvider>
  );
}
