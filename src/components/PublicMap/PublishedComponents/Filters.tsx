"use client";

import { useContext, useEffect, useState } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { Button } from "@/shadcn/ui/button";

interface FilterField {
  name: string;
  type: PublicMapColumnType;
  options?: string[];
}

export default function Filters() {
  const { publicMap, activeTabId, dataRecordsQueries } =
    useContext(PublicMapContext);
  const [filterFields, setFilterFields] = useState<FilterField[]>([]);

  useEffect(() => {
    if (!publicMap) {
      return;
    }

    const dataSourceConfig = activeTabId
      ? publicMap.dataSourceConfigs.find((c) => c.dataSourceId === activeTabId)
      : publicMap.dataSourceConfigs[0];

    if (dataSourceConfig) {
      const columns = dataSourceConfig.nameColumns.concat([
        dataSourceConfig.descriptionColumn,
      ]);

      const typedColumns = columns
        .filter((col) => !!col)
        .map((name) => ({
          name,
          type: PublicMapColumnType.String,
        }));

      for (const additionalColumn of dataSourceConfig.additionalColumns) {
        for (const sourceColumn of additionalColumn.sourceColumns) {
          typedColumns.push({
            name: sourceColumn,
            type: additionalColumn.type,
          });
        }
      }

      const fields = typedColumns.map((col) => {
        if (col.type === PublicMapColumnType.CommaSeparatedList) {
          const records =
            dataRecordsQueries?.[dataSourceConfig?.dataSourceId]?.data
              ?.dataSource?.records;

          if (!records?.length) {
            return col;
          }

          const allValues = records
            .map((record) => record.json[col.name])
            .filter(Boolean) // remove null
            .flatMap((item: string) =>
              item.split(",").map((s: string) => s.trim())
            ); // split and trim;

          const uniqueValues = [...new Set(allValues)].sort((a, b) =>
            a.localeCompare(b)
          );

          return {
            ...col,
            options: uniqueValues,
          };
        }

        return col;
      });

      setFilterFields(fields);
    }
  }, [publicMap, activeTabId, dataRecordsQueries]);

  return (
    <div className="my-4 px-4">
      <Button variant="outline" onClick={() => console.log(filterFields)}>
        Log filters
      </Button>
    </div>
  );
}
