"use client";

import { ColumnType } from "@/models/DataSource";
import { Input } from "@/shadcn/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";

interface ValueLabelsEditorProps {
  /** Sorted distinct values to display. `undefined` = still loading, `null` = too many values. */
  values: string[] | null | undefined;
  columnType: ColumnType | undefined;
  valueLabels: Record<string, string>;
  onChange: (value: string, label: string) => void;
}

export default function ValueLabelsEditor({
  values,
  columnType,
  valueLabels,
  onChange,
}: ValueLabelsEditorProps) {
  if (values === undefined) {
    return <p className="text-sm text-muted-foreground">Loading values…</p>;
  }
  if (values === null) {
    return (
      <p className="text-sm text-muted-foreground p-4">
        Too many unique values to configure labels.
      </p>
    );
  }
  if (values.length === 0) {
    return <p className="text-sm text-muted-foreground">No values found.</p>;
  }

  const sorted = values.toSorted((a, b) => {
    if (columnType === ColumnType.Number) {
      const numA = Number(a);
      const numB = Number(b);
      if (isNaN(numA) || isNaN(numB)) return a.localeCompare(b);
      return numA - numB;
    }
    return a.localeCompare(b);
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Value</TableHead>
          <TableHead>Label</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((value) => (
          <TableRow key={value}>
            <TableCell className="font-mono text-sm text-muted-foreground whitespace-normal">
              {value || "(blank)"}
            </TableCell>
            <TableCell>
              <Input
                value={valueLabels[value] ?? ""}
                onChange={(e) => onChange(value, e.target.value)}
                className="h-8 text-sm"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
