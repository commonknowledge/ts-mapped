import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shadcn/utils";
import type { LucideIcon } from "lucide-react";

interface TogglePanelProps {
  label: string;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  children?: React.ReactNode;
  headerRight?: React.ReactNode;
  rightIconButton?: LucideIcon;
  onRightIconButtonClick?: () => void;
}

export default function TogglePanel({
  label,
  icon: Icon,
  defaultExpanded = true,
  children,
  headerRight,
  rightIconButton: RightIconButton,
  onRightIconButtonClick,
}: TogglePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-neutral-100 rounded-lg p-2">
      <div className="flex items-center justify-between relative group">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 rounded mb-2 text-sm font-medium cursor-pointer"
        >
          {Icon}

          {label}
          <ChevronDown
            size={16}
            className={cn(
              "transition group-hover:opacity-100 opacity-0 ",
              expanded ? "rotate-0" : "-rotate-90",
            )}
          />
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
