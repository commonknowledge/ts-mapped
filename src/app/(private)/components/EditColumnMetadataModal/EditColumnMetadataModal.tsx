"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useColumnMetadataMutations } from "@/app/(private)/hooks/useColumnMetadataMutations";
import { useAreaStats } from "@/app/(private)/map/[id]/data";
import { useDataSourceColumn } from "@/app/(private)/map/[id]/hooks/useDataSourceColumn";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import { useOrganisationId } from "@/atoms/organisationAtoms";
import { useColumnValues } from "@/hooks/useColumnValues";
import { useDataSources } from "@/hooks/useDataSources";
import { useEditColumnMetadata } from "@/hooks/useEditColumnMetadata";
import { ColumnType } from "@/models/DataSource";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Textarea } from "@/shadcn/ui/textarea";
import ColorMappingsSection from "./ColorMappingsSection";
import ValueLabelsSection from "./ValueLabelsSection";
import type { EditColumnMetadataFields } from "@/atoms/editColumnMetadataAtom";

export default function EditColumnMetadataModal() {
  const [editColumnMetadata, setEditColumnMetadata] = useEditColumnMetadata();
  const { getDataSourceById } = useDataSources();
  const organisationId = useOrganisationId();

  const { viewConfig } = useMapViews();
  const { patchColumnMetadata, patchColumnMetadataOverride } =
    useColumnMetadataMutations();

  const dataSource = getDataSourceById(editColumnMetadata?.dataSourceId);
  const columnName = editColumnMetadata?.column ?? "";
  const dataSourceId = dataSource?.id;

  const metadataSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef({
    description: "",
    valueLabels: {} as Record<string, string>,
  });

  useEffect(() => {
    return () => {
      if (metadataSaveTimer.current) {
        clearTimeout(metadataSaveTimer.current);
      }
    };
  }, []);

  const isOwner = Boolean(
    organisationId &&
    dataSource &&
    dataSource.organisationId === organisationId,
  );

  const { columnMetadata: existingMeta, columnDef } = useDataSourceColumn(
    dataSourceId,
    columnName,
  );
  const columnType = columnDef?.type;

  const ownerMeta = useMemo(() => {
    if (!dataSource) return undefined;
    return dataSource.columnMetadata.find((m) => m.name === columnName);
  }, [dataSource, columnName]);

  const [draftDescription, setDraftDescription] = useState("");
  const [draftValueLabels, setDraftValueLabels] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (editColumnMetadata) {
      const desc = existingMeta?.description ?? "";
      const labels = existingMeta?.valueLabels ?? {};
      setDraftDescription(desc);
      setDraftValueLabels(labels);
      lastSavedRef.current = { description: desc, valueLabels: labels };
    }
  }, [editColumnMetadata, existingMeta]);

  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery?.data;

  const isVisualisedColumn =
    editColumnMetadata?.dataSourceId === viewConfig.areaDataSourceId &&
    editColumnMetadata?.column === viewConfig.areaDataColumn;

  const areaStatsValues = useMemo(() => {
    if (!isVisualisedColumn || !areaStats?.stats.length) return [];
    return Array.from(
      new Set(
        areaStats.stats
          .map((s) => String(s.primary))
          .filter((v) => v && v !== "null" && v !== "undefined"),
      ),
    );
  }, [isVisualisedColumn, areaStats]);

  const columnValues = useColumnValues({
    dataSourceId: dataSource?.id ?? "",
    column: columnName,
    columnType: columnType ?? ColumnType.Unknown,
    nullIsZero: dataSource?.nullIsZero,
    enabled: Boolean(dataSource && columnName),
    additionalValues: areaStatsValues,
  });

  const mergedValues = useMemo((): string[] | null | undefined => {
    if (columnValues === null) return null;
    if (columnValues === undefined) return undefined;
    if (columnValues.length > 50) return null;
    return columnValues;
  }, [columnValues]);

  const saveMetadata = useCallback(() => {
    if (!dataSourceId) return;
    const patch = {
      description: draftDescription,
      valueLabels: draftValueLabels,
    };
    lastSavedRef.current = {
      description: draftDescription,
      valueLabels: { ...draftValueLabels },
    };
    if (isOwner) {
      patchColumnMetadata({ dataSourceId, column: columnName, patch });
    } else if (organisationId) {
      patchColumnMetadataOverride({
        organisationId,
        dataSourceId,
        column: columnName,
        patch,
      });
    }
  }, [
    dataSourceId,
    columnName,
    draftDescription,
    draftValueLabels,
    isOwner,
    organisationId,
    patchColumnMetadata,
    patchColumnMetadataOverride,
  ]);

  useEffect(() => {
    if (!dataSource || !editColumnMetadata) return;
    const { description: lastDesc, valueLabels: lastLabels } =
      lastSavedRef.current;
    if (
      draftDescription === lastDesc &&
      JSON.stringify(draftValueLabels) === JSON.stringify(lastLabels)
    ) {
      return;
    }
    if (metadataSaveTimer.current) {
      clearTimeout(metadataSaveTimer.current);
    }
    metadataSaveTimer.current = setTimeout(() => {
      saveMetadata();
      metadataSaveTimer.current = null;
    }, 500);
    return () => {
      if (metadataSaveTimer.current) {
        clearTimeout(metadataSaveTimer.current);
      }
    };
  }, [
    draftDescription,
    draftValueLabels,
    dataSource,
    editColumnMetadata,
    saveMetadata,
  ]);

  const handleClose = useCallback(() => {
    if (metadataSaveTimer.current) {
      clearTimeout(metadataSaveTimer.current);
      metadataSaveTimer.current = null;
    }
    const { description: lastDesc, valueLabels: lastLabels } =
      lastSavedRef.current;
    if (
      draftDescription !== lastDesc ||
      JSON.stringify(draftValueLabels) !== JSON.stringify(lastLabels)
    ) {
      saveMetadata();
    }
    setEditColumnMetadata(null);
  }, [setEditColumnMetadata, draftDescription, draftValueLabels, saveMetadata]);

  const isOpen = editColumnMetadata !== null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      {isOpen && (
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {editColumnMetadata.fields.description ? (
                  <>
                    Metadata for <span className="font-mono">{columnName}</span>
                  </>
                ) : (
                  <>
                    Display values for{" "}
                    <span className="font-mono">{columnName}</span>
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {fieldsToDescription(editColumnMetadata.fields)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              {editColumnMetadata.fields.description && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    placeholder="Column description"
                  />
                </div>
              )}
              {editColumnMetadata.fields.valueLabels && (
                <ValueLabelsSection
                  values={mergedValues}
                  columnType={columnType}
                  valueLabels={draftValueLabels}
                  onChange={(value, label) => {
                    setDraftValueLabels((prev) => {
                      if (label) return { ...prev, [value]: label };
                      return Object.fromEntries(
                        Object.entries(prev).filter(([k]) => k !== value),
                      );
                    });
                  }}
                />
              )}
              {editColumnMetadata.fields.valueColors && (
                <ColorMappingsSection
                  dataSourceId={dataSourceId}
                  columnName={columnName}
                  mergedValues={mergedValues}
                  existingMeta={existingMeta}
                  ownerMeta={ownerMeta}
                  isOwner={isOwner}
                  organisationId={organisationId}
                />
              )}
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

const fieldsToDescription = (fields: EditColumnMetadataFields): string => {
  const labels: Record<keyof EditColumnMetadataFields, string> = {
    description: "description",
    valueLabels: "display values",
    valueColors: "colours",
  };
  const keys = Object.keys(fields) as (keyof EditColumnMetadataFields)[];
  const parts = keys.filter((f) => fields[f]).map((f) => labels[f]);
  if (!parts.length) {
    return "Configure this column.";
  }
  let listStr = "";
  if (parts.length === 1) {
    listStr = parts[0];
  } else {
    const last = parts.pop();
    listStr = parts.join(", ") + " and " + last;
  }
  return `Configure ${listStr} for this column.`;
};
