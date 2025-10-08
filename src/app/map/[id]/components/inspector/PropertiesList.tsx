import { Fragment } from "react";

export default function PropertiesList({
  properties,
}: {
  properties: Record<string, unknown> | null | undefined;
}) {
  if (!Object.keys(properties as object)?.length) {
    return <></>;
  }

  return (
    <dl className="flex flex-col gap-2">
      {Object.keys(properties as object).map((label) => {
        const value = properties?.[label] as string;

        if (!value) return <Fragment key={label}></Fragment>;

        return (
          <div key={label}>
            <dt className="mb-1 / text-muted-foreground text-xs uppercase font-mono">
              {label}
            </dt>
            <dd className="font-medium">{value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
