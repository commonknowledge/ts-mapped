import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shadcn/utils";
import type { LucideIcon } from "lucide-react";

interface TogglePanelProps {
  label: string;
  icon?: LucideIcon;
  defaultExpanded?: boolean;
  children?: React.ReactNode;
  headerRight?: React.ReactNode;
  rightIconButton?: LucideIcon;
  onRightIconButtonClick?: () => void;
}

export default function TogglePanel({
  label,
  icon: Icon,
  defaultExpanded = false,
  children,
  headerRight,
  rightIconButton: RightIconButton,
  onRightIconButtonClick,
}: TogglePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div>
      <div className="flex items-center justify-between relative">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 hover:bg-neutral-100 rounded px-1 py-2 -mx-1 / text-sm font-medium cursor-pointer"
        >
          <ChevronDown
            size={16}
            className={cn(
              "transition-transform",
              expanded ? "rotate-0" : "-rotate-90",
            )}
          />

          {Icon && <Icon size={16} />}

          {label}
        </button>

        {headerRight && (
          <div className="shrink-0 ml-auto flex flex-row items-center">
            {headerRight}
          </div>
        )}

        {RightIconButton && (
          <button
            onClick={onRightIconButtonClick}
            className="p-2 hover:bg-neutral-100 rounded text-muted-foreground hover:text-foreground cursor-pointer ml-2"
            aria-label="Action button"
          >
            <RightIconButton size={16} />
          </button>
        )}
      </div>

      {expanded && <div>{children}</div>}
    </div>
  );
}
