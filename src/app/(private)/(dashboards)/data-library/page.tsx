"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { LoaderPinwheel, Mail, MapIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataSourceItem } from "@/components/DataSourceItem";
import { Link } from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";

type MovementLibraryMeta = {
  defaultColumn?: string;
  title?: string;
  icon?: string;
  description?: string;
};

export default function DataLibraryPage() {
  const trpc = useTRPC();
  const router = useRouter();
  const [creatingForId, setCreatingForId] = useState<string | null>(null);
  const [movementMetaById, setMovementMetaById] = useState<
    Record<string, MovementLibraryMeta | undefined>
  >({});

  const { data: readableSources, isPending } = useQuery(
    trpc.dataSource.listReadable.queryOptions(),
  );

  const movementSources = useMemo(
    () => (readableSources ?? []).filter((ds) => Boolean(ds.public)),
    [readableSources],
  );

  useEffect(() => {
    const ids = movementSources.map((ds) => ds.id);
    const missing = ids.filter((id) => movementMetaById[id] === undefined);
    if (missing.length === 0) return;

    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        missing.map(async (id) => {
          try {
            const res = await fetch(`/api/data-source-previews/${id}/meta`);
            if (!res.ok)
              return [
                id,
                {
                  defaultColumn: undefined,
                  title: undefined,
                  icon: undefined,
                  description: undefined,
                },
              ] as const;
            const json = (await res.json()) as {
              title?: string;
              description?: string;
              icon?: string;
              defaultVisualisation?: { defaultColumn?: string };
            };
            return [
              id,
              {
                defaultColumn: json.defaultVisualisation?.defaultColumn,
                title: json.title,
                icon: json.icon,
                description: json.description,
              },
            ] as const;
          } catch {
            return [
              id,
              {
                defaultColumn: undefined,
                title: undefined,
                icon: undefined,
                description: undefined,
              },
            ] as const;
          }
        }),
      );
      if (cancelled) return;
      setMovementMetaById((prev) => {
        const next = { ...prev };
        for (const [id, meta] of entries) next[id] = meta;
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [movementMetaById, movementSources]);

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Movement data library"
          action={
            <Button variant="default" size="lg" asChild={true}>
              <Link href="mailto:mapped@commonknowledge.coop?subject=Movement Data Library request">
                <Mail size={16} />
                Request a new data source
              </Link>
            </Button>
          }
        />
      </div>

      {isPending ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {movementSources.map((ds) => (
            <div
              key={ds.id}
              className="border rounded-lg shadow-sm hover:bg-neutral-50 hover:border-neutral-300 transition-all p-2 flex flex-col"
            >
              <DataSourceItem
                className="!border-0 !shadow-none !p-0 hover:!bg-transparent hover:!border-0"
                density="compactPreview"
                previewImageUrl={`/data-source-previews/${ds.id}.jpg`}
                showColumnPreview={true}
                columnPreviewVariant="pills"
                maxColumnPills={8}
                defaultColumnName={movementMetaById[ds.id]?.defaultColumn}
                overrideTitle={movementMetaById[ds.id]?.title}
                overrideIconName={movementMetaById[ds.id]?.icon}
                overrideDescription={movementMetaById[ds.id]?.description}
                dataSource={ds}
                hideTypeLabel={true}
                hidePublishedBadge={true}
              />

              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setCreatingForId(ds.id);
                  createMap({
                    organisationId: ds.organisationId,
                    dataSourceId: ds.id,
                  });
                }}
                disabled={creatingForId === ds.id}
                className="w-full mt-2"
              >
                {creatingForId === ds.id ? (
                  <LoaderPinwheel className="animate-spin" />
                ) : (
                  <MapIcon />
                )}
                Create map using this data source
              </Button>
            </div>
          ))}

          {movementSources.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No movement data sources available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
