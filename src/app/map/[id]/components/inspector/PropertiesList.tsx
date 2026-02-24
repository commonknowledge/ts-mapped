import { Info } from "lucide-react";
import { Fragment } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import type { ColumnMetadata } from "@/server/models/DataSource";

export default function PropertiesList({
  properties,
  columnMetadata,
}: {
  properties: Record<string, unknown> | null | undefined;
  columnMetadata?: ColumnMetadata[];
}) {
  if (!properties || !Object.keys(properties as object)?.length) {
    return <></>;
  }

  return (
    <dl className="flex flex-col gap-3">
      {Object.keys(properties as object).map((label) => {
        const value = `${properties?.[label]}`;

        if (!value) return <Fragment key={label}></Fragment>;

        const description = columnMetadata?.find(
          (c) => c.name === label,
        )?.description;

        return (
          <div key={label}>
            <dt className="mb-[2px] / text-muted-foreground text-xs uppercase font-mono flex items-center gap-1">
              {label}
              {description ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info
                      className="h-3.5 w-3.5 shrink-0 cursor-help text-black"
                      aria-label="Column description"
                      tabIndex={0}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{description}</p>
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </dt>
            <dd className="font-medium">{value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
