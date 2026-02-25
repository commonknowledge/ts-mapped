import { Fragment } from "react";
import { cn } from "@/shadcn/utils";

export type PropertyEntry = {
  key: string;
  label: string;
  value: unknown;
  groupLabel?: string;
};

export default function PropertiesList({
  properties,
  entries: entriesProp,
  layout = "single",
}: {
  properties?: Record<string, unknown> | null;
  entries?: PropertyEntry[] | null;
  layout?: "single" | "twoColumn";
}) {
  const entries: PropertyEntry[] = entriesProp
    ? entriesProp.filter((e) => e.value !== undefined && e.value !== null && String(e.value) !== "")
    : properties && Object.keys(properties).length
      ? Object.entries(properties).map(([key, value]) => ({
          key,
          label: key,
          value,
        }))
      : [];

  if (!entries.length) return <></>;

  const isTwoColumn = layout === "twoColumn";
  const renderEntry = (e: PropertyEntry) => (
    <div key={e.key}>
      <dt className="mb-[2px] / text-muted-foreground text-xs uppercase font-mono">
        {e.label}
      </dt>
      <dd className="font-medium">{String(e.value)}</dd>
    </div>
  );

  const byGroup = entries.reduce<{ group?: string; items: PropertyEntry[] }[]>(
    (acc, e) => {
      const last = acc[acc.length - 1];
      if (e.groupLabel !== undefined) {
        if (last?.group === e.groupLabel) last.items.push(e);
        else acc.push({ group: e.groupLabel, items: [e] });
      } else {
        if (last && last.group === undefined) last.items.push(e);
        else acc.push({ items: [e] });
      }
      return acc;
    },
    [],
  );

  return (
    <dl
      className={cn(
        "flex flex-col gap-3",
        isTwoColumn &&
          "grid grid-cols-2 gap-x-4 gap-y-3 relative before:content-[''] before:absolute before:left-1/2 before:top-0 before:bottom-0 before:w-px before:bg-neutral-200 before:-translate-x-px",
      )}
    >
      {byGroup.map((block, i) => (
        <Fragment key={i}>
          {block.group && (
            <div
              className={cn(
                "text-muted-foreground text-xs font-medium uppercase tracking-wide",
                isTwoColumn ? "col-span-2 mt-2 first:mt-0" : "mt-3 first:mt-0",
              )}
            >
              {block.group}
            </div>
          )}
          {block.items.map(renderEntry)}
        </Fragment>
      ))}
    </dl>
  );
}
