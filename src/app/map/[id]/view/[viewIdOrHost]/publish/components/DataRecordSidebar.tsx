import { Check, X } from "lucide-react";
import { Fragment, useContext, useEffect, useMemo, useState } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { publicMapColorSchemes } from "@/app/map/[id]/styles";
import { PublicMapColumnType } from "@/server/models/PublicMap";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { cn } from "@/shadcn/utils";
import { PublicMapContext } from "../context/PublicMapContext";
import { usePublicDataRecordsQueries } from "../hooks/usePublicDataRecordsQueries";
import { groupRecords, jsonToAirtablePrefill, toBoolean } from "../utils";
import EditablePublicMapProperty from "./editable/EditablePublicMapProperty";

export default function DataRecordSidebar() {
  const { selectedRecords } = useContext(InspectorContext);
  const { publicMap, colorScheme, setSelectedRecordGroupId } =
    useContext(PublicMapContext);
  const dataRecordsQueries = usePublicDataRecordsQueries();
  const [groupIndex, setGroupIndex] = useState(0);
  const [childIndex, setChildIndex] = useState(0);

  const activeColorScheme =
    publicMapColorSchemes[colorScheme] || publicMapColorSchemes.red;

  const selectedRecordsDetails = useMemo(() => {
    if (!selectedRecords.length) {
      return [];
    }
    const dataRecordsQuery =
      dataRecordsQueries[selectedRecords[0].dataSourceId];
    const records = dataRecordsQuery?.data?.records;
    return selectedRecords
      .map((record) => records?.find((r) => r.id === record.id))
      .filter((r) => r !== undefined);
  }, [dataRecordsQueries, selectedRecords]);

  const dataSourceConfig = publicMap?.dataSourceConfigs.find(
    (dsc) => dsc.dataSourceId === selectedRecords[0]?.dataSourceId,
  );

  const recordGroups = useMemo(() => {
    return groupRecords(dataSourceConfig, selectedRecordsDetails);
  }, [dataSourceConfig, selectedRecordsDetails]);

  const recordGroup = recordGroups[groupIndex];
  const selectedRecordDetails = recordGroup?.children[childIndex];

  // Reset indices when selectedRecords changes
  useEffect(() => {
    setGroupIndex(0);
    setChildIndex(0);
  }, [selectedRecords]);

  // Update the selected record group in context so the list
  // sidebar can scroll to the correct record
  useEffect(() => {
    if (recordGroup) {
      setSelectedRecordGroupId(recordGroup.id);
    }
  }, [recordGroup, setSelectedRecordGroupId]);

  if (!recordGroup || !selectedRecordDetails || !publicMap) {
    return <></>;
  }

  const description = String(
    selectedRecordDetails.json[dataSourceConfig?.descriptionColumn || ""] || "",
  );
  const additionalColumns = dataSourceConfig?.additionalColumns || [];

  return (
    <div
      className="flex flex-col justify-between h-[100vh] overflow-auto w-[280px] p-4 text-sm"
      style={{ backgroundColor: activeColorScheme.primaryMuted }}
    >
      <div className={cn("flex flex-col gap-4")}>
        {/* Name */}
        <div className="flex flex-col gap-4">
          <div className="flex mr-auto">
            <div className="flex flex-col">
              <EditablePublicMapProperty
                dataSourceProperty={{
                  dataSourceId: selectedRecordDetails.dataSourceId,
                  property: "nameLabel",
                }}
                placeholder="Name label"
              >
                <span className="text-muted-foreground">
                  {dataSourceConfig?.nameLabel || "Name"}
                </span>
              </EditablePublicMapProperty>
              <span className="text-lg font-semibold">{recordGroup.name}</span>
            </div>
            <div className="flex">
              <button
                type="button"
                onClick={() => {
                  setGroupIndex(groupIndex - 1);
                  setChildIndex(0);
                }}
                disabled={groupIndex <= 0}
              >
                &lt;
              </button>
              <button
                type="button"
                onClick={() => {
                  setGroupIndex(groupIndex + 1);
                  setChildIndex(0);
                }}
                disabled={groupIndex >= recordGroups.length - 1}
              >
                &gt;
              </button>
            </div>
          </div>
          <div className="flex mr-auto">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col ">
                <EditablePublicMapProperty
                  dataSourceProperty={{
                    dataSourceId: selectedRecordDetails.dataSourceId,
                    property: "descriptionLabel",
                  }}
                  placeholder="Description label"
                >
                  <span className="text-muted-foreground">
                    {dataSourceConfig?.descriptionLabel ||
                      dataSourceConfig?.descriptionColumn ||
                      "Description"}
                  </span>
                </EditablePublicMapProperty>
                <p>
                  {description && description !== recordGroup.name
                    ? description
                    : "–"}
                </p>
              </div>
            </div>
            <div className="flex">
              <button
                type="button"
                onClick={() => {
                  setChildIndex(childIndex - 1);
                }}
                disabled={childIndex <= 0}
              >
                &lt;
              </button>
              <button
                type="button"
                onClick={() => {
                  setChildIndex(childIndex + 1);
                }}
                disabled={childIndex >= recordGroup.children.length - 1}
              >
                &gt;
              </button>
            </div>
          </div>
          <Separator />
        </div>

        {additionalColumns.map((columnConfig, i) => (
          <Fragment key={i}>
            {columnConfig.type === PublicMapColumnType.Boolean ? (
              <CheckList
                sourceColumns={columnConfig.sourceColumns}
                json={selectedRecordDetails.json}
              />
            ) : columnConfig.type === PublicMapColumnType.CommaSeparatedList ? (
              <div className="flex flex-col gap-1">
                <EditablePublicMapProperty
                  additionalColumnProperty={{
                    columnIndex: i,
                    dataSourceId: selectedRecordDetails.dataSourceId,
                    property: "label",
                  }}
                  placeholder="Label"
                >
                  <span className="text-muted-foreground">
                    {columnConfig.label}
                  </span>
                </EditablePublicMapProperty>
                <CommaSeparatedList
                  sourceColumns={columnConfig.sourceColumns}
                  json={selectedRecordDetails.json}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <EditablePublicMapProperty
                  additionalColumnProperty={{
                    columnIndex: i,
                    dataSourceId: selectedRecordDetails.dataSourceId,
                    property: "label",
                  }}
                  placeholder="Label"
                >
                  <span className="text-muted-foreground">
                    {columnConfig.label}
                  </span>
                </EditablePublicMapProperty>
                <span>
                  {columnConfig.sourceColumns
                    .map((c) => selectedRecordDetails.json[c])
                    .filter(Boolean)
                    .join(", ") || "–"}
                </span>
              </div>
            )}
          </Fragment>
        ))}
      </div>
      {dataSourceConfig &&
        dataSourceConfig.editFormUrl &&
        dataSourceConfig.allowUserEdit && (
          <Button asChild={true} className="mt-6">
            <a
              target="_blank"
              href={`${dataSourceConfig.editFormUrl}${jsonToAirtablePrefill(
                selectedRecordDetails.json,
              )}`}
            >
              Submit an edit
            </a>
          </Button>
        )}
    </div>
  );
}

function CheckList({
  sourceColumns,
  json,
}: {
  sourceColumns: string[];
  json: Record<string, unknown>;
}) {
  return (
    <>
      {sourceColumns.map((column) => (
        <div key={column} className="flex items-center gap-2">
          <div className="col-span-1">
            {String(json[column]).toLowerCase() === "unknown" ? (
              <div className="w-4 h-4 text-center font-semibold">?</div>
            ) : toBoolean(json[column]) ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </div>
          <div className="col-span-5">{column}</div>
        </div>
      ))}
    </>
  );
}

function CommaSeparatedList({
  sourceColumns,
  json,
}: {
  sourceColumns: string[];
  json: Record<string, unknown>;
}) {
  const values = sourceColumns
    .flatMap((c) =>
      String(json[c] || "")
        .split(",")
        .map((s) => s.trim()),
    )
    .filter((v) => Boolean(v));

  if (!values?.length) {
    return <p>–</p>;
  }

  return (
    <div>
      {values.map((v) => (
        <span className="inline-block rounded-2xl bg-accent mr-2 p-2" key={v}>
          {v}
        </span>
      ))}
    </div>
  );
}
