import { InfoIcon, PencilIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import useEditColumnMetadataAtom from "../hooks/useEditColumnMetadataAtom";
import type { DataSource } from "@/server/models/DataSource";

function ColumnMetadataIcons({
  dataSource,
  column,
}: {
  dataSource?: DataSource | null | undefined;
  column: string;
}) {
  const [, setEditColumnMetadata] = useEditColumnMetadataAtom();

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
              className="h-3.5 w-3.5 shrink-0 cursor-help text-black inline-block ml-1"
              aria-label="Column description"
              tabIndex={0}
            />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{description}</p>
          </TooltipContent>
        </Tooltip>
      )}
      <button
        type="button"
        className="inline-flex items-center ml-1 p-0.5 -m-0.5 border-0 bg-transparent cursor-pointer align-middle rounded hover:bg-neutral-200 focus-visible:bg-neutral-200 focus-visible:outline-none transition-colors"
        onClick={() => {
          setEditColumnMetadata({
            dataSourceId: dataSource.id,
            column,
          });
        }}
        aria-label="Edit column"
      >
        <PencilIcon className="h-3.5 w-3.5 shrink-0 text-black" />
      </button>
    </>
  );
}

export default ColumnMetadataIcons;
