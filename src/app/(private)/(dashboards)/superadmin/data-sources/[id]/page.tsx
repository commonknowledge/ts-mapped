"use client";

import { useMutation } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect, useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDataSourceListCache } from "@/app/(private)/hooks/useDataSourceListCache";
import { isSuperadminDataSourceRouteAtom } from "@/atoms/dataSourceAtoms";
import { ADMIN_USER_EMAIL } from "@/constants";
import { useCurrentUser } from "@/hooks";
import { useDataSources } from "@/hooks/useDataSources";
import { useTRPC } from "@/services/trpc/react";
import { uploadFile } from "@/services/uploads";
import { DefaultChoroplethSection } from "./components/DefaultChoroplethSection";
import { DefaultInspectorConfigSection } from "./components/DefaultInspectorConfigSection";
import { GeneralSection } from "./components/GeneralSection";
import { ScreenshotSection } from "./components/ScreenshotSection";
import type {
  ColumnMetadata,
  DefaultChoroplethConfig,
  DefaultInspectorConfig,
} from "@/models/DataSource";

export default function DataSourceConfigPage() {
  const { currentUser } = useCurrentUser();
  const { id } = useParams<{ id: string }>();
  const trpc = useTRPC();
  const { updateDataSource, invalidateAll } = useDataSourceListCache();

  const setIsSuperadminDataSourceRoute = useSetAtom(
    isSuperadminDataSourceRouteAtom,
  );
  useEffect(() => {
    setIsSuperadminDataSourceRoute(true);
    return () => setIsSuperadminDataSourceRoute(false);
  }, [setIsSuperadminDataSourceRoute]);

  const { data: dataSources, isPending, getDataSourceById } = useDataSources();

  if (currentUser && currentUser.email !== ADMIN_USER_EMAIL) redirect("/");

  const dataSource = dataSources?.find((ds) => ds.id === id);

  // Ref keeps the latest getDataSourceById without adding it to useCallback deps,
  // so debounced save handlers stay identity-stable (avoiding child re-renders)
  // but still read post-optimistic-update data when the timeout fires.
  const getDataSourceByIdRef = useRef(getDataSourceById);
  getDataSourceByIdRef.current = getDataSourceById;

  const { mutateAsync: saveInspectorConfig, isPending: isSavingInspector } =
    useMutation(
      trpc.dataSource.updateDefaultInspectorConfig.mutationOptions({
        onError: (err) => {
          toast.error(err.message || "Failed to save inspector settings.");
          void invalidateAll();
        },
      }),
    );

  const { mutate: patchColumnMetadata } = useMutation(
    trpc.dataSource.patchColumnMetadataSuperadmin.mutationOptions({
      onSuccess: () => {
        void invalidateAll();
      },
    }),
  );

  const { mutateAsync: saveChoroplethConfig } = useMutation(
    trpc.dataSource.updateDefaultChoroplethConfig.mutationOptions({
      onError: (err) => {
        toast.error(err.message || "Failed to save choropleth settings.");
        void invalidateAll();
      },
    }),
  );

  const inspectorSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInspectorConfigChange = useCallback(
    (patch: Partial<DefaultInspectorConfig>) => {
      updateDataSource(id, (ds) => ({
        ...ds,
        defaultInspectorConfig: {
          ...(ds.defaultInspectorConfig ?? { items: [] }),
          ...patch,
        },
      }));
      if (inspectorSaveTimer.current) clearTimeout(inspectorSaveTimer.current);
      inspectorSaveTimer.current = setTimeout(() => {
        const config = getDataSourceByIdRef.current(id)
          ?.defaultInspectorConfig ?? {
          items: [],
        };
        void saveInspectorConfig({ dataSourceId: id, config });
      }, 600);
    },
    [id, updateDataSource, saveInspectorConfig],
  );

  const choroplethSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const handleChoroplethConfigChange = useCallback(
    (config: DefaultChoroplethConfig | null) => {
      updateDataSource(id, (ds) => ({
        ...ds,
        defaultChoroplethConfig: config,
      }));
      if (choroplethSaveTimer.current)
        clearTimeout(choroplethSaveTimer.current);
      choroplethSaveTimer.current = setTimeout(() => {
        const currentConfig =
          getDataSourceByIdRef.current(id)?.defaultChoroplethConfig ?? null;
        void saveChoroplethConfig({ dataSourceId: id, config: currentConfig });
      }, 600);
    },
    [id, updateDataSource, saveChoroplethConfig],
  );

  const [isUploading, setIsUploading] = useState(false);

  const handleScreenshotUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const url = await uploadFile(file);
        handleInspectorConfigChange({ screenshotUrl: url });
        toast.success("Screenshot updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [handleInspectorConfigChange],
  );

  if (isPending) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  if (!dataSource) {
    return (
      <div className="p-8 text-muted-foreground">Data source not found.</div>
    );
  }

  return (
    <div className="p-4 mx-auto max-w-7xl w-full">
      <div className="mb-6">
        <Link
          href="/superadmin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Superadmin
        </Link>
        <h1 className="text-3xl font-medium tracking-tight mt-3 min-w-0">
          {dataSource.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure default inspector settings for this public data source.
        </p>
      </div>

      <GeneralSection
        dataSourceName={dataSource.name}
        name={dataSource.defaultInspectorConfig?.name ?? ""}
        description={dataSource.defaultInspectorConfig?.description ?? ""}
        icon={dataSource.defaultInspectorConfig?.icon ?? ""}
        disabled={isSavingInspector}
        onChange={handleInspectorConfigChange}
      />

      <ScreenshotSection
        screenshotUrl={dataSource.defaultInspectorConfig?.screenshotUrl}
        isUploading={isUploading}
        onUpload={handleScreenshotUpload}
      />

      <DefaultChoroplethSection
        dataSource={dataSource}
        config={dataSource.defaultChoroplethConfig ?? null}
        onChange={handleChoroplethConfigChange}
      />

      <DefaultInspectorConfigSection
        dataSourceId={dataSource.id}
        columnDefs={dataSource.columnDefs}
        config={dataSource.defaultInspectorConfig ?? { items: [] }}
        onChange={handleInspectorConfigChange}
        onPatchColumnMetadata={(
          column,
          patch: Partial<Omit<ColumnMetadata, "name">>,
        ) =>
          patchColumnMetadata({ dataSourceId: dataSource.id, column, patch })
        }
      />
    </div>
  );
}
