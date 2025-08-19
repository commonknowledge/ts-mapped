import { Check, X } from "lucide-react";
import { Fragment, useContext, useMemo } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import ColumnsMultiSelect from "@/components/ColumnsMultiSelect";
import { DataRecordContext } from "@/components/Map/context/DataRecordContext";
import { DataSourcesContext } from "@/components/Map/context/DataSourcesContext";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { Button } from "@/shadcn/ui/button";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";
import EditablePublicMapProperty from "./EditablePublicMapProperty";
import { buildName } from "./utils";

export default function DataRecordSidebar() {
  const { selectedDataRecord } = useContext(DataRecordContext);
  const { getDataSourceById } = useContext(DataSourcesContext);
  const {
    dataRecordsQueries,
    publicMap,
    editable,
    updateDataSourceConfig,
    updateAdditionalColumn,
  } = useContext(PublicMapContext);
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

  const dataSource = dataSourceConfig
    ? getDataSourceById(dataSourceConfig.dataSourceId)
    : null;

  const name = buildName(
    dataSourceConfig?.nameColumns || [],
    selectedDataRecordDetails.json,
  );
  const description =
    selectedDataRecordDetails.json[dataSourceConfig?.descriptionColumn || ""];
  const additionalColumns = dataSourceConfig?.additionalColumns || [];

  return (
    <div
      className={cn(
        "flex flex-col gap-4 py-2 px-4 w-[280px]",
        editable ? "gap-8" : "",
      )}
    >
      {/* Name */}
      <div className="flex flex-col gap-2">
        <EditablePublicMapProperty
          dataSourceProperty={{
            dataSourceId: selectedDataRecord.dataSourceId,
            property: "nameLabel",
          }}
          placeholder="Name label"
        >
          <span className="font-medium text-lg">
            {dataSourceConfig?.nameLabel || "Name"}
          </span>
        </EditablePublicMapProperty>
        {editable && dataSourceConfig && (
          <div className="flex flex-col gap-1">
            <Label>Name columns</Label>
            <ColumnsMultiSelect
              buttonClassName="mr-auto"
              columns={dataSourceConfig.nameColumns || []}
              columnDefs={dataSource?.columnDefs || []}
              onChange={(columns) =>
                updateDataSourceConfig(dataSourceConfig.dataSourceId, {
                  nameColumns: columns,
                })
              }
            />
          </div>
        )}
        <span>{name}</span>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        {editable && dataSourceConfig && (
          <div className="flex flex-col gap-1">
            <Label>Description/subtitle column</Label>
            <Select
              value={dataSourceConfig.descriptionColumn || "__none"}
              onValueChange={(descriptionColumn) =>
                updateDataSourceConfig(dataSourceConfig.dataSourceId, {
                  descriptionColumn:
                    descriptionColumn === "__none" ? "" : descriptionColumn,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a description column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">None</SelectItem>
                {dataSource?.columnDefs.map((cd) => (
                  <SelectItem key={cd.name} value={cd.name}>
                    {cd.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {description && (
          <div className="flex flex-col gap-2">
            <EditablePublicMapProperty
              dataSourceProperty={{
                dataSourceId: selectedDataRecord.dataSourceId,
                property: "descriptionLabel",
              }}
              placeholder="Description label"
            >
              <span className="font-medium">
                {dataSourceConfig?.descriptionLabel ||
                  dataSourceConfig?.descriptionColumn ||
                  "Description"}
              </span>
            </EditablePublicMapProperty>
            <span>{description}</span>
          </div>
        )}
      </div>

      {additionalColumns.map((columnConfig, i) => (
        <div key={i} className="flex flex-col gap-2">
          {editable && dataSourceConfig && (
            <>
              <div className="flex flex-col gap-1">
                <Label>Source columns</Label>
                <ColumnsMultiSelect
                  buttonClassName="mr-auto"
                  columns={columnConfig.sourceColumns || []}
                  columnDefs={dataSource?.columnDefs || []}
                  onChange={(columns) =>
                    updateAdditionalColumn(dataSourceConfig.dataSourceId, i, {
                      sourceColumns: columns,
                    })
                  }
                />
              </div>
              <Select
                value={columnConfig.type}
                onValueChange={(type) =>
                  updateAdditionalColumn(dataSourceConfig.dataSourceId, i, {
                    type: type as PublicMapColumnType,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a data type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PublicMapColumnType.String}>
                    Text
                  </SelectItem>
                  <SelectItem value={PublicMapColumnType.Boolean}>
                    True/false
                  </SelectItem>
                  <SelectItem value={PublicMapColumnType.CommaSeparatedList}>
                    Comma-separated list
                  </SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
          <EditablePublicMapProperty
            additionalColumnProperty={{
              columnIndex: i,
              dataSourceId: selectedDataRecord.dataSourceId,
              property: "label",
            }}
            placeholder="Label"
          >
            <span className="font-medium">{columnConfig.label}</span>
          </EditablePublicMapProperty>
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
            <span>
              {columnConfig.sourceColumns
                .map((c) => selectedDataRecordDetails.json[c])
                .filter(Boolean)
                .join(", ")}
            </span>
          )}
        </div>
      ))}
      {editable && dataSourceConfig && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            updateDataSourceConfig(dataSourceConfig.dataSourceId, {
              additionalColumns: [
                ...dataSourceConfig.additionalColumns,
                {
                  label: "New row",
                  sourceColumns: [],
                  type: PublicMapColumnType.String,
                },
              ],
            });
          }}
        >
          Add additional information
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
  const toBoolean = (val: unknown): boolean => {
    if (!val) {
      return false;
    }
    if (["false", "0", "no"].includes(String(val).toLowerCase())) {
      return false;
    }
    return Boolean(val);
  };

  return (
    <div className="grid grid-cols-6 gap-2">
      {sourceColumns.map((column) => (
        <Fragment key={column}>
          <div className="col-span-1">
            {toBoolean(json[column]) ? <Check /> : <X />}
          </div>
          <div className="col-span-5">{column}</div>
        </Fragment>
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
