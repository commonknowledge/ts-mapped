import { cn } from "@/shadcn/utils";
import type { ReactNode } from "react";

export default function LayerControlWrapper({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-neutral-200 last:border-b-0", className)}>
      {children}
    </div>
  );
}
