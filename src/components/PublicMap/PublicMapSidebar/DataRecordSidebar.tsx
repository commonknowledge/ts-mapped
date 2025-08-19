import { Check, X } from "lucide-react";
import { Fragment, useContext, useMemo } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import { DataRecordContext } from "@/components/Map/context/DataRecordContext";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { buildName } from "./utils";

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
      (r) => r.id === selectedDataRecord.id
    );
  }, [dataRecordsQueries, selectedDataRecord]);

  if (!selectedDataRecordDetails || !publicMap) {
    return null;
  }

  const dataSourceConfig = publicMap.dataSourceConfigs.find(
    (dsc) => dsc.dataSourceId === selectedDataRecord?.dataSourceId
  );

  const name = buildName(
    dataSourceConfig?.nameColumns || [],
    selectedDataRecordDetails.json
  );
  const description =
    selectedDataRecordDetails.json[dataSourceConfig?.descriptionColumn || ""];
  const additionalColumns = dataSourceConfig?.additionalColumns || [];

  return (
    <div className="flex flex-col gap-4 py-2 px-4 w-[280px]">
      <div className="flex flex-col gap-2">
        <span className="font-medium text-lg">
          {dataSourceConfig?.nameLabel || "Name"}
        </span>
        <span>{name}</span>
      </div>
      {description && (
        <div className="flex flex-col gap-2">
          <span className="font-medium">
            {dataSourceConfig?.descriptionLabel || "Description"}
          </span>
          <span>{description}</span>
        </div>
      )}
      {additionalColumns.map((columnConfig, i) => (
        <div key={i} className="flex flex-col gap-2">
          <span className="font-medium">{columnConfig.label}</span>
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
      .map((s) => s.trim())
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
