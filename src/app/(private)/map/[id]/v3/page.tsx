import { redirect } from "next/navigation";

// The light editor prototype is now the map editor at /map/[id]
export default async function LightMapPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string; viewId?: string }>;
}) {
  const { id } = await params;
  const query = new URLSearchParams(
    Object.entries(await searchParams).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
  redirect(`/map/${id}${query.size ? `?${query}` : ""}`);
}
