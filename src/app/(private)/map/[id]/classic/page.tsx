import ClassicMapEditor from "../ClassicMapEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapped - Map View (classic)",
};

export default async function ClassicMapPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string; viewId?: string }>;
}) {
  const { id } = await params;
  const { mode, viewId } = await searchParams;
  return (
    <ClassicMapEditor
      id={id}
      viewId={viewId}
      isPublishMode={mode === "publish"}
    />
  );
}
