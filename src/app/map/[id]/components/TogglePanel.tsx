import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/shadcn/utils";
import type { LucideIcon } from "lucide-react";

interface TogglePanelProps {
  label: string;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  /** When provided, controls the expanded state externally (overrides internal toggle). */
  expanded?: boolean;
  children?: React.ReactNode;
  headerRight?: React.ReactNode;
  rightIconButton?: LucideIcon;
  onRightIconButtonClick?: () => void;
  wrapperClassName?: string;
}

export default function TogglePanel({
  label,
  icon: Icon,
  defaultExpanded = true,
  expanded: controlledExpanded,
  children,
  headerRight,
  rightIconButton: RightIconButton,
  onRightIconButtonClick,
  wrapperClassName,
}: TogglePanelProps) {
  const [internalExpanded, setInternalExpanded] = useState(controlledExpanded ?? defaultExpanded);

  useEffect(() => {
    if (controlledExpanded !== undefined) {
      setInternalExpanded(controlledExpanded);
    }
  }, [controlledExpanded]);

  const expanded = internalExpanded;

  return (
    <div className={cn("rounded-lg p-2", wrapperClassName ?? "bg-neutral-100")}>
      <div className="flex items-center justify-between relative group">
        <button
          onClick={() => setInternalExpanded(!expanded)}
          className="flex items-center gap-2 rounded  text-sm font-medium cursor-pointer"
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

      {expanded && <div className="pt-2">{children}</div>}
    </div>
  );
}
