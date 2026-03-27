import TogglePanel from "@/app/(private)/map/[id]/components/TogglePanel";
import { useDataSources } from "@/hooks/useDataSources";
import { buildName } from "@/utils/dataRecord";
import { ConfiguredRecordProperties } from "./ConfiguredRecordProperties";

interface DataRecord {
  id: string;
  externalId: string;
  json: Record<string, unknown>;
}

export default function ConfiguredRecordsList({
  dataSourceId,
  records,
}: {
  dataSourceId: string;
  records: DataRecord[];
}) {
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);

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
          dataSourceId={dataSourceId}
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
              dataSourceId={dataSourceId}
            />
          </TogglePanel>
        </li>
      ))}
    </ul>
  );
}
