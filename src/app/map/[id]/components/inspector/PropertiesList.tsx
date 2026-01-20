import { Fragment } from "react";

export default function PropertiesList({
  properties,
}: {
  properties: Record<string, unknown> | null | undefined;
}) {
  if (!properties || !Object.keys(properties as object)?.length) {
    return <></>;
  }

  return (
    <dl className="flex flex-col gap-3">
      {Object.keys(properties as object).map((label) => {
        const value = `${properties?.[label]}`;

        if (!value) return <Fragment key={label}></Fragment>;

        return (
          <div key={label} className="break-words">
            <dt className="mb-[2px] / text-muted-foreground text-xs uppercase font-mono break-words">
              {label}
            </dt>
            <dd className="font-medium break-words">{value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
