import { colorWithAlpha } from "@/utils/colors";
import type { ReactNode } from "react";

/**
 * Coloured pill for a category value: tinted background with a swatch dot.
 * Matches the inspector panel's party-colour badge visual so value colours
 * look the same in the table and the inspector.
 */
export default function ValueBadge({
  color,
  children,
}: {
  color: string;
  children: ReactNode;
}) {
  const background = colorWithAlpha(color, 0.12);
  return (
    <span
      className="inline-flex items-baseline gap-1.5 rounded px-1.5 py-0.5 border border-black/5"
      style={background ? { backgroundColor: background } : undefined}
    >
      <span
        className="h-2.5 w-2.5 rounded-sm border border-neutral-300 shrink-0 translate-y-px"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="min-w-0">{children}</span>
    </span>
  );
}
