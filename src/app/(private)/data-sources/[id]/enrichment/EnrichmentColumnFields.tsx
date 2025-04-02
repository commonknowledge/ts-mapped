import { Select } from "@radix-ui/react-select";
import { DataSourceEnrichmentQuery } from "@/__generated__/types";
import DataListRow from "@/components/DataListRow";
import { AreaSetCodeLabels, EnrichmentSourceTypeLabels } from "@/labels";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { AreaSetCode, EnrichmentSourceType } from "@/types";
import { EnrichmentColumn } from "@/zod";

export type NewEnrichmentColumn = EnrichmentColumn | { sourceType: "" };
export default function EnrichmentColumnFields({
  column,
  dataSources,
  onChange,
}: {
  column: NewEnrichmentColumn;
  dataSources: DataSourceEnrichmentQuery["dataSources"];
  onChange: (column: Partial<EnrichmentColumn>) => void;
}) {
  const dataSource = dataSources.find(
    (dataSource) =>
      column.sourceType === EnrichmentSourceType.DataSource &&
      dataSource.id === column.dataSourceId,
  );
  const dataSourceColumns = dataSource?.columnDefs || [];

  return (
    <>
      <DataListRow label="Source type">
        <Select
          value={column?.sourceType || ""}
          onValueChange={(sourceType) =>
            onChange({ sourceType } as { sourceType: EnrichmentSourceType })
          }
        >
          <SelectTrigger className="w-[360px]">
            <SelectValue placeholder="Choose a source type" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(EnrichmentSourceTypeLabels).map((sourceType) => {
              return (
                <SelectItem key={sourceType} value={sourceType}>
                  {
                    EnrichmentSourceTypeLabels[
                      sourceType as EnrichmentSourceType
                    ]
                  }
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </DataListRow>
      {column.sourceType === EnrichmentSourceType.Area && (
        <>
          <DataListRow label="Area type">
            <Select
              value={column.areaSetCode}
              onValueChange={(areaSetCode) =>
                onChange({ areaSetCode } as { areaSetCode: AreaSetCode })
              }
            >
              <SelectTrigger className="w-[360px]">
                <SelectValue placeholder="What kind of area is this?" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(AreaSetCodeLabels).map((type) => (
                  <SelectItem key={type} value={type}>
                    {AreaSetCodeLabels[type as AreaSetCode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DataListRow>
          <DataListRow label="Area property">
            <Select
              value={column.areaProperty}
              onValueChange={(areaProperty) =>
                onChange({ areaProperty } as { areaProperty: "code" | "name" })
              }
            >
              <SelectTrigger className="w-[360px]">
                <SelectValue placeholder="What data do you want to save?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">
                  {'The area name (e.g. "Islington north")'}
                </SelectItem>
                <SelectItem value="code">
                  {'The area code (e.g. "E14001305")'}
                </SelectItem>
              </SelectContent>
            </Select>
          </DataListRow>
        </>
      )}
      {column.sourceType === EnrichmentSourceType.DataSource && (
        <>
          <DataListRow label="Data source">
            <Select
              value={column.dataSourceId}
              onValueChange={(dataSourceId) => onChange({ dataSourceId })}
            >
              <SelectTrigger className="w-[360px]">
                <SelectValue placeholder="Select a data source" />
              </SelectTrigger>
              <SelectContent>
                {dataSources.map((dataSource) => (
                  <SelectItem key={dataSource.id} value={dataSource.id}>
                    {dataSource.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DataListRow>
          <DataListRow label="Data source">
            <Select
              value={column.dataSourceColumn}
              onValueChange={(dataSourceColumn) =>
                onChange({ dataSourceColumn })
              }
            >
              <SelectTrigger className="w-[360px]">
                <SelectValue placeholder="Select a data source" />
              </SelectTrigger>
              <SelectContent>
                {dataSourceColumns.map((column) => (
                  <SelectItem key={column.name} value={column.name}>
                    {column.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DataListRow>
        </>
      )}
    </>
  );
}
