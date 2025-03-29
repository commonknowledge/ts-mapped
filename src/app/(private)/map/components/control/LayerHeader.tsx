import React from "react";
import { mapColors } from "../../styles";
import { Label } from "@/shadcn/components/ui/label";
import LayerVisibilityToggle from "./LayerVisibilityToggle";
import { Plus } from "lucide-react";
import { DialogTrigger } from "@/shadcn/components/ui/dialog";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/components/ui/dialog";
import { Dialog } from "@/shadcn/components/ui/dialog";
export default function LayerHeader({
  label,
  color,
  showLayer,
  setLayer,
  addLayerModal,
}: {
  label: string;
  color: string;
  showLayer: boolean;
  setLayer: (layer: boolean) => void;
  addLayerModal: React.ReactNode;
}) {
  return (
    <div className="flex flex-row gap-2 items-center group">
      <div
        style={{ backgroundColor: color }}
        className="rounded-full w-3 h-3"
      />
      <Label>{label}</Label>
      <div className="flex flex-row ml-auto items-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          {addLayerModal && (
            <Dialog>
              <DialogTrigger asChild>
                <Plus className="h-4 w-4 opacity-80 hover:opacity-100 transition-opacity duration-300 cursor-pointer" />
              </DialogTrigger>
              <DialogContent className="w-[90vw] max-w-4xl h-[90vh] data-[state=open]:w-[90vw] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Layer</DialogTitle>
                </DialogHeader>
                {addLayerModal}
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <LayerVisibilityToggle layer={showLayer} setLayer={setLayer} />
        </div>
      </div>
    </div>
  );
}
