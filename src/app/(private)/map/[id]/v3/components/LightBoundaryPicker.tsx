"use client";

import { InfoIcon } from "lucide-react";
import { useMemo } from "react";
import { useDataSources } from "@/hooks/useDataSources";
import { AreaSetGroupCodeLabels } from "@/labels";
import { MapType } from "@/models/MapView";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { getValidAreaSetGroupCodes } from "../../components/Choropleth/areas";
import { useMapViews } from "../../hooks/useMapViews";
import { BOUNDARY_GROUPS } from "../constants";
import type { AreaSetGroupCode } from "@/models/AreaSet";

const NONE = "none";

const isAreaSetGroupCode = (value: string): value is AreaSetGroupCode =>
  value in AreaSetGroupCodeLabels;

// The view's boundary set. With a data source, only sets that data can be
// grouped into are offered; without one ("outlines"), any set or none.
export default function LightBoundaryPicker({
  label,
  dataSourceId,
  disabled = false,
  disabledReason,
  allowNone,
  value,
  onChange,
}: {
  label: string;
  dataSourceId?: string;
  disabled?: boolean;
  /** Shown on hover while disabled */
  disabledReason?: string;
  /** Offer "No boundaries"; defaults to on when there's no data source */
  allowNone?: boolean;
  /** Defaults to the view's live boundaries */
  value?: AreaSetGroupCode | null;
  onChange?: (code: AreaSetGroupCode | null) => void;
}) {
  const { viewConfig, updateViewConfig } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const dataSource = dataSourceId ? getDataSourceById(dataSourceId) : null;
  const current =
    value !== undefined ? value : (viewConfig.areaSetGroupCode ?? null);

  const validCodes = useMemo(
    () => getValidAreaSetGroupCodes(dataSource?.geocodingConfig),
    [dataSource?.geocodingConfig],
  );
  // Only groups with a set this data can use, in the order they're listed
  const groups = useMemo(
    () =>
      BOUNDARY_GROUPS.map((group) => ({
        ...group,
        options: group.options.filter((o) => validCodes.includes(o.code)),
      })).filter((group) => group.options.length > 0),
    [validCodes],
  );
  const currentName = current
    ? (BOUNDARY_GROUPS.flatMap((g) => g.options).find((o) => o.code === current)
        ?.name ?? AreaSetGroupCodeLabels[current])
    : "No boundaries";

  const isFiltered =
    Boolean(dataSource) &&
    validCodes.length < Object.keys(AreaSetGroupCodeLabels).length;

  if (viewConfig.mapType === MapType.Hex) {
    return (
      <p className="text-xs text-neutral-500">
        {label} Westminster constituencies (hex map)
      </p>
    );
  }

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-1.5"
      title={disabled ? disabledReason : undefined}
    >
      <span className="shrink-0 text-xs text-neutral-500">{label}</span>
      <Select
        disabled={disabled}
        value={current ?? NONE}
        onValueChange={(selected) => {
          const code = isAreaSetGroupCode(selected) ? selected : null;
          if (onChange) {
            onChange(code);
          } else {
            updateViewConfig({ areaSetGroupCode: code });
          }
        }}
      >
        <SelectTrigger
          size="sm"
          className="h-7 min-w-0 flex-1 text-xs"
          aria-label={`${label} boundaries`}
        >
          <SelectValue>{currentName}</SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[min(28rem,var(--radix-select-content-available-height))] max-w-80">
          {(allowNone ?? !dataSource) && (
            <SelectItem value={NONE} className="text-xs">
              No boundaries
            </SelectItem>
          )}
          {groups.map((group, index) => (
            <SelectGroup key={group.label}>
              {(index > 0 || (allowNone ?? !dataSource)) && <SelectSeparator />}
              <SelectLabel className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
                {group.label}
              </SelectLabel>
              {group.options.map((option) => (
                <SelectItem
                  key={option.code}
                  value={option.code}
                  className="py-1"
                >
                  <span className="flex min-w-0 flex-col items-start gap-0">
                    <span className="text-xs">{option.name}</span>
                    <span className="text-[11px] text-neutral-500">
                      {option.description}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      {isFiltered && !disabled && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              aria-label="Why are some boundaries missing?"
              className="shrink-0 cursor-help text-neutral-400 hover:text-neutral-700"
            >
              <InfoIcon className="size-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-56">
            Showing boundaries that work with {dataSource?.name}.
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
