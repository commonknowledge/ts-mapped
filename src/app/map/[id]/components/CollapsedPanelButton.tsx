import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { LucideIcon } from "lucide-react";

interface CollapsedPanelButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  ariaLabel: string;
  title?: string;
  badge?: number;
  className?: string;
}

export default function CollapsedPanelButton({
  icon: Icon,
  onClick,
  ariaLabel,
  title,
  badge,
  className,
}: CollapsedPanelButtonProps) {
  return (
    <div className={cn("flex absolute top-3 z-10 bg-white rounded-lg shadow-lg", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className="relative"
        aria-label={ariaLabel}
        title={title}
      >
        <Icon className="w-4 h-4" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#30a46c] text-[10px] font-semibold text-white">
            {badge}
          </span>
        )}
      </Button>
    </div>
  );
}
