import { PublicMapColumnType } from "@/server/models/PublicMap";
import { toBooleanOrUnknown } from "./utils";
import type { RouterOutputs } from "@/services/trpc/react";
import type { PublicFiltersFormValue } from "@/types";

export const getActiveFilters = (
  filters: PublicFiltersFormValue[] | undefined,
) => {
  if (!filters?.length) {
    return [];
  }

  return filters.filter((f) => f?.value || f?.selectedOptions?.length);
};

export const filterRecords = (
  activeFilters: PublicFiltersFormValue[],
  allRecords: NonNullable<
    RouterOutputs["dataSource"]["byIdWithRecords"]
  >["records"],
): NonNullable<RouterOutputs["dataSource"]["byIdWithRecords"]>["records"] => {
  if (!activeFilters?.length || !allRecords?.length) {
    return [];
  }

  return allRecords.filter((record) => {
    return activeFilters.every((filter) => {
      if (filter.type === PublicMapColumnType.Boolean) {
        return toBooleanOrUnknown(record.json[filter.name]);
      }

      if (filter.type === PublicMapColumnType.String && filter.value) {
        const fieldValue = String(record.json[filter.name] || "");
        return fieldValue.toLowerCase().includes(filter.value.toLowerCase());
      }

      if (
        filter.type === PublicMapColumnType.CommaSeparatedList &&
        filter?.selectedOptions?.length
      ) {
        const recordValue = record.json[filter.name];
        const recordArr =
          recordValue && typeof recordValue === "string"
            ? recordValue.split(", ")
            : [];

        return recordArr.some((val: string) =>
          filter?.selectedOptions?.includes(val),
        );
      }

      return true;
    });
  });
};
