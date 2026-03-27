"use client";

import { useMemo } from "react";
import { useDataSources } from "@/hooks/useDataSources";
import type { ColumnDef, ColumnMetadata } from "@/models/DataSource";

export function _resolveColumnMetadata(
  baseMetadata: ColumnMetadata[],
  overrideMetadata: ColumnMetadata[] | null | undefined,
): ColumnMetadata[] {
  if (!overrideMetadata || overrideMetadata.length === 0) {
    return baseMetadata;
  }

  const overrideMap = new Map(overrideMetadata.map((m) => [m.name, m]));

  return baseMetadata.map((base) => {
    const override = overrideMap.get(base.name);
    if (!override) return base;
    return {
      name: base.name,
      description: override.description || base.description,
      valueLabels:
        Object.keys(override.valueLabels).length > 0
          ? { ...base.valueLabels, ...override.valueLabels }
          : base.valueLabels,
      valueColors: override.valueColors
        ? { ...base.valueColors, ...override.valueColors }
        : base.valueColors,
      semanticType: override.semanticType ?? base.semanticType,
    };
  });
}

export function _resolveColumnMetadataEntry(
  baseMetadata: ColumnMetadata[],
  overrideMetadata: ColumnMetadata[] | null | undefined,
  columnName: string,
): ColumnMetadata | undefined {
  return _resolveColumnMetadata(baseMetadata, overrideMetadata).find(
    (m) => m.name === columnName,
  );
}

export function useDataSourceColumn(
  dataSourceId: string | null | undefined,
  columnName: string,
): {
  columnMetadata: ColumnMetadata | undefined;
  columnDef: ColumnDef | undefined;
} {
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);

  return useMemo(() => {
    if (!dataSource) return { columnDef: undefined, columnMetadata: undefined };

    const columnMetadata = _resolveColumnMetadataEntry(
      dataSource.columnMetadata,
      dataSource.organisationOverride?.columnMetadata,
      columnName,
    );

    const columnDef = dataSource.columnDefs.find(
      (cd) => cd.name === columnName,
    );

    return { columnDef, columnMetadata };
  }, [dataSource, columnName]);
}

export function useDataSourceColumns(dataSourceId: string | null | undefined): {
  columnMetadata: ColumnMetadata[];
  columnDefs: ColumnDef[] | undefined;
} {
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);

  const columnMetadata = useMemo(
    () =>
      _resolveColumnMetadata(
        dataSource?.columnMetadata ?? [],
        dataSource?.organisationOverride?.columnMetadata,
      ),
    [
      dataSource?.columnMetadata,
      dataSource?.organisationOverride?.columnMetadata,
    ],
  );

  return { columnDefs: dataSource?.columnDefs, columnMetadata };
}
