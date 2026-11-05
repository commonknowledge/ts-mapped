"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { LoaderPinwheel, Mail, MapIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataSourceItem } from "@/components/DataSourceItem";
import { Link } from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";

export default function DataLibraryPage() {
  const trpc = useTRPC();
  const router = useRouter();
  const [creatingForId, setCreatingForId] = useState<string | null>(null);

  const { data: readableSources, isPending } = useQuery(
    trpc.dataSource.listReadable.queryOptions(),
  );

  const movementSources = useMemo(
    () => (readableSources ?? []).filter((ds) => Boolean(ds.public)),
    [readableSources],
  );

  const { mutate: createMap } = useMutation(
    trpc.map.createFromDataSource.mutationOptions({
      onSuccess: (data) => {
        router.push(`/map/${data.id}`);
      },
      onError: () => {
        toast.error("Failed to create map");
        setCreatingForId(null);
      },
      onSettled: () => {
        setCreatingForId(null);
      },
    }),
  );

  return (
    <div>
      <PageHeader
        variant="hero"
        eyebrow="Shared by Common Knowledge"
        title="Movement data library"
        description="Election results, census figures and other public data, ready to add to any map. Start a map from one, or add it from a map's Areas."
        action={
          <Button variant="outline" className="bg-white" asChild={true}>
            <Link href="mailto:mapped@commonknowledge.coop?subject=Movement Data Library request">
              <Mail className="size-4" />
              Request data
            </Link>
          </Button>
        }
      />

      {isPending ? (
        <LoaderPinwheel className="animate-spin text-neutral-400" />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {movementSources.map((ds) => (
            <div
              key={ds.id}
              className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white p-2 transition-all duration-200 hover:border-neutral-300 hover:shadow-[0_8px_30px_rgba(21,33,59,0.08)]"
            >
              <DataSourceItem
                className="!border-0 !shadow-none !p-0 hover:!bg-transparent hover:!border-0"
                density="compactPreview"
                showColumnPreview={true}
                columnPreviewVariant="pills"
                maxColumnPills={8}
                dataSource={ds}
                hideTypeLabel={true}
                hidePublishedBadge={true}
              />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCreatingForId(ds.id);
                  createMap({
                    organisationId: ds.organisationId,
                    dataSourceId: ds.id,
                  });
                }}
                disabled={creatingForId === ds.id}
                className="mt-2 w-full justify-center border-t border-neutral-100 pt-2 text-neutral-700 hover:text-ink"
              >
                {creatingForId === ds.id ? (
                  <LoaderPinwheel className="animate-spin" />
                ) : (
                  <MapIcon />
                )}
                Start a map with this
              </Button>
            </div>
          ))}

          {movementSources.length === 0 && (
            <p className="text-sm text-neutral-500">No shared data yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
