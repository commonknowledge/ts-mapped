"use client";

import { memo, useEffect, useState } from "react";
import {
  INSPECTOR_ICON_OPTIONS,
  InspectorPanelIcon,
} from "@/app/(private)/map/[id]/components/InspectorPanel/inspectorPanelOptions";
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

const DEFAULT_ICON_SELECT_VALUE = "__default_icon__";

export const GeneralSection = memo(function GeneralSection({
  dataSourceName,
  name,
  description,
  icon,
  disabled,
  onChange,
  showDescription = true,
  headerDescription,
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
  showDescription?: boolean;
  headerDescription?: string;
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
            {headerDescription ??
              "Configure the title, description and icon shown in the movement data library."}
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

        {showDescription ? (
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
        ) : null}

        <div
          className={showDescription ? "space-y-2" : "space-y-2 lg:col-span-2"}
        >
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
