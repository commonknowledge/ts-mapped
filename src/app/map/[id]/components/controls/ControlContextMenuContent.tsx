import { PencilIcon, TrashIcon } from "lucide-react";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import { ContextMenuItem } from "@/shadcn/ui/context-menu";
import type { RefObject } from "react";

export default function ControlContextMenuContent({
  inputRef,
  isEditing,
  onEdit,
  onDelete,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <ContextMenuContentWithFocus
      shouldFocusTarget={isEditing}
      targetRef={inputRef}
    >
      <ContextMenuItem onClick={onEdit}>
        <PencilIcon size={12} />
        Edit
      </ContextMenuItem>
      <ContextMenuItem onClick={onDelete}>
        <TrashIcon size={12} />
        Delete
      </ContextMenuItem>
    </ContextMenuContentWithFocus>
  );
}
