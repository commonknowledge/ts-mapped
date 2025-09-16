import { CornerRightUp } from "lucide-react";
import React from "react";

export default function EmptyLayer({ message }: { message: React.ReactNode }) {
  return (
    <div className="text-sm text-muted-foreground p-2 rounded  bg-neutral-50 flex items-center gap-2 justify-between">
      {message} <CornerRightUp className="w-4 h-4 text-neutral-400 shrink-0" />
    </div>
  );
}
