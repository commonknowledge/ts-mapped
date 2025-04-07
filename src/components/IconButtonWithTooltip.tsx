import React from "react";
import { Button } from "@/shadcn/ui/button";
import { TooltipContent } from "@/shadcn/ui/tooltip";
import { TooltipProvider, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { Tooltip } from "@/shadcn/ui/tooltip";
export default function IconButtonWithTooltip({
  children,
  tooltip,
  onClick,
}: {
  children: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hover:text-muted-foreground transition-colors"
            onClick={onClick}
            asChild
          >
            <div>{children}</div>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
