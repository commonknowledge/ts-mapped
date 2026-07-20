import { Check, X } from "lucide-react";

const FALSY_STRINGS = new Set(["false", "no", "n", "0", "-", "unchecked"]);

/** Truthiness for Boolean display: Airtable checkboxes arrive as true or
 *  absent, so any non-empty non-negative string counts as ticked. */
export function parseBooleanValue(value: unknown): boolean | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return false;
    }
    return !FALSY_STRINGS.has(normalized);
  }
  return Boolean(value);
}

/**
 * Yes/no display for columns with the Boolean inspector format, shared by
 * the inspector record view and the map table.
 */
export default function BooleanValueDisplay({ value }: { value: unknown }) {
  const bool = parseBooleanValue(value);
  if (bool === null) {
    return <span className="font-medium">-</span>;
  }
  return bool ? (
    <Check className="h-4 w-4 text-green-600" aria-label="Yes" />
  ) : (
    <X className="h-4 w-4 text-neutral-400" aria-label="No" />
  );
}
