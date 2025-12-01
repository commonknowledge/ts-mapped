import { Check, X } from "lucide-react";
import { Fragment, useContext, useEffect, useMemo, useState } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { publicMapColorSchemes } from "@/app/map/[id]/styles";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PublicMapColumnType } from "@/server/models/PublicMap";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { cn } from "@/shadcn/utils";
import { PublicMapContext } from "../context/PublicMapContext";
import { usePublicDataRecordsQueries } from "../hooks/usePublicDataRecordsQueries";
import { groupRecords, jsonToAirtablePrefill, toBoolean } from "../utils";
import EditablePublicMapProperty from "./editable/EditablePublicMapProperty";

export default function DataRecordSidebar() {
  const isMobile = useIsMobile();
  const { selectedRecords, setSelectedRecordIndex, resetInspector } =
    useContext(InspectorContext);
  const { publicMap, colorScheme } = useContext(PublicMapContext);
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

  // Update the selected record in context so the list
  // sidebar can scroll to the correct record
  useEffect(() => {
    if (selectedRecordDetails) {
      const recordIndex = selectedRecords.findIndex(
        (r) => r.id === selectedRecordDetails.id,
      );
      if (recordIndex !== undefined) {
        setSelectedRecordIndex(recordIndex);
        return;
      }
    }
    // Reset to record 0 if selectedRecord not found
    setSelectedRecordIndex(0);
  }, [selectedRecordDetails, selectedRecords, setSelectedRecordIndex]);

  if (!recordGroup || !selectedRecordDetails || !publicMap) {
    return <></>;
  }

  const description = String(
    selectedRecordDetails.json[dataSourceConfig?.descriptionColumn || ""] || "",
  );
  const additionalColumns = dataSourceConfig?.additionalColumns || [];

  return (
    <div
      className={cn(
        "flex flex-col justify-between h-full overflow-auto md:w-[280px] p-4 text-sm",
        isMobile ? "absolute left-0 top-0 w-full h-full" : "",
      )}
      style={{ backgroundColor: activeColorScheme.primaryMuted }}
    >
      <div className={"flex flex-col gap-4"}>
        {isMobile && (
          <Button
            type="button"
            variant="link"
            className="p-0 mr-auto h-4"
            onClick={() => {
              resetInspector();
            }}
          >
            &lt; Back
          </Button>
        )}
        {/* Name */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center">
            <div className="flex flex-col mr-auto">
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
            {recordGroups.length > 1 && (
              <div className="flex gap-1">
                <Button
                  type="button"
                  className="p-0"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setGroupIndex(groupIndex - 1);
                    setChildIndex(0);
                  }}
                  disabled={groupIndex <= 0}
                >
                  &lt;
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setGroupIndex(groupIndex + 1);
                    setChildIndex(0);
                  }}
                  disabled={groupIndex >= recordGroups.length - 1}
                >
                  &gt;
                </Button>
              </div>
            )}
          </div>
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
          <Separator />
        </div>

        {additionalColumns.map((columnConfig, i) => (
          <Fragment key={i}>
            {columnConfig.type === PublicMapColumnType.Boolean ? (
              <CheckList
                dataSourceConfig={dataSourceConfig}
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

        {recordGroup.children.length > 1 && (
          <div className="flex gap-1 justify-center">
            <Button
              type="button"
              className="p-0"
              variant="outline"
              size="icon"
              onClick={() => {
                setChildIndex(childIndex - 1);
              }}
              disabled={childIndex <= 0}
            >
              &lt;
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setChildIndex(childIndex + 1);
              }}
              disabled={childIndex >= recordGroup.children.length - 1}
            >
              &gt;
            </Button>
          </div>
        )}
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
              {dataSourceConfig.editFormButtonText || "Submit an edit"}
            </a>
          </Button>
        )}
    </div>
  );
}

function CheckList({
  dataSourceConfig,
  sourceColumns,
  json,
}: {
  dataSourceConfig:
    | {
        positiveTooltip?: string;
        negativeTooltip?: string;
        unknownTooltip?: string;
      }
    | undefined;
  sourceColumns: string[];
  json: Record<string, unknown>;
}) {
  return (
    <>
      {sourceColumns.map((column) => (
        <div key={column} className="flex items-center gap-2">
          {String(json[column]).toLowerCase() === "unknown" ? (
            dataSourceConfig?.unknownTooltip ? (
              <Tooltip>
                <TooltipTrigger>
                  <div className="w-4 h-5 text-center font-semibold">?</div>
                </TooltipTrigger>
                <TooltipContent>
                  {dataSourceConfig?.unknownTooltip}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="w-4 h-5 text-center font-semibold">?</div>
            )
          ) : toBoolean(json[column]) ? (
            dataSourceConfig?.positiveTooltip ? (
              <Tooltip>
                <TooltipTrigger>
                  <Check className="w-4 h-4" />
                </TooltipTrigger>
                <TooltipContent>
                  {dataSourceConfig?.positiveTooltip}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Check className="w-4 h-4" />
            )
          ) : dataSourceConfig?.negativeTooltip ? (
            <Tooltip>
              <TooltipTrigger>
                <X className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent>
                {dataSourceConfig?.negativeTooltip}
              </TooltipContent>
            </Tooltip>
          ) : (
            <X className="w-4 h-4" />
          )}
          <div>{column}</div>
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
