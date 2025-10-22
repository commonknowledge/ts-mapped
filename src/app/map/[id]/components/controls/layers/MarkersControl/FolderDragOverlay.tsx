import { EyeOffIcon, Folder as FolderClosed } from "lucide-react";
import type { Folder } from "@/server/models/Folder";

export default function FolderDragOverlay({ folder }: { folder: Folder }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-white border border-blue-300 rounded shadow-lg pointer-events-none">
      {folder.hideMarkers ? (
        <EyeOffIcon className="w-4 h-4 text-muted-foreground shrink-0" />
      ) : (
        <FolderClosed className="w-4 h-4 text-muted-foreground shrink-0" />
      )}
      <span className="text-sm font-medium flex-1 break-all">
        {folder.name}
      </span>
    </div>
  );
}
