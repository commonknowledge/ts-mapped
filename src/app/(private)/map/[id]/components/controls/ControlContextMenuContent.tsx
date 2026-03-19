import { PencilIcon, TrashIcon } from "lucide-react";
import { ContextMenuContent, ContextMenuItem } from "@/shadcn/ui/context-menu";

export default function ControlContextMenuContent({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <ContextMenuContent>
      <ContextMenuItem onClick={onEdit}>
        <PencilIcon size={12} />
        Rename
      </ContextMenuItem>
      <ContextMenuItem onClick={onDelete}>
        <TrashIcon size={12} />
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  );
}
