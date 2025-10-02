import { InfoIcon } from "lucide-react";
import { useState } from "react";
import Prose from "@/components/Prose";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { cn } from "@/shadcn/utils";

export function HelpPopover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild={true}>
        <button
          className={cn(
            "flex items-center gap-1 / font-medium text-xs / transition-color cursor-pointer",
            open ? "text-primary" : "text-[#678DE3]",
          )}
        >
          <InfoIcon size={12} />
          Help
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[344px] p-4 bg-blue-50 shadow-none border-none"
        side="right"
        sideOffset={16}
      >
        <Prose className="text-sm">{children}</Prose>
      </PopoverContent>
    </Popover>
  );
}
