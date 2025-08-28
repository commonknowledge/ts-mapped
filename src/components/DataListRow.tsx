import React from "react";
import { Badge } from "@/shadcn/ui/badge";
import { Label } from "@/shadcn/ui/label";
import { cn } from "@/shadcn/utils";
export default function DataListRow({
  label,
  description,
  value,
  badge,
  border,
  children,
  orientation = "horizontal",
}: {
  label: string;
  description?: string;
  value?: string;
  badge?: boolean;
  border?: boolean;
  children?: React.ReactNode;
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 py-2",
        border && "border-b border-border/50 "
      )}
    >
      <div
        className={cn(
          "flex gap-1 items-center",
          orientation === "vertical" && "flex-col items-start"
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
      {description && (
        <span className="text-sm text-muted-foreground">{description}</span>
      )}
    </div>
  );
}
