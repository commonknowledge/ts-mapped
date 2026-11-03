import ClassicMapEditor from "./ClassicMapEditor";
import LightMapEditor from "./v3/LightMapEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapped - Map View",
};

export default async function MapPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string; viewId?: string }>;
}) {
  const { id } = await params;
  const { mode, viewId } = await searchParams;

  // Publishing is still done in the classic editor
  if (mode === "publish") {
    return <ClassicMapEditor id={id} viewId={viewId} isPublishMode />;
  }
  return <LightMapEditor id={id} viewId={viewId} />;
}
