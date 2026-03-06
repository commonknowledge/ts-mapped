import type { ColumnMetadata } from "@/server/models/DataSource";

/**
 * Resolve effective column metadata by merging org-specific overrides on top of
 * the data source defaults. For each column, the override's description and
 * valueLabels take precedence when present; otherwise the data source defaults
 * are used.
 */
export function resolveColumnMetadata(
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
    };
  });
}

/**
 * Find the resolved metadata entry for a single column.
 */
export function resolveColumnMetadataEntry(
  baseMetadata: ColumnMetadata[],
  overrideMetadata: ColumnMetadata[] | null | undefined,
  columnName: string,
): ColumnMetadata | undefined {
  const resolved = resolveColumnMetadata(baseMetadata, overrideMetadata);
  return resolved.find((m) => m.name === columnName);
}
