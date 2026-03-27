import TogglePanel from "@/app/(private)/map/[id]/components/TogglePanel";
import { buildName } from "@/utils/dataRecord";
import { ConfiguredRecordProperties } from "./ConfiguredRecordProperties";
import type { ColumnMetadata, DataSource } from "@/models/DataSource";
import type { InspectorDataSourceConfig } from "@/models/MapView";

interface DataRecord {
  id: string;
  externalId: string;
  json: Record<string, unknown>;
}

export default function ConfiguredRecordsList({
  records,
  dataSource,
  inspectorConfig,
  resolvedMetadata,
}: {
  records: DataRecord[];
  dataSource: DataSource | null | undefined;
  inspectorConfig: InspectorDataSourceConfig;
  resolvedMetadata: ColumnMetadata[];
}) {
  if (!records.length) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        <p className="text-sm">No data</p>
      </div>
    );
  }

  if (records.length === 1) {
    return (
      <div>
        <ConfiguredRecordProperties
          json={records[0].json}
          inspectorConfig={inspectorConfig}
          resolvedMetadata={resolvedMetadata}
          columnDefs={dataSource?.columnDefs}
          dataSourceId={dataSource?.id}
        />
      </div>
    );
  }

  return (
    <ul className="ml-2">
      {records.map((record, i) => (
        <li key={record.id}>
          <TogglePanel
            label={buildName(dataSource, record)}
            defaultExpanded={i === 0}
          >
            <ConfiguredRecordProperties
              json={record.json}
              inspectorConfig={inspectorConfig}
              resolvedMetadata={resolvedMetadata}
              columnDefs={dataSource?.columnDefs}
              dataSourceId={dataSource?.id}
            />
          </TogglePanel>
        </li>
      ))}
    </ul>
  );
}
