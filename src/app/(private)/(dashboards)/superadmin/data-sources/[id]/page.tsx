"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect, useParams } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  INSPECTOR_ICON_OPTIONS,
  InspectorPanelIcon,
} from "@/app/(private)/map/[id]/components/InspectorPanel/inspectorPanelOptions";
import { ADMIN_USER_EMAIL } from "@/constants";
import { useCurrentUser } from "@/hooks";
import { useTRPC } from "@/services/trpc/react";
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
import { DefaultInspectorConfigSection } from "./components/DefaultInspectorConfigSection";

const DEFAULT_ICON_SELECT_VALUE = "__default_icon__";

interface MovementLibraryMeta {
  title?: string;
  description?: string;
  icon?: string;
  defaultVisualisation?: {
    displayMode?: "counts" | "values";
    defaultColumn?: string;
  };
}

const GeneralSection = memo(function GeneralSection({
  dataSourceName,
  saved,
  disabled,
  onSave,
}: {
  dataSourceName: string;
  saved: Pick<MovementLibraryMeta, "title" | "description" | "icon">;
  disabled: boolean;
  onSave: (
    next: Pick<MovementLibraryMeta, "title" | "description" | "icon">,
  ) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => ({
    title: saved.title ?? "",
    description: saved.description ?? "",
    icon: saved.icon ?? "",
  }));

  useEffect(() => {
    if (isEditing) return;
    setDraft({
      title: saved.title ?? "",
      description: saved.description ?? "",
      icon: saved.icon ?? "",
    });
  }, [isEditing, saved.description, saved.icon, saved.title]);

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
              onClick={async () => {
                await onSave({
                  title: draft.title ?? "",
                  description: draft.description ?? "",
                  icon: draft.icon ?? "",
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
                setDraft({
                  title: saved.title ?? "",
                  description: saved.description ?? "",
                  icon: saved.icon ?? "",
                });
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
              value={draft.title ?? ""}
              placeholder={dataSourceName}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, title: e.target.value }))
              }
              disabled={disabled}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {saved.title?.trim() ? saved.title : "—"}
            </p>
          )}
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label className="text-muted-foreground">Description</Label>
          {isEditing ? (
            <Textarea
              value={draft.description ?? ""}
              placeholder="Short description shown in the movement data library…"
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, description: e.target.value }))
              }
              disabled={disabled}
            />
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {saved.description?.trim() ? saved.description : "—"}
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
              {saved.icon?.trim()
                ? (INSPECTOR_ICON_OPTIONS.find((o) => o.value === saved.icon)
                    ?.label ?? saved.icon)
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cacheBuster, setCacheBuster] = useState(() => Date.now());

  const { data: dataSources, isPending } = useQuery(
    trpc.dataSource.listPublic.queryOptions(),
  );

  if (currentUser?.email !== ADMIN_USER_EMAIL) redirect("/");

  const dataSource = dataSources?.find((ds) => ds.id === id);
  const [previewState, setPreviewState] = useState<"jpg" | "png" | "none">(
    "jpg",
  );
  const [savedMeta, setSavedMeta] = useState<MovementLibraryMeta>({
    title: "",
    description: "",
    icon: "",
    defaultVisualisation: { displayMode: "values", defaultColumn: "" },
  });
  const [metaLoading, setMetaLoading] = useState(false);

  const previewUrl = useMemo(() => {
    if (!id) return null;
    if (previewState === "none") return null;
    return `/data-source-previews/${id}.${previewState}?ts=${cacheBuster}`;
  }, [cacheBuster, id, previewState]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setMetaLoading(true);
    fetch(`/api/data-source-previews/${id}/meta`, { method: "GET" })
      .then(async (r) => {
        if (!r.ok) return {} as MovementLibraryMeta;
        return (await r.json()) as MovementLibraryMeta;
      })
      .then((data) => {
        if (cancelled) return;
        const next = {
          title: data.title ?? "",
          description: data.description ?? "",
          icon: data.icon ?? "",
          defaultVisualisation: {
            displayMode: data.defaultVisualisation?.displayMode ?? "values",
            defaultColumn: data.defaultVisualisation?.defaultColumn ?? "",
          },
        } satisfies MovementLibraryMeta;
        setSavedMeta(next);
      })
      .finally(() => {
        if (cancelled) return;
        setMetaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const { mutateAsync: uploadPreview, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch(`/api/data-source-previews/${id}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Upload failed");
      }
      return (await res.json()) as { url: string };
    },
    onSuccess: (data) => {
      setSelectedFile(null);
      setPreviewState(data.url.endsWith(".png") ? "png" : "jpg");
      setCacheBuster(Date.now());
      toast.success("Screenshot updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    },
  });

  const { mutateAsync: saveMeta, isPending: isSavingMeta } = useMutation({
    mutationFn: async (body: MovementLibraryMeta) => {
      const res = await fetch(`/api/data-source-previews/${id}/meta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Save failed");
      }
      return (await res.json()) as { ok: true };
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Save failed");
    },
  });

  const saveDisabled = isSavingMeta || metaLoading;
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const didHydrateMetaRef = useRef(false);

  const metaToPersist = useMemo(
    () => ({
      title: savedMeta.title ?? "",
      description: savedMeta.description ?? "",
      icon: savedMeta.icon ?? "",
      defaultVisualisation: {
        displayMode: savedMeta.defaultVisualisation?.displayMode ?? "values",
        defaultColumn: savedMeta.defaultVisualisation?.defaultColumn ?? "",
      },
    }),
    [savedMeta],
  );

  const handleSaveGeneral = useCallback(
    async (
      nextGeneral: Pick<MovementLibraryMeta, "title" | "description" | "icon">,
    ) => {
      const next: MovementLibraryMeta = {
        ...savedMeta,
        title: nextGeneral.title ?? "",
        description: nextGeneral.description ?? "",
        icon: nextGeneral.icon ?? "",
      };
      await saveMeta(next);
      setSavedMeta(next);
      toast.success("Saved");
    },
    [saveMeta, savedMeta],
  );

  // Auto-save default visualisation settings (and other already-saved meta fields).
  useEffect(() => {
    if (metaLoading) return;
    if (!didHydrateMetaRef.current) {
      didHydrateMetaRef.current = true;
      return;
    }
    if (!id) return;

    if (autoSaveTimeoutRef.current) {
      window.clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = window.setTimeout(() => {
      void saveMeta(metaToPersist).catch(() => {
        // error toast handled in mutation
      });
    }, 600);

    return () => {
      if (autoSaveTimeoutRef.current) {
        window.clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, [id, metaLoading, metaToPersist, saveMeta]);

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
        saved={{
          title: savedMeta.title ?? "",
          description: savedMeta.description ?? "",
          icon: savedMeta.icon ?? "",
        }}
        disabled={saveDisabled}
        onSave={handleSaveGeneral}
      />

      <div className="rounded-lg border border-neutral-200 p-6 mb-6 space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-1">
            Default visualisation settings
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure screenshot + defaults used in the map data source picker
            modal.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/2">
            <div className="rounded-md border border-neutral-200 bg-neutral-50 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl ?? "/screenshot-placeholder.jpeg"}
                alt=""
                onError={() => {
                  setPreviewState((prev) => (prev === "jpg" ? "png" : "none"));
                }}
                className="w-full aspect-video object-cover"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              File path:{" "}
              <span className="font-mono">/data-source-previews/{id}.jpg</span>{" "}
              or{" "}
              <span className="font-mono">/data-source-previews/{id}.png</span>
            </p>

            <div className="mt-4 space-y-2">
              <Label>Upload new screenshot (JPEG or PNG)</Label>
              <Input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setSelectedFile(f);
                }}
              />

              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  disabled={!selectedFile || isUploading}
                  onClick={async () => {
                    if (!selectedFile) return;
                    await uploadPreview(selectedFile);
                  }}
                >
                  {isUploading ? "Uploading…" : "Upload"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => {
                    setSelectedFile(null);
                    setCacheBuster(Date.now());
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Default column</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={savedMeta.defaultVisualisation?.defaultColumn ?? ""}
                  onChange={(e) =>
                    setSavedMeta((prev) => ({
                      ...prev,
                      defaultVisualisation: {
                        ...prev.defaultVisualisation,
                        defaultColumn: e.target.value,
                      },
                    }))
                  }
                  disabled={metaLoading}
                >
                  <option value="">(No default)</option>
                  {dataSource.columnDefs.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Default display</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={
                    savedMeta.defaultVisualisation?.displayMode ?? "values"
                  }
                  onChange={(e) =>
                    setSavedMeta((prev) => ({
                      ...prev,
                      defaultVisualisation: {
                        ...prev.defaultVisualisation,
                        displayMode: e.target.value as "counts" | "values",
                      },
                    }))
                  }
                  disabled={metaLoading}
                >
                  <option value="values">Data values</option>
                  <option value="counts">Count by area</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Columns (preview)</Label>
              <div className="flex flex-wrap gap-1.5">
                {(() => {
                  const cols = dataSource.columnDefs.map((c) => c.name);
                  const defaultCol =
                    savedMeta.defaultVisualisation?.defaultColumn &&
                    cols.includes(savedMeta.defaultVisualisation.defaultColumn)
                      ? savedMeta.defaultVisualisation.defaultColumn
                      : null;
                  const ordered = defaultCol
                    ? [defaultCol, ...cols.filter((c) => c !== defaultCol)]
                    : cols;
                  return ordered.slice(0, 10).map((name) => {
                    const isDefault = name === defaultCol;
                    return (
                      <span
                        key={name}
                        className={`px-2 py-0.5 rounded-full border text-xs font-medium ${
                          isDefault
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-neutral-100 border-neutral-200"
                        }`}
                        title={isDefault ? `${name} (default)` : name}
                      >
                        {name.length > 18 ? `${name.slice(0, 18)}…` : name}
                      </span>
                    );
                  });
                })()}
                {dataSource.columnDefs.length > 10 && (
                  <span className="px-2 py-0.5 rounded-full bg-neutral-50 border border-neutral-200 text-xs text-muted-foreground">
                    +{dataSource.columnDefs.length - 10} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DefaultInspectorConfigSection
        dataSource={dataSource}
        forcedTitle={savedMeta.title}
        forcedIcon={savedMeta.icon}
      />
    </div>
  );
}
