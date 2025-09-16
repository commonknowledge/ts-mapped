import { ChevronDown } from "lucide-react";
import { Badge } from "@/shadcn/ui/badge";
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
            className="max-w-full min-h-[2.5rem] h-auto justify-between text-start font-normal hover:bg-white cursor-auto"
          >
            {selectedOptions?.length ? (
              <div className="flex flex-wrap gap-1">
                {selectedOptions.map((option) => (
                  <Badge key={option} variant="outline">
                    {option}
                  </Badge>
                ))}
              </div>
            ) : (
              placeholder
            )}
            <ChevronDown className="text-muted-foreground opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        {/* Use DropdownMenuContent and DropdownMenuCheckboxItem as children */}
        {children}
      </DropdownMenu>
    </FormFieldWrapper>
  );
}
