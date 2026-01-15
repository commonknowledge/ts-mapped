import { CornerRightUp, PlusIcon } from "lucide-react";
import React from "react";
import { cn } from "@/shadcn/utils";
import MultiDropdownMenu from "@/components/MultiDropdownMenu";
import type { DropdownMenuItemType } from "@/components/MultiDropdownMenu";
import { Button } from "@/shadcn/ui/button";

// Shared button content component to ensure consistent styling
const AddLayerButtonContent = ({ message }: { message: React.ReactNode }) => (
  <div className="flex items-center gap-2">
    <PlusIcon size={16} /> {message}
  </div>
);

// Shared button styling classes - must match exactly
const sharedButtonClasses = "text-sm text-neutral-400 w-full hover:text-neutral-600 hover:bg-neutral-50 transition-colors";

// Shared button wrapper component that both cases use
const AddLayerButton = ({
  message,
  onClick,
  dropdownItems,
}: {
  message: React.ReactNode;
  onClick?: () => void;
  dropdownItems?: DropdownMenuItemType[];
}) => {
  const buttonContent = <AddLayerButtonContent message={message} />;

  if (dropdownItems) {
    return (
      <MultiDropdownMenu
        dropdownLabel="Marker options"
        dropdownItems={dropdownItems}
        align="start"
        side="right"
        buttonClassName={cn(sharedButtonClasses)}
        variant="outline"
        buttonSize="default"
      >
        {buttonContent}
      </MultiDropdownMenu>
    );
  }

  return (
    <Button
      variant="outline"
      className={cn(sharedButtonClasses)}
      onClick={onClick}
    >
      {buttonContent}
    </Button>
  );
};

export default function LayerEmptyMessage({
  message,
  onClick,
  dropdownItems,
  showAsButton = false,
}: {
  message: React.ReactNode;
  onClick?: () => void;
  dropdownItems?: DropdownMenuItemType[];
  showAsButton?: boolean;
}) {
  if (dropdownItems || showAsButton) {
    return <AddLayerButton message={message} onClick={onClick} dropdownItems={dropdownItems} />;
  }

  const Component = onClick ? "button" : "div";
  return (
    <Component
      onClick={onClick}
      className={cn(
        "text-sm text-neutral-400 p-2 text-right rounded bg-transparent flex items-center gap-2 justify-end",
        onClick &&
        "cursor-pointer hover:text-neutral-600 hover:bg-neutral-50 transition-colors"
      )}
    >
      {message} <CornerRightUp className="w-4 h-4 shrink-0" />
    </Component>
  );
}
