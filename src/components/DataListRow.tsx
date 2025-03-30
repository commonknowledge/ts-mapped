import React from "react";
import { Badge } from "@/shadcn/ui/badge";
import { Label } from "@/shadcn/ui/label";
import { cn } from "@/shadcn/utils";
export default function DataListRow({
  label,
  value,
  badge,
  border,
  children,
}: {
  label: string;
  value?: string;
  badge?: boolean;
  border?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-2 items-center py-4",
        border && "border-b border-border/50 ",
      )}
    >
      <Label className="w-44">{label}</Label>
      {badge ? (
        <Badge variant="outline" className="text-base">
          {value}
        </Badge>
      ) : (
        <p className="max-w-[180px] overflow-hidden overflow-ellipsis">
          {value}
        </p>
      )}
      <div>{children}</div>
    </div>
  );
}
