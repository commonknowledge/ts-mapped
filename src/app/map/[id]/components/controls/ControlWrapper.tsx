import { EyeIcon, EyeOffIcon } from "lucide-react";
import { cn } from "@/shadcn/utils";
import type { LayerType } from "@/types";
import type { ReactNode } from "react";

export default function ControlWrapper({
  children,
  name,
  isVisible,
  onVisibilityToggle,
}: {
  children: ReactNode;
  name: string;
  isVisible: boolean;
  onVisibilityToggle: () => void;
  layerType?: LayerType;
  color?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex gap-1 text-sm",
        isVisible ? "opacity-100" : "opacity-70",
      )}
    >
      <div className="grow">{children}</div>
      <button
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-100 hover:bg-neutral-200 text-neutral-500 rounded p-1.5 flex items-center justify-center cursor-pointer"
        aria-label={`Toggle ${name} visibility`}
        onClick={onVisibilityToggle}
      >
        {isVisible ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
      </button>
    </div>
  );
}
