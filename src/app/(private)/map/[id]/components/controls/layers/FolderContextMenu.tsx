import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { MarkerFolder } from "@/types";

interface FolderContextMenuProps {
  folder: MarkerFolder;
  children: React.ReactNode;
  onDelete: (folderId: string) => void;
  onStartEdit?: () => void;
}

export function FolderContextMenu({
  folder,
  children,
  onDelete,
  onStartEdit,
}: FolderContextMenuProps) {
  const handleEdit = () => {
    onStartEdit?.();
  };

  const handleDelete = () => {
    onDelete(folder.id);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleEdit}>Edit Folder</ContextMenuItem>
        <ContextMenuItem onClick={handleDelete} className="text-red-600">
          Delete Folder
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
