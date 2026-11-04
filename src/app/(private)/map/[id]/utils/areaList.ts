import { formatNumber } from "@/utils/text";
import type { AreaList } from "@/models/Map";

/** A figure as a number, when it is one (numbers stored as text too) */
export const toAreaListNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

// The average of some numbers, or null when there are none
const mean = (values: number[]) =>
  values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;

/** How a column's figures across a list compare with all areas */
export const summariseAreaListColumn = ({
  list,
  valueByCode,
  allValues,
}: {
  list: AreaList;
  valueByCode: Map<string, unknown>;
  allValues: unknown[];
}) => {
  const listValues = list.areas.map((area) => valueByCode.get(area.code));
  const listNumbers = listValues
    .map(toAreaListNumber)
    .filter((value): value is number => value !== null);
  const isNumeric = listNumbers.length > 0;
  const counts = new Map<string, number>();
  if (!isNumeric) {
    for (const value of listValues) {
      if (value === null || value === undefined || value === "") continue;
      counts.set(String(value), (counts.get(String(value)) ?? 0) + 1);
    }
  }
  return {
    isNumeric,
    listMean: mean(listNumbers),
    allMean: mean(
      allValues
        .map(toAreaListNumber)
        .filter((value): value is number => value !== null),
    ),
    topValues: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4),
  };
};

/** A figure for a table cell: numbers formatted, blanks as a dash */
export const formatAreaListValue = (value: unknown) => {
  const number = toAreaListNumber(value);
  if (number !== null) return formatNumber(number);
  return value === null || value === undefined || value === ""
    ? "–"
    : String(value);
};
