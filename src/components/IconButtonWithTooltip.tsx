import React from "react";
import { Button } from "@/shadcn/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";
import { cn } from "@/shadcn/utils";
import MultiDropdownMenu from "./MultiDropdownMenu";
import type { MultiDropdownMenuProps } from "./MultiDropdownMenu";

// Main component props
type IconButtonWithTooltipProps = Partial<MultiDropdownMenuProps> & {
  tooltip: string;
  onClick?: () => void;
  onMenuToggle?: (isOpen: boolean) => void;
};

export default function IconButtonWithTooltip({
  children,
  tooltip,
  onClick,
  dropdownLabel,
  dropdownItems,
  dropdownSubLabel,
  dropdownSubItems,
  dropdownSubIcon,
  align,
  side,
  buttonClassName = "",
  onMenuToggle,
}: IconButtonWithTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {dropdownLabel && dropdownItems ? (
            <MultiDropdownMenu
              dropdownLabel={dropdownLabel}
              dropdownItems={dropdownItems}
              dropdownSubLabel={dropdownSubLabel}
              dropdownSubItems={dropdownSubItems}
              dropdownSubIcon={dropdownSubIcon}
              align={align}
              side={side}
              buttonClassName={cn(
                buttonClassName,
                "w-6 h-6 pointer-events-auto",
              )}
              buttonSize="icon"
              onMenuToggle={onMenuToggle}
            >
              {children}
            </MultiDropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "text-muted-foreground hover:text-primary transition-colors h-6 w-6 pointer-events-auto",
                buttonClassName,
              )}
              onClick={onClick}
              asChild
            >
              <div>{children}</div>
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent className="pointer-events-none">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
