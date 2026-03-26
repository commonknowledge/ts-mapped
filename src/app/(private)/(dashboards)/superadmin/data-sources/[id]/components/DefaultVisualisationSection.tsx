"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import type { DataSource } from "@/models/DataSource";

export interface MovementLibraryMeta {
  title?: string;
  description?: string;
  icon?: string;
  defaultVisualisation?: {
    displayMode?: "counts" | "values";
    defaultColumn?: string;
  };
}

interface DefaultVisualisationSectionProps {
  id: string;
  dataSource: DataSource;
  savedMeta: MovementLibraryMeta;
  setSavedMeta: Dispatch<SetStateAction<MovementLibraryMeta>>;
  metaLoading: boolean;
  onUpload: (file: File) => Promise<{ url: string }>;
  isUploading: boolean;
  cacheBuster: number;
  onCacheBust: () => void;
}

export function DefaultVisualisationSection({
  id,
  dataSource,
  savedMeta,
  setSavedMeta,
  metaLoading,
  onUpload,
  isUploading,
  cacheBuster,
  onCacheBust,
}: DefaultVisualisationSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewState, setPreviewState] = useState<"jpg" | "png" | "none">(
    "jpg",
  );

  const previewUrl =
    previewState === "none"
      ? null
      : `/data-source-previews/${id}.${previewState}?ts=${cacheBuster}`;

  return (
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
            <span className="font-mono">/data-source-previews/{id}.jpg</span> or{" "}
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
                  const result = await onUpload(selectedFile);
                  setSelectedFile(null);
                  setPreviewState(result.url.endsWith(".png") ? "png" : "jpg");
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
                  onCacheBust();
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
                value={savedMeta.defaultVisualisation?.displayMode ?? "values"}
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
  );
}
