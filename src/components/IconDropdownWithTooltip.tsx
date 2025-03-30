import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { Button } from "@/shadcn/ui/button";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { Tooltip } from "@/shadcn/ui/tooltip";

interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

interface DropdownSeparator {
  type: "separator";
}

type DropdownMenuItemType = DropdownItem | DropdownSeparator;

export default function IconDropdownWithTooltip({
  children,
  tooltip,
  dropdownLabel,
  dropdownItems,
  align,
  side,
}: {
  children: React.ReactNode;
  tooltip: string;
  dropdownLabel: string;
  dropdownItems: DropdownMenuItemType[];
  align?: "center" | "start" | "end";
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="hover:text-muted-foreground transition-colors"
                asChild
              >
                <div>{children}</div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} side={side}>
              <DropdownMenuLabel>{dropdownLabel}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {dropdownItems.map((item, index) =>
                "type" in item ? (
                  <DropdownMenuSeparator key={`separator-${index}`} />
                ) : (
                  <DropdownMenuItem key={item.label} onClick={item.onClick}>
                    {item.icon && item.icon}
                    {item.label}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
