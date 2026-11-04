"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDataSourceListCache } from "@/app/(private)/hooks/useDataSourceListCache";
import { usePatchColumnMetadata } from "@/app/(private)/hooks/usePatchColumnMetadata";
import { useDataSources } from "@/hooks/useDataSources";
import { useTRPC } from "@/services/trpc/react";
import { buildDefaultInspectorConfig } from "../../components/InspectorPanel/utils";
import type { InspectorConfig } from "../../hooks/useUpdateInspectorConfig";
import type { DefaultInspectorConfig } from "@/models/DataSource";

// The parts of a section a data source's default sets
const comparable = (
  config: Pick<
    DefaultInspectorConfig,
    "items" | "layout" | "color" | "name" | "icon"
  >,
  sourceName: string,
) =>
  JSON.stringify({
    items: config.items ?? [],
    layout: config.layout ?? null,
    color: config.color ?? null,
    // The source's own name is the same as no name
    name: config.name && config.name !== sourceName ? config.name : null,
    icon: config.icon || null,
  });

/**
 * Shown in the section editor once this map's section differs from its
 * data source's default: owners can make it the default for every map that
 * adds the source from now on, and anyone can go back to the default.
 */
export default function LightInspectorDefaultBar({
  config,
  onUpdate,
}: {
  config: InspectorConfig;
  onUpdate: (config: InspectorConfig) => void;
}) {
  const trpc = useTRPC();
  const { getDataSourceById } = useDataSources();
  const { isOwner } = usePatchColumnMetadata(config.dataSourceId);
  const { updateDataSource } = useDataSourceListCache();
  const dataSource = getDataSourceById(config.dataSourceId);

  const { mutate: saveDefault, isPending } = useMutation(
    trpc.dataSource.saveInspectorDefault.mutationOptions({
      onSuccess: (_data, { dataSourceId, config: saved }) => {
        updateDataSource(dataSourceId, (ds) => ({
          ...ds,
          defaultInspectorConfig: { ...saved, items: saved.items ?? [] },
        }));
        toast.success("Saved as the default for this data source");
      },
      onError: () => toast.error("Couldn't save the default"),
    }),
  );

  if (!dataSource) return null;

  // What a new map gets: the saved default, or one derived from the columns
  const baseline = buildDefaultInspectorConfig({
    dataSourceId: config.dataSourceId,
    mapViewId: config.mapViewId,
    position: config.position,
    dataSource,
  });
  const isChanged =
    comparable(config, dataSource.name) !==
    comparable(baseline, dataSource.name);
  if (!isChanged) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-xs">
      <p className="min-w-0 flex-1 text-neutral-600">Changed for this map</p>
      <button
        type="button"
        onClick={() =>
          onUpdate({
            ...config,
            items: baseline.items,
            layout: baseline.layout,
            color: baseline.color,
            name: baseline.name,
            icon: baseline.icon,
          })
        }
        className="shrink-0 cursor-pointer rounded px-1.5 py-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
      >
        Reset
      </button>
      {isOwner && (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            saveDefault({
              dataSourceId: config.dataSourceId,
              config: {
                // Keeps the library details only the default has
                description: dataSource.defaultInspectorConfig?.description,
                screenshotUrl: dataSource.defaultInspectorConfig?.screenshotUrl,
                items: config.items ?? [],
                layout: config.layout,
                color: config.color,
                name:
                  config.name && config.name !== dataSource.name
                    ? config.name
                    : null,
                icon: config.icon,
              },
            })
          }
          title="Use this section wherever this data source is added to a map"
          className="shrink-0 cursor-pointer rounded-md bg-neutral-900 px-2 py-1 font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save as default"}
        </button>
      )}
    </div>
  );
}
