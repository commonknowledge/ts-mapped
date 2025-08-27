import { ChevronDown } from "lucide-react";
import { Button } from "@/shadcn/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/shadcn/ui/dropdown-menu";

import FormFieldWrapper from "./FormFieldWrapper";

export default function CustomMultiSelect({
  children,
  id,
  label,
  selectedOptions,
  hint,
  placeholder = "Select",
}: {
  children: React.ReactNode;
  id: string;
  label: string;
  selectedOptions: string[];
  hint?: string;
  placeholder?: string;
}) {
  return (
    <FormFieldWrapper id={id} label={label} hint={hint}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild id={id}>
          <Button
            variant="outline"
            className="justify-between font-normal hover:bg-white cursor-auto"
          >
            <span>
              {selectedOptions?.length
                ? selectedOptions.join(", ")
                : placeholder}
            </span>
            <ChevronDown className="text-muted-foreground opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        {/* Use DropdownMenuContent and DropdownMenuCheckboxItem as children */}
        {children}
      </DropdownMenu>
    </FormFieldWrapper>
  );
}
