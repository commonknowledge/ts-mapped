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
import { cn } from "@/shadcn/utils";

export interface MultiDropdownMenuProps {
  children: React.ReactNode;
  buttonClassName?: string;
  buttonSize?: "default" | "sm" | "lg" | "icon";
  variant?: "ghost" | "outline" | "default";
  dropdownLabel: string;
  dropdownItems: DropdownMenuItemType[];
  dropdownSubLabel?: string;
  dropdownSubItems?: (DropdownItem | DropdownSeparator)[];
  dropdownSubIcon?: React.ReactNode;
  align?: "center" | "start" | "end";
  side?: "top" | "bottom" | "left" | "right";
}

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
  label: string | React.ReactNode;
  icon?: React.ReactNode;
  items: (
    | DropdownItem
    | DropdownSeparator
    | DropdownSubComponent
    | DropdownSubMenu
  )[];
}

export interface DropdownSubComponent {
  type: "subcomponent";
  label: string | React.ReactNode;
  icon?: React.ReactNode;
  component: React.ReactNode;
}

export type DropdownMenuItemType =
  | DropdownItem
  | DropdownSeparator
  | DropdownSubMenu
  | DropdownSubComponent;

export default function MultiDropdownMenu({
  children,
  buttonClassName,
  buttonSize,
  variant,
  // Dropdown props (optional)
  dropdownLabel,
  dropdownItems,
  dropdownSubLabel,
  dropdownSubItems,
  dropdownSubIcon,
  align,
  side,
}: MultiDropdownMenuProps) {
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
                return renderDropdownItem(subItem, subIndex);
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );

      case "subcomponent":
        return (
          <DropdownMenuSub key={`submenu-${index}`}>
            <DropdownMenuSubTrigger>
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>{item.component}</DropdownMenuSubContent>
          </DropdownMenuSub>
        );

      case "item":
        return (
          <DropdownMenuItem key={`item-${index}`} onClick={item.onClick}>
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
                <DropdownMenuItem
                  key={`sub-item-${index}`}
                  onClick={item.onClick}
                >
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
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant={variant || "ghost"}
          size={buttonSize || "default"}
          className={cn(
            "text-muted-foreground hover:text-primary transition-colors",
            buttonClassName,
          )}
          asChild
        >
          <div>{children}</div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side}>
        <DropdownMenuLabel>{dropdownLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {dropdownItems?.map(renderDropdownItem)}
        {renderSubDropdownItems()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
