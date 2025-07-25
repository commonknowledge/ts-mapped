import React from "react";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";

// Dropdown item types
export interface DropdownItem {
  type: "item";
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export interface DropdownSeparator {
  type: "separator";
}

export interface DropdownSubMenu {
  type: "submenu";
  label: string;
  icon?: React.ReactNode;
  items: (DropdownItem | DropdownSeparator)[];
}

export type DropdownMenuItemType =
  | DropdownItem
  | DropdownSeparator
  | DropdownSubMenu;

// Main component props
export interface IconButtonWithTooltipProps {
  children: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  className?: string;
  // Dropdown props (optional)
  dropdownLabel?: string;
  dropdownItems?: DropdownMenuItemType[];
  dropdownSubLabel?: string;
  dropdownSubItems?: (DropdownItem | DropdownSeparator)[];
  dropdownSubIcon?: React.ReactNode;
  align?: "center" | "start" | "end";
  side?: "top" | "bottom" | "left" | "right";
}

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
  className = "",
}: IconButtonWithTooltipProps) {
  const isDropdown = dropdownLabel && dropdownItems;

  const renderDropdownItem = (item: DropdownMenuItemType, index: number) => {
    switch (item.type) {
      case "separator":
        return <DropdownMenuSeparator key={`separator-${index}`} />;

      case "submenu":
        return (
          <DropdownMenuSub key={`submenu-${index}`}>
            <DropdownMenuSubTrigger>
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {item.items.map((subItem, subIndex) => {
                if (subItem.type === "separator") {
                  return (
                    <DropdownMenuSeparator key={`sub-separator-${subIndex}`} />
                  );
                }
                return (
                  <DropdownMenuItem
                    key={subItem.label}
                    onClick={subItem.onClick}
                  >
                    {subItem.icon && subItem.icon}
                    {subItem.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );

      case "item":
        return (
          <DropdownMenuItem key={item.label} onClick={item.onClick}>
            {item.icon && item.icon}
            {item.label}
          </DropdownMenuItem>
        );

      default:
        return null;
    }
  };

  const renderSubDropdownItems = () => {
    if (!dropdownSubLabel || !dropdownSubItems) return null;

    return (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {dropdownSubIcon && <span className="mr-2">{dropdownSubIcon}</span>}
            {dropdownSubLabel}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {dropdownSubItems.map((item, index) => {
              if (item.type === "separator") {
                return <DropdownMenuSeparator key={`sub-separator-${index}`} />;
              }
              return (
                <DropdownMenuItem key={item.label} onClick={item.onClick}>
                  {item.icon && item.icon}
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {isDropdown ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`text-muted-foreground hover:text-primary transition-colors w-6 h-6 ${className}`}
                  asChild
                >
                  <div>{children}</div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={align} side={side}>
                <DropdownMenuLabel>{dropdownLabel}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {dropdownItems.map(renderDropdownItem)}
                {renderSubDropdownItems()}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className={`text-muted-foreground hover:text-primary transition-colors h-6 w-6 ${className}`}
              onClick={onClick}
              asChild
            >
              <div>{children}</div>
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
