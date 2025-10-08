import { Check, X } from "lucide-react";
import { useContext, useMemo } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { cn } from "@/shadcn/utils";
import { PublicMapContext } from "../context/PublicMapContext";
import { buildName, jsonToAirtablePrefill, toBoolean } from "../utils";
import EditablePublicMapProperty from "./editable/EditablePublicMapProperty";

export default function DataRecordSidebar() {
  const { selectedRecord } = useContext(InspectorContext);
  const { dataRecordsQueries, publicMap } = useContext(PublicMapContext);
  const selectedRecordDetails = useMemo(() => {
    if (!selectedRecord) {
      return null;
    }
    const dataRecordsQuery = dataRecordsQueries[selectedRecord.dataSourceId];
    return dataRecordsQuery.data?.records?.find(
      (r) => r.id === selectedRecord.id,
    );
  }, [dataRecordsQueries, selectedRecord]);

  if (!selectedRecord || !selectedRecordDetails || !publicMap) {
    return null;
  }

  const dataSourceConfig = publicMap.dataSourceConfigs.find(
    (dsc) => dsc.dataSourceId === selectedRecord?.dataSourceId,
  );

  const name = buildName(
    dataSourceConfig?.nameColumns || [],
    selectedRecordDetails.json,
  );
  const description = String(
    selectedRecordDetails.json[dataSourceConfig?.descriptionColumn || ""] || "",
  );
  const additionalColumns = dataSourceConfig?.additionalColumns || [];

  return (
    <div className="flex flex-col justify-between h-full w-[280px] p-4">
      <div className={cn("flex flex-col gap-4")}>
        {/* Name */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <EditablePublicMapProperty
              dataSourceProperty={{
                dataSourceId: selectedRecord.dataSourceId,
                property: "nameLabel",
              }}
              placeholder="Name label"
            >
              <span className="text-sm ">
                {dataSourceConfig?.nameLabel || "Name"}
              </span>
            </EditablePublicMapProperty>
            <span className="text-xl font-semibold">{name}</span>
          </div>
          <div className="flex flex-col gap-2">
            {description && (
              <div className="flex flex-col ">
                <EditablePublicMapProperty
                  dataSourceProperty={{
                    dataSourceId: selectedRecord.dataSourceId,
                    property: "descriptionLabel",
                  }}
                  placeholder="Description label"
                >
                  <span className="text-sm">
                    {dataSourceConfig?.descriptionLabel ||
                      dataSourceConfig?.descriptionColumn ||
                      "Description"}
                  </span>
                </EditablePublicMapProperty>
                <span className="text-lg">{description}</span>
              </div>
            )}
          </div>
          <Separator />
        </div>

        {additionalColumns.map((columnConfig, i) => (
          <div key={i} className="flex flex-col ">
            {columnConfig.type !== PublicMapColumnType.Boolean && (
              <EditablePublicMapProperty
                additionalColumnProperty={{
                  columnIndex: i,
                  dataSourceId: selectedRecord.dataSourceId,
                  property: "label",
                }}
                placeholder="Label"
              >
                <span className="text-sm">{columnConfig.label}</span>
              </EditablePublicMapProperty>
            )}
            {columnConfig.type === PublicMapColumnType.Boolean ? (
              <CheckList
                sourceColumns={columnConfig.sourceColumns}
                json={selectedRecordDetails.json}
              />
            ) : columnConfig.type === PublicMapColumnType.CommaSeparatedList ? (
              <CommaSeparatedList
                sourceColumns={columnConfig.sourceColumns}
                json={selectedRecordDetails.json}
              />
            ) : (
              <span className="text-lg">
                {columnConfig.sourceColumns
                  .map((c) => selectedRecordDetails.json[c])
                  .filter(Boolean)
                  .join(", ")}
              </span>
            )}
          </div>
        ))}
      </div>
      {dataSourceConfig &&
        dataSourceConfig.formUrl &&
        dataSourceConfig.allowUserEdit && (
          <Button asChild={true}>
            <a
              target="_blank"
              href={`${dataSourceConfig.formUrl}${jsonToAirtablePrefill(
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
    <div className="grid grid-cols-6 gap-2">
      {sourceColumns.map((column) => (
        <div key={column} className="flex items-center gap-2">
          <div className="col-span-1">
            {toBoolean(json[column]) ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </div>
          <div className="col-span-5">{column}</div>
        </div>
      ))}
    </div>
  );
}

function CommaSeparatedList({
  sourceColumns,
  json,
}: {
  sourceColumns: string[];
  json: Record<string, unknown>;
}) {
  const values = sourceColumns.flatMap((c) =>
    String(json[c] || "")
      .split(",")
      .map((s) => s.trim()),
  );

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
