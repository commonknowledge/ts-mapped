import { CornerRightUp } from "lucide-react";
import React from "react";
import { cn } from "@/shadcn/utils";

export default function LayerEmptyMessage({
  message,
  onClick,
}: {
  message: React.ReactNode;
  onClick?: () => void;
}) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      onClick={onClick}
      className={cn(
        "text-sm text-neutral-400 p-2 text-right rounded bg-transparent flex items-center gap-2 justify-end",
        onClick &&
          "cursor-pointer hover:text-neutral-600 hover:bg-neutral-50 transition-colors"
      )}
    >
      {message} <CornerRightUp className="w-4 h-4 shrink-0" />
    </Component>
  );
}
