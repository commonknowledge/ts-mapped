import { Eye } from "lucide-react";
import { Toggle } from "@/shadcn/ui/toggle";
import { EyeOff } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shadcn/ui/tooltip";
import { TooltipProvider } from "@/shadcn/ui/tooltip";

export default function LayerVisibilityToggle({
  layer,
  setLayer,
}: {
  layer: boolean;
  setLayer: (layer: boolean) => void;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            pressed={layer}
            onPressedChange={setLayer}
            className="ml-auto"
          >
            {layer ? <Eye /> : <EyeOff />}
          </Toggle>
        </TooltipTrigger>
        <TooltipContent>
          <p>{layer ? "Hide" : "Show"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
