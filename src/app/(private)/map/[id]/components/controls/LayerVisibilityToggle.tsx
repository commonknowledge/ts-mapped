import { Eye } from "lucide-react";
import { EyeOff } from "lucide-react";
import { Toggle } from "@/shadcn/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { TooltipProvider } from "@/shadcn/ui/tooltip";

export default function LayerVisibilityToggle({
  layer,
  setLayer,
  backgroundColor,
}: {
  layer: boolean;
  setLayer: (layer: boolean) => void;
  backgroundColor: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            pressed={layer}
            onPressedChange={setLayer}
            className="group p-0 min-w-4 h-6"
          >
            <div
              className=" opacity-100 hover:opacity-100 transition-opacity w-3 h-3 flex items-center justify-center rounded-full"
              style={{
                backgroundColor: backgroundColor,
                opacity: layer ? 1 : 0.5,
              }}
            >
              {layer ? (
                <EyeOff className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
              ) : (
                <Eye className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
              )}
            </div>
          </Toggle>
        </TooltipTrigger>
        <TooltipContent>
          <p>{layer ? "Hide" : "Show"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
