import { Check, X } from "lucide-react";
import { useContext, useMemo } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import { DataRecordContext } from "@/components/Map/context/DataRecordContext";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { Separator } from "@/shadcn/ui/separator";
import { cn } from "@/shadcn/utils";
import EditablePublicMapProperty from "../EditorComponents/EditablePublicMapProperty";
import { buildName, toBoolean } from "./utils";

export default function DataRecordSidebar() {
  const { selectedDataRecord } = useContext(DataRecordContext);
  const { dataRecordsQueries, publicMap } = useContext(PublicMapContext);
  const selectedDataRecordDetails = useMemo(() => {
    if (!selectedDataRecord) {
      return null;
    }
    const dataRecordsQuery =
      dataRecordsQueries[selectedDataRecord.dataSourceId];
    return dataRecordsQuery.data?.dataSource?.records?.find(
      (r) => r.id === selectedDataRecord.id,
    );
  }, [dataRecordsQueries, selectedDataRecord]);

  if (!selectedDataRecord || !selectedDataRecordDetails || !publicMap) {
    return null;
  }

  const dataSourceConfig = publicMap.dataSourceConfigs.find(
    (dsc) => dsc.dataSourceId === selectedDataRecord?.dataSourceId,
  );

  const name = buildName(
    dataSourceConfig?.nameColumns || [],
    selectedDataRecordDetails.json,
  );
  const description =
    selectedDataRecordDetails.json[dataSourceConfig?.descriptionColumn || ""];

  const additionalColumns = dataSourceConfig?.additionalColumns || [];

  return (
    <div className={cn("flex flex-col gap-4 p-4 w-[280px] ")}>
      {/* Name */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <EditablePublicMapProperty
            dataSourceProperty={{
              dataSourceId: selectedDataRecord.dataSourceId,
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
                  dataSourceId: selectedDataRecord.dataSourceId,
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
                dataSourceId: selectedDataRecord.dataSourceId,
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
              json={selectedDataRecordDetails.json}
            />
          ) : columnConfig.type === PublicMapColumnType.CommaSeparatedList ? (
            <CommaSeparatedList
              sourceColumns={columnConfig.sourceColumns}
              json={selectedDataRecordDetails.json}
            />
          ) : (
            <span className="text-lg">
              {columnConfig.sourceColumns
                .map((c) => selectedDataRecordDetails.json[c])
                .filter(Boolean)
                .join(", ")}
            </span>
          )}
        </div>
      ))}
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
