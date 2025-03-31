import {
  SelectItem,
  SelectContent,
  SelectValue,
  SelectTrigger,
} from "@/shadcn/ui/select";
import { Label } from "@/shadcn/ui/label";
import { Select } from "@/shadcn/ui/select";
import { PlusIcon, Settings } from "lucide-react";
import Link from "next/link";
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
} from "@/shadcn/ui/dialog";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
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
      <DialogTrigger>
        <IconButtonWithTooltip tooltip="Settings">
          <Settings className="w-4 h-4" />
        </IconButtonWithTooltip>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Member Settings</DialogTitle>
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
          <Button asChild>
            <Link href="/data-sources/new">
              <PlusIcon className="w-4 h-4" />
              Add new data source
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
