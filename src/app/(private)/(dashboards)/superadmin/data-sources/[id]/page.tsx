"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect, useParams } from "next/navigation";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  INSPECTOR_ICON_OPTIONS,
  InspectorPanelIcon,
} from "@/app/(private)/map/[id]/components/InspectorPanel/inspectorPanelOptions";
import { ADMIN_USER_EMAIL } from "@/constants";
import { useCurrentUser } from "@/hooks";
import { useTRPC } from "@/services/trpc/react";
import { uploadFile } from "@/services/uploads";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Textarea } from "@/shadcn/ui/textarea";
import { DefaultChoroplethSection } from "./components/DefaultChoroplethSection";
import { DefaultInspectorConfigSection } from "./components/DefaultInspectorConfigSection";
import { ScreenshotSection } from "./components/ScreenshotSection";
import type {
  DefaultChoroplethConfig,
  DefaultInspectorConfig,
} from "@/models/DataSource";

const DEFAULT_ICON_SELECT_VALUE = "__default_icon__";

const GeneralSection = memo(function GeneralSection({
  dataSourceName,
  name,
  description,
  icon,
  disabled,
  onChange,
}: {
  dataSourceName: string;
  name: string;
  description: string;
  icon: string;
  disabled: boolean;
  onChange: (patch: {
    name?: string;
    description?: string;
    icon?: string;
  }) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ name, description, icon });

  useEffect(() => {
    if (isEditing) return;
    setDraft({ name, description, icon });
  }, [isEditing, name, description, icon]);

  return (
    <div className="rounded-lg border border-neutral-200 p-6 mb-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-medium mb-1">General</h3>
          <p className="text-sm text-muted-foreground">
            Configure the title, description and icon shown in the movement data
            library.
          </p>
        </div>
        {isEditing ? (
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => {
                onChange({
                  name: draft.name,
                  description: draft.description,
                  icon: draft.icon,
                });
                setIsEditing(false);
              }}
            >
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              onClick={() => {
                setDraft({ name, description, icon });
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            disabled={disabled}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-muted-foreground">Title (override)</Label>
          {isEditing ? (
            <Input
              value={draft.name}
              placeholder={dataSourceName}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={disabled}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {name.trim() ? name : "—"}
            </p>
          )}
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label className="text-muted-foreground">Description</Label>
          {isEditing ? (
            <Textarea
              value={draft.description}
              placeholder="Short description shown in the movement data library…"
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, description: e.target.value }))
              }
              disabled={disabled}
            />
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {description.trim() ? description : "—"}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">Icon</Label>
          {isEditing ? (
            <Select
              value={draft.icon ? draft.icon : DEFAULT_ICON_SELECT_VALUE}
              onValueChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  icon: value === DEFAULT_ICON_SELECT_VALUE ? "" : value,
                }))
              }
              disabled={disabled}
            >
              <SelectTrigger className="h-9 w-full min-w-0 truncate">
                <SelectValue placeholder="Default (data source icon)" />
              </SelectTrigger>
              <SelectContent>
                {INSPECTOR_ICON_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value || DEFAULT_ICON_SELECT_VALUE}
                    value={opt.value || DEFAULT_ICON_SELECT_VALUE}
                  >
                    <span className="flex items-center gap-2">
                      <InspectorPanelIcon
                        iconName={opt.value || "database"}
                        className="h-4 w-4 shrink-0"
                      />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              {icon.trim()
                ? (INSPECTOR_ICON_OPTIONS.find((o) => o.value === icon)
                    ?.label ?? icon)
                : "Default (data source icon)"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

export default function DataSourceConfigPage() {
  const { currentUser } = useCurrentUser();
  const { id } = useParams<{ id: string }>();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: dataSources, isPending } = useQuery(
    trpc.dataSource.listPublic.queryOptions(),
  );

  if (currentUser?.email !== ADMIN_USER_EMAIL) redirect("/");

  const dataSource = dataSources?.find((ds) => ds.id === id);

  const [localInspectorConfig, setLocalInspectorConfig] =
    useState<DefaultInspectorConfig>({ items: [] });
  const [localChoroplethConfig, setLocalChoroplethConfig] =
    useState<DefaultChoroplethConfig | null>(null);

  // Initialise local state once the data source loads
  const didInitRef = useRef(false);
  useEffect(() => {
    if (!dataSource || didInitRef.current) return;
    didInitRef.current = true;
    setLocalInspectorConfig(dataSource.defaultInspectorConfig ?? { items: [] });
    setLocalChoroplethConfig(dataSource.defaultChoroplethConfig ?? null);
  }, [dataSource]);

  const { mutateAsync: saveInspectorConfig, isPending: isSavingInspector } =
    useMutation(
      trpc.dataSource.updateDefaultInspectorConfig.mutationOptions({
        onSuccess: async () => {
          await queryClient.invalidateQueries(
            trpc.dataSource.listPublic.queryFilter(),
          );
        },
        onError: (err) => {
          toast.error(err.message || "Failed to save inspector settings.");
        },
      }),
    );

  const { mutateAsync: saveChoroplethConfig } = useMutation(
    trpc.dataSource.updateDefaultChoroplethConfig.mutationOptions({
      onError: (err) => {
        toast.error(err.message || "Failed to save choropleth settings.");
      },
    }),
  );

  // Debounced auto-save for inspector config
  const inspectorAutoSaveRef = useRef<number | null>(null);
  const didInitInspectorAutoSaveRef = useRef(false);
  useEffect(() => {
    if (!didInitInspectorAutoSaveRef.current) {
      didInitInspectorAutoSaveRef.current = true;
      return;
    }
    if (!id) return;
    if (inspectorAutoSaveRef.current)
      window.clearTimeout(inspectorAutoSaveRef.current);
    inspectorAutoSaveRef.current = window.setTimeout(() => {
      void saveInspectorConfig({
        dataSourceId: id,
        config: localInspectorConfig,
      });
    }, 600);
    return () => {
      if (inspectorAutoSaveRef.current)
        window.clearTimeout(inspectorAutoSaveRef.current);
    };
  }, [id, localInspectorConfig, saveInspectorConfig]);

  // Debounced auto-save for choropleth config
  const choroplethAutoSaveRef = useRef<number | null>(null);
  const didInitChoroplethAutoSaveRef = useRef(false);
  useEffect(() => {
    if (!didInitChoroplethAutoSaveRef.current) {
      didInitChoroplethAutoSaveRef.current = true;
      return;
    }
    if (!id) return;
    if (choroplethAutoSaveRef.current)
      window.clearTimeout(choroplethAutoSaveRef.current);
    choroplethAutoSaveRef.current = window.setTimeout(() => {
      void saveChoroplethConfig({
        dataSourceId: id,
        config: localChoroplethConfig,
      });
    }, 600);
    return () => {
      if (choroplethAutoSaveRef.current)
        window.clearTimeout(choroplethAutoSaveRef.current);
    };
  }, [id, localChoroplethConfig, saveChoroplethConfig]);

  const [isUploading, setIsUploading] = useState(false);

  const handleScreenshotUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      setLocalInspectorConfig((prev) => ({ ...prev, screenshotUrl: url }));
      toast.success("Screenshot updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, []);

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
        name={localInspectorConfig.name ?? ""}
        description={localInspectorConfig.description ?? ""}
        icon={localInspectorConfig.icon ?? ""}
        disabled={isSavingInspector}
        onChange={(patch) =>
          setLocalInspectorConfig((prev) => ({ ...prev, ...patch }))
        }
      />

      <ScreenshotSection
        screenshotUrl={localInspectorConfig.screenshotUrl}
        onUploaded={(url) =>
          setLocalInspectorConfig((prev) => ({ ...prev, screenshotUrl: url }))
        }
        isUploading={isUploading}
        onUpload={handleScreenshotUpload}
      />

      <DefaultChoroplethSection
        dataSource={dataSource}
        config={localChoroplethConfig}
        onChange={setLocalChoroplethConfig}
      />

      <DefaultInspectorConfigSection
        dataSource={dataSource}
        items={localInspectorConfig.items ?? []}
        layout={localInspectorConfig.layout ?? "single"}
        color={localInspectorConfig.color ?? null}
        name={localInspectorConfig.name ?? ""}
        icon={localInspectorConfig.icon ?? ""}
        isSaving={isSavingInspector}
        onChange={(patch) =>
          setLocalInspectorConfig((prev) => ({ ...prev, ...patch }))
        }
      />
    </div>
  );
}
