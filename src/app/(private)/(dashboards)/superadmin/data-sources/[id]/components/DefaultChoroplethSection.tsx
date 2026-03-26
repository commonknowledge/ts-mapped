"use client";

import { CalculationType, calculationTypes } from "@/models/MapView";
import { Label } from "@/shadcn/ui/label";
import type { DefaultChoroplethConfig } from "@/models/DataSource";
import type { DataSource } from "@/models/DataSource";

interface DefaultChoroplethSectionProps {
  dataSource: DataSource;
  config: DefaultChoroplethConfig | null;
  onChange: (config: DefaultChoroplethConfig | null) => void;
}

export function DefaultChoroplethSection({
  dataSource,
  config,
  onChange,
}: DefaultChoroplethSectionProps) {
  const column = config?.column ?? "";
  const calculationType = config?.calculationType ?? CalculationType.Avg;

  function update(patch: Partial<DefaultChoroplethConfig>) {
    const next = { column, calculationType, ...config, ...patch };
    onChange(next.column ? next : null);
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-6 mb-6 space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-1">Default choropleth</h3>
        <p className="text-sm text-muted-foreground">
          Default column and calculation type applied when this data source is
          first added to a map.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Default column</Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={column}
            onChange={(e) => update({ column: e.target.value })}
          >
            <option value="">(No default)</option>
            {dataSource.columnDefs.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Calculation type</Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={calculationType}
            onChange={(e) =>
              update({ calculationType: e.target.value as CalculationType })
            }
          >
            {calculationTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
