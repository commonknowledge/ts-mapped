"use client";

import { useContext, useEffect, useState } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { Separator } from "@/shadcn/ui/separator";
import { Switch } from "@/shadcn/ui/switch";

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
      <Dialog>
        <DialogTrigger>
          <Button variant="outline" asChild={true}>
            <span>Open filters</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter</DialogTitle>
            <Separator className="my-4" />
            <form
              className="flex flex-col gap-6"
              onSubmit={(e) => e.preventDefault()}
            >
              {filterFields.map((field) => (
                <div key={field.name}>
                  <label className="block mb-2">{field.name}</label>
                  {field.type === PublicMapColumnType.String ? (
                    <input className="border" type="text" />
                  ) : field.type === PublicMapColumnType.Boolean ? (
                    <Switch />
                  ) : field?.options?.length ? (
                    <select>
                      <option value="">--Please choose an option--</option>
                      {field.options.map((o) => (
                        <option value={o} key={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <></>
                  )}
                </div>
              ))}
              <Button type="submit">Filter</Button>
            </form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
