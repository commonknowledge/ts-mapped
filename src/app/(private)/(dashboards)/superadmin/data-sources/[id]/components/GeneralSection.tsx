"use client";

import {
  INSPECTOR_ICON_OPTIONS,
  InspectorPanelIcon,
} from "@/app/(private)/map/[id]/components/InspectorPanel/inspectorPanelOptions";
import { Checkbox } from "@/shadcn/ui/checkbox";
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

export function GeneralSection({
  dataSourceName,
  name,
  description = "",
  icon,
  disabled,
  onChange,
  showDescription = true,
  headerDescription,
  adminApproved,
  isSuperadmin,
  onAdminApprovedChange,
}: {
  dataSourceName: string;
  name: string;
  description?: string;
  icon: string;
  disabled?: boolean;
  onChange: (patch: {
    name?: string;
    description?: string;
    icon?: string;
  }) => void;
  showDescription?: boolean;
  headerDescription?: string;
  adminApproved?: boolean;
  isSuperadmin?: boolean;
  onAdminApprovedChange?: (value: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 p-6 mb-6 space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-1">General</h3>
        <p className="text-sm text-muted-foreground">
          {headerDescription ??
            "Configure the title, description and icon shown in the movement data library."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-muted-foreground">Title (override)</Label>
          <Input
            value={name}
            placeholder={dataSourceName}
            onChange={(e) => onChange({ name: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">Icon</Label>
          <Select
            value={icon ? icon : DEFAULT_ICON_SELECT_VALUE}
            onValueChange={(value) =>
              onChange({
                icon: value === DEFAULT_ICON_SELECT_VALUE ? "" : value,
              })
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
        </div>
      </div>

      {showDescription ? (
        <div className="space-y-2">
          <Label className="text-muted-foreground">Description</Label>
          <Textarea
            value={description}
            placeholder="Short description shown in the movement data library…"
            onChange={(e) => onChange({ description: e.target.value })}
            disabled={disabled}
          />
        </div>
      ) : null}

      {isSuperadmin && onAdminApprovedChange !== undefined ? (
        <div className="flex items-center gap-2">
          <Checkbox
            id="adminApproved"
            checked={adminApproved ?? false}
            onCheckedChange={(checked) =>
              onAdminApprovedChange(Boolean(checked))
            }
            disabled={disabled}
          />
          <Label htmlFor="adminApproved" className="text-muted-foreground">
            Admin approved
          </Label>
        </div>
      ) : null}
    </div>
  );
}
