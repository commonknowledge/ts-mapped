import {
  SelectItem,
  SelectContent,
  SelectValue,
  SelectTrigger,
} from "@/shadcn/components/ui/select";
import { Label } from "@/shadcn/components/ui/label";
import { Select } from "@/shadcn/components/ui/select";
import { Settings } from "lucide-react";
import React from "react";
import { MapConfig } from "./Controls";
import { DataSourcesQuery } from "@/__generated__/types";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/components/ui/dialog";
import { Button } from "@/shadcn/components/ui/button";
import { Separator } from "@/shadcn/components/ui/separator";

export default function SettingsModal({
  mapConfig,
  onChange,
  dataSources,
}: {
  mapConfig: MapConfig;
  onChange: (mapConfig: Partial<MapConfig>) => void;
  dataSources: DataSourcesQuery["dataSources"];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="ml-auto">
          <Settings className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <DialogDescription>Adjust the map settings</DialogDescription>
        <Separator />
        <div className="flex flex-col gap-2">
          <Label htmlFor="markersDataSourceId">Markers Data Source</Label>
          <Select
            value={mapConfig.markersDataSourceId}
            onValueChange={(value) => onChange({ markersDataSourceId: value })}
          >
            <SelectTrigger className="w-full shadow-none">
              <SelectValue placeholder="Select a markers data source" />
            </SelectTrigger>
            <SelectContent>
              {dataSources.map((ds: { id: string; name: string }) => (
                <SelectItem key={ds.id} value={ds.id}>
                  {ds.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </DialogContent>
    </Dialog>
  );
}
