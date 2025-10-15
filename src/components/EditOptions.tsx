import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/shadcn/ui/button";

interface EditOptionsProps {
  onRename?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function EditOptions({
  onRename,
  onDelete,
  disabled = false,
  className = "",
  size = "sm",
}: EditOptionsProps) {
  const [showMenu, setShowMenu] = useState(false);

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className={`${sizeClasses[size]} p-0 hover:bg-neutral-100 text-muted-foreground hover:text-primary ${className}`}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
      >
        <MoreHorizontal className={iconSizes[size]} />
      </Button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded shadow-lg z-50 min-w-[8rem]">
          {onRename && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onRename();
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 flex items-center gap-2"
            >
              <Pencil className={iconSizes[size]} />
              Rename
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onDelete();
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 flex items-center gap-2 text-red-600"
            >
              <Trash2 className={iconSizes[size]} />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
