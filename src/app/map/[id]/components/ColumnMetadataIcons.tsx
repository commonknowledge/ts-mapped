import { InfoIcon, Settings2Icon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { useEditColumnMetadata } from "../hooks/useEditColumnMetadata";
import type { DataSource } from "@/server/models/DataSource";

function ColumnMetadataIcons({
  dataSource,
  column,
  iconColorClass = "text-black",
}: {
  dataSource?: DataSource | null | undefined;
  column: string;
  iconColorClass?: string;
}) {
  const [, setEditColumnMetadata] = useEditColumnMetadata();

  if (!dataSource) {
    return null;
  }

  const description = dataSource?.columnMetadata.find(
    (c) => c.name === column,
  )?.description;

  return (
    <>
      {description && (
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon
              className={`h-3.5 w-3.5 shrink-0 cursor-help ${iconColorClass} inline-block ml-1`}
              aria-label="Column description"
              tabIndex={0}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-64">
            <p>{description}</p>
          </TooltipContent>
        </Tooltip>
      )}
      <button
        type="button"
        className="inline-flex items-center ml-1 p-0.5 -m-0.5 border-0 bg-transparent cursor-pointer align-middle rounded hover:bg-neutral-200 focus-visible:bg-neutral-200 focus-visible:outline-none transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setEditColumnMetadata({
            dataSourceId: dataSource.id,
            column,
          });
        }}
        aria-label="Edit column"
      >
        <Settings2Icon className={`h-3.5 w-3.5 shrink-0 ${iconColorClass}`} />
      </button>
    </>
  );
}

export default ColumnMetadataIcons;
