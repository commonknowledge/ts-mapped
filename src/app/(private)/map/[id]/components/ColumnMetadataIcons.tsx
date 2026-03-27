import { InfoIcon, Settings2Icon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { useDataSourceColumn } from "../hooks/useDataSourceColumn";
import { useEditColumnMetadata } from "../hooks/useEditColumnMetadata";
import type { EditColumnMetadataFields } from "../atoms/editColumnMetadataAtom";

function ColumnMetadataIcons({
  dataSourceId,
  column,
  fields,
  iconColorClass = "text-black",
  showSettings = true,
}: {
  dataSourceId?: string;
  fields: EditColumnMetadataFields;
  column: string;
  iconColorClass?: string;
  showSettings?: boolean;
}) {
  const [, setEditColumnMetadata] = useEditColumnMetadata();
  const { columnMetadata: metadata } = useDataSourceColumn(
    dataSourceId,
    column,
  );

  if (!dataSourceId) {
    return null;
  }

  const description = metadata?.description;

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
            <p className="whitespace-pre-line">{description}</p>
          </TooltipContent>
        </Tooltip>
      )}
      {showSettings && (
        <button
          type="button"
          className="inline-flex items-center ml-1 p-0.5 -m-0.5 border-0 bg-transparent cursor-pointer align-middle rounded hover:bg-neutral-200 focus-visible:bg-neutral-200 focus-visible:outline-none transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setEditColumnMetadata({
              dataSourceId,
              column,
              fields,
            });
          }}
          aria-label="Edit column"
        >
          <Settings2Icon className={`h-3.5 w-3.5 shrink-0 ${iconColorClass}`} />
        </button>
      )}
    </>
  );
}

export default ColumnMetadataIcons;
