import { PublicMapColumnType } from "@/__generated__/types";
import { toBoolean } from "./utils";
import type { PublicMapDataRecordsQuery } from "@/__generated__/types";
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
  allRecords: NonNullable<PublicMapDataRecordsQuery["dataSource"]>["records"],
): NonNullable<PublicMapDataRecordsQuery["dataSource"]>["records"] => {
  if (!activeFilters?.length || !allRecords?.length) {
    return [];
  }

  return allRecords.filter((record) => {
    return activeFilters.every((filter) => {
      if (
        filter.type === PublicMapColumnType.Boolean &&
        toBoolean(filter.value)
      ) {
        return toBoolean(record.json[filter.name]);
      }

      if (filter.type === PublicMapColumnType.String && filter.value) {
        const fieldValue = String(record.json[filter.name] || "");
        return fieldValue.toLowerCase().includes(filter.value.toLowerCase());
      }

      if (
        filter.type === PublicMapColumnType.CommaSeparatedList &&
        filter?.selectedOptions?.length
      ) {
        const recordArr = record.json[filter.name]
          ? record.json[filter.name].split(", ")
          : [];

        return recordArr.some((val: string) =>
          filter?.selectedOptions?.includes(val),
        );
      }

      return true;
    });
  });
};
