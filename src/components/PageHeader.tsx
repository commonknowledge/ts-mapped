import React from "react";
import { Separator } from "@/shadcn/ui/separator";

export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 w-full">
      <div className="flex w-full items-start gap-4 justify-between mb-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div>
        <Separator />
      </div>
    </div>
  );
}
