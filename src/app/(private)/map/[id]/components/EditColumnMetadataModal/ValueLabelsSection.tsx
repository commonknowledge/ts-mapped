"use client";

import ValueLabelsEditor from "@/components/ValueLabelsEditor";
import type { ColumnType } from "@/models/DataSource";

interface ValueLabelsSectionProps {
  values: string[] | null | undefined;
  columnType: ColumnType | undefined;
  valueLabels: Record<string, string>;
  onChange: (value: string, label: string) => void;
}

export default function ValueLabelsSection({
  values,
  columnType,
  valueLabels,
  onChange,
}: ValueLabelsSectionProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">Display values</label>
      <ValueLabelsEditor
        values={values}
        columnType={columnType}
        valueLabels={valueLabels}
        onChange={onChange}
      />
    </div>
  );
}
