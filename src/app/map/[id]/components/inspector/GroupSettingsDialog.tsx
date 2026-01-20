"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { Checkbox } from "@/shadcn/ui/checkbox";

export interface GroupSettings {
  isPercentage?: boolean;
  isScale?: boolean;
  lowerBound?: number;
  upperBound?: number;
  showAsBarChart?: boolean;
}

interface GroupSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  settings: GroupSettings | undefined;
  onSave: (settings: GroupSettings) => void;
}

export default function GroupSettingsDialog({
  open,
  onOpenChange,
  groupName,
  settings,
  onSave,
}: GroupSettingsDialogProps) {
  const [isPercentage, setIsPercentage] = useState(settings?.isPercentage ?? false);
  const [isScale, setIsScale] = useState(settings?.isScale ?? false);
  const [lowerBound, setLowerBound] = useState<string>(
    settings?.lowerBound?.toString() ?? ""
  );
  const [upperBound, setUpperBound] = useState<string>(
    settings?.upperBound?.toString() ?? ""
  );
  const [showAsBarChart, setShowAsBarChart] = useState(
    settings?.showAsBarChart ?? false
  );

  // Update state when settings prop changes
  useEffect(() => {
    if (settings) {
      setIsPercentage(settings.isPercentage ?? false);
      setIsScale(settings.isScale ?? false);
      setLowerBound(settings.lowerBound?.toString() ?? "");
      setUpperBound(settings.upperBound?.toString() ?? "");
      setShowAsBarChart(settings.showAsBarChart ?? false);
    }
  }, [settings, open]);

  const handleSave = () => {
    const newSettings: GroupSettings = {
      isPercentage: isPercentage || undefined,
      isScale: isScale || undefined,
      lowerBound: lowerBound ? parseFloat(lowerBound) : undefined,
      upperBound: upperBound ? parseFloat(upperBound) : undefined,
      showAsBarChart: showAsBarChart || undefined,
    };

    // Remove undefined values
    Object.keys(newSettings).forEach((key) => {
      if (newSettings[key as keyof GroupSettings] === undefined) {
        delete newSettings[key as keyof GroupSettings];
      }
    });

    onSave(newSettings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Group Settings</DialogTitle>
          <DialogDescription>
            Configure display settings for the "{groupName}" group
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is-percentage"
                checked={isPercentage}
                onCheckedChange={(checked) => setIsPercentage(checked === true)}
              />
              <Label htmlFor="is-percentage" className="cursor-pointer">
                Display as percentage
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Values will be multiplied by 100 and shown with a % symbol
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is-scale"
                checked={isScale}
                onCheckedChange={(checked) => setIsScale(checked === true)}
              />
              <Label htmlFor="is-scale" className="cursor-pointer">
                Use custom scale bounds
              </Label>
            </div>
            {isScale && (
              <div className="ml-6 space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="lower-bound" className="w-20 text-xs">
                    Lower:
                  </Label>
                  <Input
                    id="lower-bound"
                    type="number"
                    value={lowerBound}
                    onChange={(e) => setLowerBound(e.target.value)}
                    placeholder="0"
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="upper-bound" className="w-20 text-xs">
                    Upper:
                  </Label>
                  <Input
                    id="upper-bound"
                    type="number"
                    value={upperBound}
                    onChange={(e) => setUpperBound(e.target.value)}
                    placeholder="100"
                    className="flex-1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-bar-chart"
                checked={showAsBarChart}
                onCheckedChange={(checked) => setShowAsBarChart(checked === true)}
              />
              <Label htmlFor="show-bar-chart" className="cursor-pointer">
                Show as bar chart
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Display all columns in this group as a horizontal bar chart visualization
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
