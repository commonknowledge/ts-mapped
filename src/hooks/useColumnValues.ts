import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ColumnType } from "@/models/DataSource";
import { useTRPC } from "@/services/trpc/react";

const BLANK_VALUES = new Set(["", "null", "undefined"]);

export function applyNullIsZero(values: string[]): string[] {
  const hasBlankOrZero =
    values.some((v) => BLANK_VALUES.has(v)) || values.includes("0");
  if (!hasBlankOrZero) return values;
  const filtered = values.filter((v) => !BLANK_VALUES.has(v));
  if (!filtered.includes("0")) filtered.push("0");
  return filtered;
}

/**
 * Fetches unique column values for a data source column, applying nullIsZero
 * normalisation and numeric-aware sorting.
 *
 * Returns:
 *   - `undefined` while loading
 *   - `null` if there are too many distinct values (server returned null)
 *   - sorted `string[]` otherwise
 */
export function useColumnValues({
  dataSourceId,
  column,
  columnType,
  nullIsZero,
  enabled,
  additionalValues,
}: {
  dataSourceId: string;
  column: string;
  columnType: ColumnType;
  nullIsZero: boolean | undefined;
  enabled: boolean;
  additionalValues?: string[];
}): string[] | null | undefined {
  const trpc = useTRPC();

  const { data: rawValues } = useQuery(
    trpc.dataSource.uniqueColumnValues.queryOptions(
      { dataSourceId, column },
      { enabled },
    ),
  );

  return useMemo(() => {
    if (rawValues == null) return rawValues;

    let values = Array.from(
      new Set([...rawValues, ...(additionalValues ?? [])]),
    );
    if (nullIsZero && columnType === ColumnType.Number) {
      values = applyNullIsZero(values);
    }

    return values.toSorted((a, b) => {
      if (columnType === ColumnType.Number) {
        const numA = Number(a);
        const numB = Number(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      }
      return a.localeCompare(b);
    });
  }, [rawValues, additionalValues, nullIsZero, columnType]);
}
