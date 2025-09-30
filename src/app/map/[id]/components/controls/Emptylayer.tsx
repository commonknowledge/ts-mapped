import { CornerRightUp } from "lucide-react";
import React from "react";

export default function EmptyLayer({ message }: { message: React.ReactNode }) {
  return (
    <div className="text-sm text-neutral-400 p-2 text-right rounded bg-transparent flex items-center gap-2 justify-end">
      {message} <CornerRightUp className="w-4 h-4  shrink-0" />
    </div>
  );
}
