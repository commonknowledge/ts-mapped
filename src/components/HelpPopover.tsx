import { InfoIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";

export function HelpPopover({ children }: { children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild={true}>
        <button className="flex items-center gap-1 text-xs cursor-pointer">
          <InfoIcon size={12} />
          Help
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-4 bg-blue-50 shadow-none border-none text-sm"
        side="right"
        sideOffset={16}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
