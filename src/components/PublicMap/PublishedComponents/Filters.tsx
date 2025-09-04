"use client";

import { ListFilter } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import { PublicFiltersContext } from "@/components/PublicMap/context/PublicFiltersContext";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { Separator } from "@/shadcn/ui/separator";
import FiltersForm from "./FiltersForm";
import type { FilterField } from "@/types";

export default function Filters() {
  const { publicMap, activeTabId, dataRecordsQueries } =
    useContext(PublicMapContext);

  const { filtersDialogOpen, setFiltersDialogOpen } =
    useContext(PublicFiltersContext);
  const [filterFields, setFilterFields] = useState<FilterField[]>([]);

  useEffect(() => {
    // don't run it until user opens the filters
    if (!publicMap || !filtersDialogOpen) {
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
  }, [publicMap, activeTabId, dataRecordsQueries, filtersDialogOpen]);

  const closeDialog = () => setFiltersDialogOpen(false);

  return (
    <Dialog open={filtersDialogOpen} onOpenChange={setFiltersDialogOpen}>
      <DialogTrigger>
        <Button variant="ghost" asChild={true}>
          <span>
            <ListFilter />
            Open filters
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-[420px] !w-[90%] gap-2">
        <DialogHeader>
          <DialogTitle>Filter</DialogTitle>
          <DialogDescription className="sr-only">
            Filter map records
          </DialogDescription>
          <Separator className="my-4" />
        </DialogHeader>
        <FiltersForm fields={filterFields} closeDialog={closeDialog} />
      </DialogContent>
    </Dialog>
  );
}
