import { Info } from "lucide-react";
import { Fragment } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";

export interface PropertiesListItem {
  label: string;
  description?: string | null | undefined;
  value: unknown;
}

export default function PropertiesList({
  properties,
}: {
  properties: PropertiesListItem[];
}) {
  if (!properties || !properties.length) {
    return <></>;
  }

  return (
    <dl className="flex flex-col gap-3">
      {properties.map(({ label, description, value }, i) => {
        if (value === null || value === undefined)
          return <Fragment key={label}></Fragment>;

        return (
          <div key={`${label}-${i}`}>
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
            <dd className="font-medium">{String(value)}</dd>
          </div>
        );
      })}
    </dl>
  );
}
