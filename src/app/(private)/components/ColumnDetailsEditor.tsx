"use client";

import { PencilIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDataSourceColumn } from "@/app/(private)/map/[id]/hooks/useDataSourceColumn";
import { useColumnValues } from "@/hooks/useColumnValues";
import { useDataSources } from "@/hooks/useDataSources";
import { ColumnType } from "@/models/DataSource";
import { cn } from "@/shadcn/utils";
import { sortColumnValues } from "@/utils/sortColumnValues";
import { usePatchColumnMetadata } from "../hooks/usePatchColumnMetadata";
import ColorMappingsSection from "./EditColumnMetadataModal/ColorMappingsSection";
import type { ColumnMetadata } from "@/models/DataSource";

// Value lists longer than this are too long to label by hand
const MAX_LABELLED_VALUES = 50;
// Shown before "Show all"
const FIRST_VALUES = 8;
const SAVE_DELAY_MS = 500;

/**
 * A column's description, display labels and (optionally) value colours,
 * inline where the column is set up rather than in a separate dialog.
 * Saves as you type.
 */
export default function ColumnDetailsEditor({
  dataSourceId,
  column,
  onPatch,
  showColors = false,
}: {
  dataSourceId: string;
  column: string;
  onPatch: (patch: Partial<Omit<ColumnMetadata, "name">>) => void;
  /** Category colours too, e.g. for a column coloured on the map */
  showColors?: boolean;
}) {
  const { isOwner, organisationId } = usePatchColumnMetadata(dataSourceId);
  const { getDataSourceById } = useDataSources();
  const { columnMetadata, columnDef } = useDataSourceColumn(
    dataSourceId,
    column,
  );
  const [description, setDescription] = useState(
    columnMetadata?.description ?? "",
  );
  const [labels, setLabels] = useState<Record<string, string>>(
    columnMetadata?.valueLabels ?? {},
  );
  const [showAll, setShowAll] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const values = useColumnValues({
    dataSourceId,
    column,
    columnType: columnDef?.type ?? ColumnType.Unknown,
    nullIsZero: getDataSourceById(dataSourceId)?.nullIsZero,
    enabled: true,
  });
  const labellable =
    values && values.length <= MAX_LABELLED_VALUES
      ? sortColumnValues({ values, columnMetadata })
      : null;

  // Save after a pause in typing, and on the way out. Edits made within
  // the pause are merged, so a description and a label both land.
  const pending = useRef<Partial<Omit<ColumnMetadata, "name">>>({});
  const onPatchRef = useRef(onPatch);
  useEffect(() => {
    onPatchRef.current = onPatch;
  }, [onPatch]);
  const flush = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (Object.keys(pending.current).length) {
      onPatchRef.current(pending.current);
      pending.current = {};
    }
  };
  const save = (patch: Partial<Omit<ColumnMetadata, "name">>) => {
    pending.current = { ...pending.current, ...patch };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY_MS);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (Object.keys(pending.current).length) {
        onPatchRef.current(pending.current);
      }
    },
    [],
  );

  const setLabel = (value: string, label: string) => {
    const next = label
      ? { ...labels, [value]: label }
      : Object.fromEntries(
          Object.entries(labels).filter(([key]) => key !== value),
        );
    setLabels(next);
    save({ valueLabels: next });
  };

  const shown = labellable
    ? showAll
      ? labellable
      : labellable.slice(0, FIRST_VALUES)
    : [];

  return (
    <div className="col-span-2 flex flex-col gap-2 border-t border-neutral-200/70 pt-2 first:border-t-0 first:pt-0">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-neutral-500">Description</span>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            save({ description: e.target.value });
          }}
          rows={2}
          placeholder="What this column means, shown on hover"
          className="min-h-0 resize-y rounded border border-input bg-background px-1.5 py-1 text-xs outline-none focus:border-neutral-400"
        />
      </label>

      {/* One list of values: each with its colour (when coloured) and a
          display label you edit in place */}
      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-neutral-500">
          {showColors ? "Values" : "Display labels"}
        </span>
        {values === undefined ? (
          <p className="text-[11px] text-neutral-400">Loading values…</p>
        ) : !labellable ? (
          <p className="text-[11px] text-neutral-400">
            Too many different values to label.
          </p>
        ) : labellable.length === 0 ? (
          <p className="text-[11px] text-neutral-400">No values yet.</p>
        ) : showColors ? (
          <div className="[&_.rounded-md.border]:bg-white">
            <ColorMappingsSection
              dataSourceId={dataSourceId}
              columnName={column}
              mergedValues={labellable}
              existingMeta={columnMetadata}
              ownerMeta={getDataSourceById(dataSourceId)?.columnMetadata.find(
                (m) => m.name === column,
              )}
              isOwner={isOwner}
              organisationId={organisationId}
              hideLabel
              compact
              renderValue={(value) => (
                <EditableValueLabel
                  value={value}
                  label={labels[value] ?? ""}
                  onChange={(label) => setLabel(value, label)}
                />
              )}
            />
          </div>
        ) : (
          <>
            <ul className="flex flex-col">
              {shown.map((value) => (
                <li key={value}>
                  <EditableValueLabel
                    value={value}
                    label={labels[value] ?? ""}
                    onChange={(label) => setLabel(value, label)}
                  />
                </li>
              ))}
            </ul>
            {labellable.length > FIRST_VALUES && (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="w-fit cursor-pointer text-[11px] text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline"
              >
                {showAll
                  ? "Show fewer"
                  : `Show all ${labellable.length} values`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// A value's display label: shown as text with an edit button, and edited in
// place. The raw value stays visible beside a label.
function EditableValueLabel({
  value,
  label,
  onChange,
}: {
  value: string;
  label: string;
  onChange: (label: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  if (isEditing) {
    const commit = () => {
      setIsEditing(false);
      if (draft.trim() !== label) onChange(draft.trim());
    };
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(label);
            setIsEditing(false);
          }
        }}
        placeholder={value}
        aria-label={`Label for ${value}`}
        className="h-6 w-full min-w-0 rounded border border-neutral-400 bg-white px-1.5 text-xs outline-none placeholder:text-neutral-300"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(label);
        setIsEditing(true);
      }}
      title={`Rename "${value}"`}
      className="group/label flex h-6 w-full min-w-0 cursor-pointer items-center gap-1.5 rounded px-1 text-left hover:bg-neutral-100"
    >
      <span
        className={cn(
          "truncate text-xs",
          !label && "font-mono text-neutral-600",
        )}
      >
        {label || value || "(blank)"}
      </span>
      {label && (
        <span className="shrink-0 truncate font-mono text-[10px] text-neutral-400">
          {value}
        </span>
      )}
      <PencilIcon className="ml-auto size-3 shrink-0 text-neutral-400 opacity-0 group-hover/label:opacity-100 group-focus-visible/label:opacity-100" />
    </button>
  );
}
